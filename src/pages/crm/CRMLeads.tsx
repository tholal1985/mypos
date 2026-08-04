import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, UserPlus, Phone, Mail } from 'lucide-react'

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'yellow' | 'green' | 'red'> = {
  new: 'gray', contacted: 'blue', qualified: 'yellow', won: 'green', lost: 'red',
}

export default function CRMLeads() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: '', status: 'new', notes: '' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('crm_leads').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.name) return
    if (editing) await supabase.from('crm_leads').update(form).eq('id', editing.id)
    else await supabase.from('crm_leads').insert({ ...form, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', email: '', phone: '', source: '', status: 'new', notes: '' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this lead?')) { await supabase.from('crm_leads').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="CRM Leads" subtitle={`${items.length} leads`} actions={<button onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', source: '', status: 'new', notes: '' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Lead</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<UserPlus className="w-8 h-8" />} title="No leads" description="Track sales leads and follow-ups." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Lead</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(l => (
              <div key={l.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div><p className="font-medium text-gray-900">{l.name}</p><Badge color={STATUS_COLORS[l.status] || 'gray'}>{l.status}</Badge></div>
                  <div className="flex gap-1"><button onClick={() => { setEditing(l); setForm({ name: l.name, email: l.email || '', phone: l.phone || '', source: l.source || '', status: l.status, notes: l.notes || '' }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(l.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  {l.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</span>}
                  {l.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{l.email}</span>}
                  {l.source && <p>Source: {l.source}</p>}
                  {l.notes && <p className="mt-2 text-gray-400">{l.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Lead' : 'Add Lead'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
            <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="won">Won</option><option value="lost">Lost</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" /></div>
            <div><label className="label">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Source</label><input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="input" placeholder="e.g. Website, Referral" /></div>
          <div><label className="label">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" rows={3} /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
