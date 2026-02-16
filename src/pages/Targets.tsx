import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Target as TargetIcon, Cpu, Globe, ArrowRight, ShieldAlert, X, Trash2, Edit2 } from 'lucide-react'

interface Target {
    id: string
    name: string
    target_type: string
    created_at: string
    base_url?: string
    api_key?: string
    model_name?: string
}

export function Targets() {
    const navigate = useNavigate()
    const [targets, setTargets] = useState<Target[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewTarget, setShowNewTarget] = useState(false)
    const [editingTargetId, setEditingTargetId] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        target_type: 'local_harness',
        base_url: '',
        api_key: '',
        model_name: 'gpt-3.5-turbo'
    })
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchTargets()
    }, [])

    const fetchTargets = () => {
        fetch('http://localhost:8000/api/targets/')
            .then(res => res.json())
            .then(data => {
                setTargets(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete target "${name}"? This action cannot be undone.`)) return

        try {
            const res = await fetch(`http://localhost:8000/api/targets/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setTargets(targets.filter(t => t.id !== id))
            } else {
                alert('Failed to delete target')
            }
        } catch (err) {
            console.error(err)
            alert('Error deleting target')
        }
    }

    const handleEdit = (target: Target) => {
        setEditingTargetId(target.id)
        setFormData({
            name: target.name,
            target_type: target.target_type,
            base_url: target.base_url || '',
            api_key: target.api_key || '',
            model_name: target.model_name || 'gpt-3.5-turbo'
        })
        setShowNewTarget(true)
    }

    const handleCreateOrUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        // Clean data
        const payload = {
            ...formData,
            api_key: formData.api_key.trim(),
            base_url: formData.base_url.trim(),
            name: formData.name.trim(),
            model_name: formData.model_name.trim()
        }

        try {
            const url = editingTargetId
                ? `http://localhost:8000/api/targets/${editingTargetId}`
                : 'http://localhost:8000/api/targets/'

            const method = editingTargetId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                // Refresh list and close form
                fetchTargets()
                setShowNewTarget(false)
                setEditingTargetId(null)
                setFormData({ name: '', target_type: 'local_harness', base_url: '', api_key: '', model_name: 'gpt-3.5-turbo' })
            } else {
                alert(`Failed to ${editingTargetId ? 'update' : 'create'} target`)
            }
        } catch (err) {
            console.error(err)
            alert('Error connecting to backend')
        } finally {
            setCreating(false)
        }
    }

    const closeForm = () => {
        setShowNewTarget(false)
        setEditingTargetId(null)
        setFormData({ name: '', target_type: 'local_harness', base_url: '', api_key: '', model_name: 'gpt-3.5-turbo' })
    }

    if (loading) return <div className="p-8 text-gray-500">Loading targets...</div>

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <TargetIcon className="h-8 w-8 text-blue-600" />
                        Targets
                    </h1>
                    <p className="text-gray-500 mt-2">Manage your security targets and endpoints.</p>
                </div>
                {!showNewTarget && (
                    <button
                        onClick={() => setShowNewTarget(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Plus className="h-5 w-5" />
                        Add New Target
                    </button>
                )}
            </header>

            {showNewTarget && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 ring-1 ring-blue-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">{editingTargetId ? 'Edit Target' : 'Configure New Target'}</h2>
                        <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateOrUpdateSubmit} className="space-y-6">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.model_name}
                                        onChange={e => setFormData({ ...formData, model_name: e.target.value })}
                                        placeholder="gpt-3.5-turbo (or llama-3.3-70b-versatile for Groq)"
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

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={closeForm}
                                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                {creating ? 'Saving...' : (
                                    <>
                                        {editingTargetId ? 'Update Target' : 'Create Target'} <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {targets.length === 0 && !showNewTarget ? (
                    <div className="p-12 text-center text-gray-500 bg-gray-50">
                        <TargetIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No targets found</h3>
                        <p className="mb-6">Get started by adding your first target.</p>
                        <button
                            onClick={() => setShowNewTarget(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-700 transition"
                        >
                            <Plus className="h-5 w-5" />
                            Add New Target
                        </button>
                    </div>
                ) : targets.length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {targets.map((target) => (
                                <tr key={target.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-gray-900">{target.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 capitalize">{target.target_type.replace('_', ' ')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {new Date(target.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                                        <Link
                                            to={`/runs/${target.id}`}
                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                        >
                                            View Setup
                                        </Link>
                                        <button
                                            onClick={() => handleEdit(target)}
                                            className="text-gray-500 hover:text-blue-600 transition-colors"
                                            title="Edit Target"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(target.id, target.name)}
                                            className="text-gray-500 hover:text-red-600 transition-colors"
                                            title="Delete Target"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
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
