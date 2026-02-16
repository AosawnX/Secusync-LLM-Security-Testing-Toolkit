import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Activity, Clock } from 'lucide-react'

interface Target {
    id: string
    name: string
    target_type: string
    created_at: string
    base_url?: string
}

interface Run {
    id: string
    status: string
    created_at: string
    result_summary: string | null
    visible_in_history?: boolean
}

export function RunDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [target, setTarget] = useState<Target | null>(null)
    const [runs, setRuns] = useState<Run[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch Target Details
        fetch(`http://localhost:8000/api/targets/${id}`)
            .then(res => res.json())
            .then(data => {
                setTarget(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })

        // Fetch Runs (Mock: fetching ALL runs and filtering. In prod, fetch by target_id)
        fetch('http://localhost:8000/api/runs/')
            .then(res => res.json())
            .then((data: any[]) => {
                // Filter runs for this target (assuming API returns all runs)
                // Note: Our API endpoint returns minimal info, let's assume it returns `target_id`
                const targetRuns = data.filter(r => r.target_id === id)
                setRuns(targetRuns)
            })
            .catch(console.error)
    }, [id])

    const handleStartRun = async () => {
        if (!target) return

        try {
            const res = await fetch('http://localhost:8000/api/runs/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_id: target.id,
                    attack_class: 'prompt_injection'
                })
            })

            if (res.ok) {
                const run = await res.json()
                navigate(`/executions/${run.id}`)
            } else {
                alert("Failed to start run")
            }
        } catch (err) {
            console.error(err)
            alert("Error starting run")
        }
    }

    if (loading) return <div className="p-8 text-gray-500">Loading details...</div>
    if (!target) return <div className="p-8 text-red-500">Target not found</div>

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-4">
                <Link to="/targets" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{target.name}</h1>
                    <p className="text-gray-500 font-mono text-sm">{target.id}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            Target Configuration
                        </h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Target Type</dt>
                                <dd className="mt-1 text-sm text-gray-900 capitalize bg-gray-50 inline-block px-2 py-1 rounded">{target.target_type.replace('_', ' ')}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                                <dd className="mt-1 text-sm text-gray-900">{new Date(target.created_at).toLocaleString()}</dd>
                            </div>
                            {target.base_url && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Base URL</dt>
                                    <dd className="mt-1 text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded block overflow-hidden text-ellipsis">{target.base_url}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Run History</h2>
                            {runs.some(r => r.visible_in_history !== false) && (
                                <button
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to clear history? Reports will still be available.")) {
                                            await fetch(`http://localhost:8000/api/runs/clear-history?target_id=${id}`, { method: 'POST' })
                                            // Refresh
                                            window.location.reload()
                                        }
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 underline"
                                >
                                    Clear History
                                </button>
                            )}
                        </div>
                        {runs.filter(r => r.visible_in_history !== false).length === 0 ? (
                            <p className="text-gray-400 italic">No runs executed yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {runs.filter(r => r.visible_in_history !== false).map(run => (
                                    <li key={run.id} className="py-3 flex justify-between items-center group">
                                        <div>
                                            <p className="font-medium text-gray-900">Run {run.id.slice(0, 8)}...</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(run.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 text-xs rounded-full border ${run.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                run.status === 'failed' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                }`}>
                                                {run.status}
                                            </span>
                                            <Link to={`/executions/${run.id}`} className="px-3 py-1 bg-white border border-gray-200 text-xs font-medium text-gray-600 rounded hover:bg-gray-50 hover:text-blue-600 transition-colors">
                                                View Details
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold mb-4">Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={handleStartRun}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Play className="h-4 w-4" />
                                Start Attack
                            </button>
                            <button className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors">
                                Test Connection
                            </button>
                            <button className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors">
                                Edit Configuration
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
