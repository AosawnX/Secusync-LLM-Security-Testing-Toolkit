import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Download, Clock } from 'lucide-react'

interface Run {
    id: string
    target_id: string
    target_name?: string
    status: string
    created_at: string
    completed_at: string | null
    result_summary: string | null
    vulnerability_score?: number
}

export function Reports() {
    const [runs, setRuns] = useState<Run[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('http://localhost:8000/api/runs/')
            .then(res => res.json())
            .then((data: any[]) => {
                // Filter only completed runs
                const completedRuns = data.filter(r => r.status === 'completed')
                setRuns(completedRuns)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) return <div className="p-8 text-gray-500">Loading reports...</div>

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    Security Reports
                </h1>
                <p className="text-gray-500 mt-2">Access and download detailed security assessment reports.</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {runs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No reports available yet. Complete a vulnerability scan to generate a report.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {runs.map((run) => (
                                <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-gray-900">
                                                <Link to={`/executions/${run.id}`} className="hover:text-blue-600">
                                                    {run.target_name || run.target_id || run.id.slice(0, 8)}
                                                </Link>
                                                <div className="text-xs text-gray-400 font-mono">{run.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {new Date(run.created_at).toLocaleDateString()} {new Date(run.created_at).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(run.vulnerability_score || 0) > 7 ? 'bg-red-100 text-red-800' :
                                            (run.vulnerability_score || 0) > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'}`}>
                                            Score: {run.vulnerability_score?.toFixed(1) || 0.0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <a
                                                href={`http://localhost:8000/api/runs/${run.id}/report/technical`}
                                                target="_blank"
                                                className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                                title="Download Technical Report"
                                            >
                                                <Download className="h-4 w-4" />
                                                Technical
                                            </a>
                                            <a
                                                href={`http://localhost:8000/api/runs/${run.id}/report/executive`}
                                                target="_blank"
                                                className="text-purple-600 hover:text-purple-900 inline-flex items-center gap-1"
                                                title="Download Executive Report"
                                            >
                                                <Download className="h-4 w-4" />
                                                Executive
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
