import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react'

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'green' | 'yellow'> = {
  planning: 'gray', active: 'blue', completed: 'green', on_hold: 'yellow',
}

export default function Projects() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '', status: 'planning', start_date: '', end_date: '', budget: '0' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.name) return
    const payload = { name: form.name, description: form.description, status: form.status, start_date: form.start_date || null, end_date: form.end_date || null, budget: parseFloat(form.budget) || 0 }
    if (editing) await supabase.from('projects').update(payload).eq('id', editing.id)
    else await supabase.from('projects').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', description: '', status: 'planning', start_date: '', end_date: '', budget: '0' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this project?')) { await supabase.from('projects').delete().eq('id', id); load() } }
  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Projects" subtitle={`${items.length} projects`} actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Project</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<FolderKanban className="w-8 h-8" />} title="No projects" description="Manage business projects and budgets." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Project</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(p => (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div><p className="font-semibold text-gray-900">{p.name}</p><Badge color={STATUS_COLORS[p.status] || 'gray'}>{p.status.replace('_', ' ')}</Badge></div>
                  <div className="flex gap-1"><button onClick={() => { setEditing(p); setForm({ name: p.name, description: p.description || '', status: p.status, start_date: p.start_date || '', end_date: p.end_date || '', budget: String(p.budget) }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(p.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
                </div>
                {p.description && <p className="text-sm text-gray-500 mt-2">{p.description}</p>}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{p.start_date ? formatDate(p.start_date) : 'No date'}</span>
                  <span className="text-sm font-semibold">{formatCurrency(Number(p.budget), business?.currency, sym)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Project' : 'New Project'} size="lg">
        <div className="space-y-4">
          <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" rows={3} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="planning">Planning</option><option value="active">Active</option><option value="completed">Completed</option><option value="on_hold">On Hold</option></select></div>
            <div><label className="label">Start Date</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input" /></div>
            <div><label className="label">End Date</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Budget</label><input type="number" step="0.01" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="input" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
