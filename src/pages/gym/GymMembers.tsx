import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, Dumbbell, Phone, Mail } from 'lucide-react'

const STATUS_COLORS: Record<string, 'green' | 'red' | 'gray'> = {
  active: 'green', expired: 'red', cancelled: 'gray',
}

export default function GymMembers() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', membership_type: 'monthly', start_date: '', expiry_date: '', status: 'active' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('gym_members').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.name) return
    const payload = { ...form, start_date: form.start_date || null, expiry_date: form.expiry_date || null }
    if (editing) await supabase.from('gym_members').update(payload).eq('id', editing.id)
    else await supabase.from('gym_members').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', email: '', phone: '', membership_type: 'monthly', start_date: '', expiry_date: '', status: 'active' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this member?')) { await supabase.from('gym_members').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="Gym Members" subtitle={`${items.length} members`} actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Member</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Dumbbell className="w-8 h-8" />} title="No gym members" description="Manage gym memberships and expiry dates." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Member</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(m => (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div><p className="font-medium text-gray-900">{m.name}</p><Badge color={STATUS_COLORS[m.status] || 'gray'}>{m.status}</Badge></div>
                  <div className="flex gap-1"><button onClick={() => { setEditing(m); setForm({ name: m.name, email: m.email || '', phone: m.phone || '', membership_type: m.membership_type, start_date: m.start_date || '', expiry_date: m.expiry_date || '', status: m.status }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(m.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>}
                  {m.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</span>}
                  <p className="capitalize">Type: {m.membership_type}</p>
                  {m.expiry_date && <p>Expires: {formatDate(m.expiry_date)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Member' : 'Add Member'} size="lg">
        <div className="space-y-4">
          <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" /></div>
            <div><label className="label">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Membership</label><select value={form.membership_type} onChange={e => setForm({ ...form, membership_type: e.target.value })} className="input"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>
            <div><label className="label">Start Date</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input" /></div>
            <div><label className="label">Expiry Date</label><input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
