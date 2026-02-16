import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldAlert, Cpu, Globe } from 'lucide-react'

export function NewRun() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        name: '',
        target_type: 'local_harness',
        base_url: '',
        api_key: ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('http://localhost:8000/api/targets/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                navigate('/')
            } else {
                alert('Failed to create target')
            }
        } catch (err) {
            console.error(err)
            alert('Error connecting to backend')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">New Security Run</h1>
                <p className="text-gray-500">Configure your target and launch characterization.</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Name</label>
                    <input
                        required
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Corporate ChatBot V1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Target Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.target_type === 'local_harness' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setFormData({ ...formData, target_type: 'local_harness' })}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Cpu className={`h-5 w-5 ${formData.target_type === 'local_harness' ? 'text-blue-600' : 'text-gray-500'}`} />
                                <span className="font-medium text-gray-900">Local Harness</span>
                            </div>
                            <p className="text-xs text-gray-500">Internal mock target for demonstration safely.</p>
                        </div>

                        <div
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.target_type === 'chat_api' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setFormData({ ...formData, target_type: 'chat_api' })}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Globe className={`h-5 w-5 ${formData.target_type === 'chat_api' ? 'text-blue-600' : 'text-gray-500'}`} />
                                <span className="font-medium text-gray-900">External Chat API</span>
                            </div>
                            <p className="text-xs text-gray-500">Connect to OpenAI, Anthropic or custom endpoint.</p>
                        </div>
                    </div>
                </div>

                {formData.target_type === 'chat_api' && (
                    <div className="space-y-4 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                            <input
                                type="url"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.base_url}
                                onChange={e => setFormData({ ...formData, base_url: e.target.value })}
                                placeholder="https://api.openai.com/v1..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                            <input
                                type="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.api_key}
                                onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                                placeholder="sk-..."
                            />
                        </div>
                    </div>
                )}

                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                        <strong>Authorization Required:</strong> By proceeding, you verify you are authorized to test this target. All actions are logged.
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    {loading ? 'Validating...' : (
                        <>
                            Initialize Target <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}
