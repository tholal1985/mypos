import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, LayoutGrid, Star } from 'lucide-react'

export default function CustomDashboard() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '', is_default: false })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('custom_dashboards').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.name) return
    const payload = { name: form.name, description: form.description, is_default: form.is_default }
    if (editing) await supabase.from('custom_dashboards').update(payload).eq('id', editing.id)
    else await supabase.from('custom_dashboards').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', description: '', is_default: false }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this dashboard?')) { await supabase.from('custom_dashboards').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="Custom Dashboards" subtitle={`${items.length} dashboards`} actions={<button onClick={() => { setEditing(null); setForm({ name: '', description: '', is_default: false }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> New Dashboard</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<LayoutGrid className="w-8 h-8" />} title="No custom dashboards" description="Create custom dashboards with widgets tailored to your needs." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Dashboard</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(d => (
              <div key={d.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><LayoutGrid className="w-5 h-5 text-primary-600" /></div>
                    {d.is_default && <Star className="w-4 h-4 text-warning-500 fill-warning-500" />}
                  </div>
                  <div className="flex gap-1"><button onClick={() => { setEditing(d); setForm({ name: d.name, description: d.description || '', is_default: d.is_default }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(d.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
                </div>
                <p className="font-semibold text-gray-900 mt-3">{d.name}</p>
                {d.description && <p className="text-sm text-gray-500 mt-1">{d.description}</p>}
                <p className="text-xs text-gray-400 mt-2">Created {formatDate(d.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Dashboard' : 'New Dashboard'}>
        <div className="space-y-4">
          <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" rows={3} /></div>
          <div><label className="label flex items-center gap-2"><input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} /> Set as default dashboard</label></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
