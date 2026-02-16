import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Target {
    id: string
    name: string
    target_type: string
    created_at: string
}

export function Dashboard() {
    const [targets, setTargets] = useState<Target[]>([])
    const [allRuns, setAllRuns] = useState<any[]>([])
    const [filter, setFilter] = useState('7d')
    const [stats, setStats] = useState({
        totalRuns: 0,
        activeTargets: 0,
        vulnerabilities: 0,
        successRate: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [targetsRes, runsRes] = await Promise.all([
                    fetch('/api/targets/'),
                    fetch('/api/runs/')
                ])

                const targetsData = await targetsRes.json()
                const runsData = await runsRes.json()

                setTargets(targetsData)
                setAllRuns(runsData)
                setLoading(false)
            } catch (err) {
                console.error(err)
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        if (loading) return

        const now = new Date()
        const filterDate = new Date()

        if (filter === 'today') filterDate.setHours(0, 0, 0, 0)
        else if (filter === '7d') filterDate.setDate(now.getDate() - 7)
        else if (filter === '30d') filterDate.setDate(now.getDate() - 30)
        else if (filter === '90d') filterDate.setDate(now.getDate() - 90)

        const filteredRuns = allRuns.filter((r: any) => new Date(r.created_at) >= filterDate)

        // Calculate Stats
        const totalRuns = filteredRuns.length
        const activeTargets = targets.length // Targets are always active irrespective of run filter? Or should we filter targets created? Usually active targets is total.
        const vulnerabilities = filteredRuns.reduce((acc: number, run: any) => acc + (run.findings?.length || 0), 0)

        const completedRuns = filteredRuns.filter((r: any) => r.status === 'completed')
        const runsWithVulns = completedRuns.filter((r: any) => (r.findings?.length || 0) > 0)
        const successRate = completedRuns.length > 0
            ? Math.round((runsWithVulns.length / completedRuns.length) * 100)
            : 0

        setStats({
            totalRuns,
            activeTargets, // Keep total active targets
            vulnerabilities,
            successRate
        })

    }, [filter, allRuns, targets, loading])

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome to SECUSYNC Prototype.</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="today">Today</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                    </select>
                    <Link to="/targets" className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
                        <Plus className="h-5 w-5" />
                        New Run
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Runs</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalRuns}</h3>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {filter === 'today' ? 'Today' : filter}
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">Active Targets</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.activeTargets}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">Vulnerabilities</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-gray-900">{stats.vulnerabilities}</h3>
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Action required</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">Success Rate</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-gray-900">{stats.successRate}%</h3>
                        <span className="text-xs text-gray-400">Detection efficiency</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Targets</h2>
                {loading ? (
                    <p className="text-gray-400">Loading targets...</p>
                ) : targets.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-400 mb-4">No targets configured yet.</p>
                        <Link to="/targets" className="text-blue-600 font-medium hover:underline">Create your first target</Link>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {targets.map(t => (
                            <li key={t.id} className="py-3 flex justify-between items-center group">
                                <div>
                                    <Link to={`/runs/${t.id}`} className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors block">
                                        {t.name}
                                    </Link>
                                    <p className="text-xs text-gray-500 capitalize">{t.target_type.replace('_', ' ')} • {new Date(t.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">Ready</span>
                                    <Link to={`/runs/${t.id}`} className="text-sm text-gray-400 hover:text-gray-600">View</Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
