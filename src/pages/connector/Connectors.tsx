import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { Plus, Pencil, Trash2, Plug, RefreshCw } from 'lucide-react'

const STATUS_COLORS: Record<string, 'green' | 'gray' | 'red' | 'yellow'> = { active: 'green', inactive: 'gray', error: 'red', syncing: 'yellow' }

export default function Connectors() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', provider: '', api_url: '', auth_type: 'api_key', api_key: '', status: 'inactive' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('api_connectors').select('id, business_id, name, provider, api_url, auth_type, status, last_sync_at, created_at').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.name) return
    const payload: Record<string, unknown> = { name: form.name, provider: form.provider, api_url: form.api_url, auth_type: form.auth_type, status: form.status }
    if (form.api_key) payload.credentials = { api_key: form.api_key }
    else if (!editing) payload.credentials = {}
    if (editing) await supabase.from('api_connectors').update(payload).eq('id', editing.id)
    else await supabase.from('api_connectors').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', provider: '', api_url: '', auth_type: 'api_key', api_key: '', status: 'inactive' }); load()
  }

  const toggleStatus = async (c: any) => {
    const newStatus = c.status === 'active' ? 'inactive' : 'active'
    await supabase.from('api_connectors').update({ status: newStatus, last_sync_at: newStatus === 'active' ? new Date().toISOString() : c.last_sync_at }).eq('id', c.id)
    load()
  }

  const del = async (id: string) => { if (confirm('Delete this connector?')) { await supabase.from('api_connectors').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="API Connectors" subtitle={`${items.length} integrations`} actions={<button onClick={() => { setEditing(null); setForm({ name: '', provider: '', api_url: '', auth_type: 'api_key', api_key: '', status: 'inactive' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Connector</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Plug className="w-8 h-8" />} title="No connectors" description="Connect external APIs and services to sync data." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Connector</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(c => (
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Plug className="w-5 h-5 text-primary-600" /></div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleStatus(c)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="Toggle"><RefreshCw className="w-4 h-4" /></button>
                    <button onClick={() => { setEditing(c); setForm({ name: c.name, provider: c.provider, api_url: c.api_url || '', auth_type: c.auth_type, api_key: '', status: c.status }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(c.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500 capitalize">{c.provider}</p>
                <div className="mt-2"><Badge color={STATUS_COLORS[c.status] || 'gray'}>{c.status}</Badge></div>
                {c.last_sync_at && <p className="text-xs text-gray-400 mt-2">Last sync: {formatDateTime(c.last_sync_at)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Connector' : 'Add Connector'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
            <div><label className="label">Provider</label><input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className="input" placeholder="e.g. Shopify, Stripe" /></div>
          </div>
          <div><label className="label">API URL</label><input value={form.api_url} onChange={e => setForm({ ...form, api_url: e.target.value })} className="input" placeholder="https://api.example.com" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Auth Type</label><select value={form.auth_type} onChange={e => setForm({ ...form, auth_type: e.target.value })} className="input"><option value="api_key">API Key</option><option value="bearer">Bearer Token</option><option value="basic">Basic Auth</option><option value="oauth">OAuth</option></select></div>
            <div><label className="label">API Key / Token</label><input type="password" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} className="input" placeholder={editing ? 'Enter new key to replace' : 'Enter API key'} /></div>
          </div>
          <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="inactive">Inactive</option><option value="active">Active</option></select></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
