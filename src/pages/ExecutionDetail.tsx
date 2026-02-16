import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Play, AlertTriangle, CheckCircle, Terminal, FileText as FileTex, RotateCw, Briefcase, Archive, Clock } from 'lucide-react'

interface Finding {
    type: string
    severity: string
    description: string
}

interface Run {
    id: string
    target_id: string
    target_name?: string
    status: string
    created_at: string
    completed_at: string | null
    result_summary: string | null
    findings?: Finding[]
    vulnerability_score?: number
}

export function ExecutionDetail() {
    const { id } = useParams()
    const [run, setRun] = useState<Run | null>(null)
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<any[]>([])

    // History State
    const [historyRuns, setHistoryRuns] = useState<Run[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)

    useEffect(() => {
        let intervalId: any

        const fetchRunAndHistory = async () => {
            console.log("Fetching run details for:", id)
            try {
                // Fetch Run Details
                const res = await fetch(`http://localhost:8000/api/runs/${id}`)
                if (!res.ok) {
                    console.error("Run fetch failed:", res.status)
                    throw new Error("Run not found")
                }
                const data = await res.json()
                console.log("Run data received:", data)
                setRun(data)
                setLoading(false)

                // Fetch Logs
                const logsRes = await fetch(`http://localhost:8000/api/runs/${id}/logs`)
                if (logsRes.ok) {
                    const logsData = await logsRes.json()
                    setLogs(logsData)
                }

                // Fetch History (Only if we have target_id from run data)
                if (data.target_id) {
                    console.log("Fetching history for target:", data.target_id)
                    const histRes = await fetch(`http://localhost:8000/api/runs/?target_id=${data.target_id}`)
                    if (histRes.ok) {
                        const histData = await histRes.json()
                        console.log("History received:", histData.length, "items")
                        // Filter out current run from history list if desired, or keep it.
                        // Let's keep it but maybe highlight it? For now just list all.
                        setHistoryRuns(histData)
                    } else {
                        console.error("History fetch failed:", histRes.status)
                    }
                    setHistoryLoading(false)
                }

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(intervalId)
                }
            } catch (err) {
                console.error("Error in fetchRunAndHistory:", err)
                setLoading(false)
                setHistoryLoading(false)
            }
        }

        fetchRunAndHistory()
        intervalId = setInterval(fetchRunAndHistory, 2000)

        return () => clearInterval(intervalId)
    }, [id])

    if (loading) return <div className="p-8 text-gray-500">Loading run details...</div>
    if (!run) return <div className="p-8 text-red-500">Run not found</div>

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-4">
                <Link to={`/runs/${run.target_id}`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        {run.target_name || "Run Execution"}
                        <span className={`px-3 py-1 text-sm rounded-full border ${run.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                            run.status === 'failed' ? 'bg-red-50 text-red-700 border-red-100' :
                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                            }`}>
                            {run.status.toUpperCase()}
                        </span>
                    </h1>
                    <p className="text-gray-500 font-mono text-sm">ID: {run.id}</p>
                </div>
                <div>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                if (!run) return
                                try {
                                    const res = await fetch('http://localhost:8000/api/runs/', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            target_id: run.target_id,
                                            attack_class: 'prompt_injection'
                                        })
                                    })
                                    if (res.ok) {
                                        const newRun = await res.json()
                                        // Force navigation to new run
                                        window.location.href = `/executions/${newRun.id}`
                                    } else {
                                        alert("Failed to restart run")
                                    }
                                } catch (err) {
                                    console.error(err)
                                    alert("Error restarting run")
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center gap-2"
                        >
                            <RotateCw className="h-4 w-4" />
                            <span>Retry Attack</span>
                        </button>
                        {run.status === 'completed' && (
                            <>
                                <button
                                    onClick={() => window.open(`http://localhost:8000/api/runs/${run.id}/report/technical`, '_blank')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-flex items-center gap-2"
                                    title="Download technical details"
                                >
                                    <FileTex className="h-4 w-4" />
                                    <span>Technical Report</span>
                                </button>
                                <button
                                    onClick={() => window.open(`http://localhost:8000/api/runs/${run.id}/report/executive`, '_blank')}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded inline-flex items-center gap-2"
                                    title="AI-generated executive summary"
                                >
                                    <Briefcase className="h-4 w-4" />
                                    <span>Executive Report</span>
                                </button>
                                <button
                                    disabled={!run.findings || run.findings.length === 0}
                                    onClick={() => window.open(`http://localhost:8000/api/runs/${run.id}/report/poc`, '_blank')}
                                    className={`font-bold py-2 px-4 rounded inline-flex items-center gap-2 ${!run.findings || run.findings.length === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                        }`}
                                    title={!run.findings || run.findings.length === 0 ? "No vulnerabilities found" : "Download reproduction guide"}
                                >
                                    <Archive className="h-4 w-4" />
                                    <span>POC Bundle</span>
                                </button>
                                <a href={`http://localhost:8000/api/runs/${run.id}/report`} target="_blank" className="bg-white border hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded inline-flex items-center gap-2">
                                    <span>Export Report</span>
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold mb-4">Summary</h2>
                    <p className="text-gray-700">{run.result_summary || "No summary available yet."}</p>
                    <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Started: {new Date(run.created_at).toLocaleString()}
                        </div>
                        {run.completed_at && (
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Completed: {new Date(run.completed_at).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Vulnerability Assessment
                    </h2>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Score</p>
                            <p className="text-3xl font-bold text-gray-900">{run.vulnerability_score?.toFixed(1) || 0.0}<span className="text-sm text-gray-400">/10</span></p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Findings</p>
                            <p className="text-3xl font-bold text-gray-900">{run.findings?.length || 0}</p>
                        </div>
                    </div>
                    <ul className="space-y-2">
                        {run.findings && run.findings.length > 0 ? (
                            run.findings.map((f, i) => (
                                <li key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                                    <span className="font-bold uppercase text-xs mr-2 border border-red-200 px-1 rounded bg-white">{f.severity}</span>
                                    {f.description}
                                </li>
                            ))
                        ) : (
                            <li className="text-sm text-gray-400 italic">No vulnerabilities detected.</li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-xl shadow-lg border border-gray-800 h-96 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                    <Terminal className="h-4 w-4" />
                    <span>Execution Logs</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                    {logs.length === 0 ? (
                        <p className="opacity-50">Waiting for logs...</p>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="border-b border-gray-900 pb-2 mb-2">
                                <div className="text-blue-400 flex gap-2">
                                    <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                    <span>&gt; {log.prompt}</span>
                                </div>
                                <div className="text-gray-300 pl-4 mt-1 whitespace-pre-wrap">
                                    {log.response}
                                </div>

                                {log.analysis && (
                                    <div className="pl-4 mt-2 flex gap-4">
                                        {/* Regex Result */}
                                        <div className="flex-1 border border-gray-800 rounded p-2 bg-gray-900/50">
                                            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Regex Check</div>
                                            {log.analysis.findings && log.analysis.findings.some((f: any) => f.source === 'regex') ? (
                                                log.analysis.findings.filter((f: any) => f.source === 'regex').map((f: any, idx: number) => (
                                                    <div key={idx} className="text-red-400 text-xs font-mono">{typeof f === 'string' ? f : f.description}</div>
                                                ))
                                            ) : (
                                                <div className="text-green-500 text-xs font-mono">Clean</div>
                                            )}
                                        </div>

                                        {/* Judge Result */}
                                        <div className="flex-1 border border-gray-800 rounded p-2 bg-gray-900/50">
                                            <div className="text-xs uppercase text-purple-400 font-bold mb-1 flex items-center gap-1">
                                                <span>SecuSync Judge</span>
                                            </div>
                                            {log.analysis.findings && log.analysis.findings.some((f: any) => f.source === 'llm_judge') ? (
                                                log.analysis.findings.filter((f: any) => f.source === 'llm_judge').map((f: any, idx: number) => (
                                                    <div key={idx} className={`${f.score > 0.7 ? 'text-red-400' : 'text-yellow-400'} text-xs font-mono`}>
                                                        {f.description}
                                                    </div>
                                                ))
                                            ) : (
                                                // Optional: Show "Clean" if we know Judge ran. But logs don't say if Judge ran unless there's a finding.
                                                // Ideally we'd have a flag "judge_executed". For now, if no judge finding, assume clean or skipped.
                                                <div className="text-gray-500 text-xs italic">No vulnerabilities flagged</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    Run History
                </h2>
                <div className="space-y-3">
                    {historyLoading ? (
                        <p className="text-gray-400 text-sm">Loading history...</p>
                    ) : historyRuns.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">No previous runs.</p>
                    ) : (
                        historyRuns.map((hRun) => (
                            <Link key={hRun.id} to={`/executions/${hRun.id}`} className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${hRun.status === 'completed' ? 'bg-green-500' : hRun.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                        <span className="text-sm font-medium text-gray-900">
                                            {new Date(hRun.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {hRun.vulnerability_score !== undefined && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${hRun.vulnerability_score > 0.7 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            Score: {hRun.vulnerability_score.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 flex justify-between">
                                    <span>{hRun.id.slice(0, 8)}...</span>
                                    <span>{hRun.findings ? hRun.findings.length : 0} Findings</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
