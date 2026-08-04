import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Truck, Search, Phone, Mail } from 'lucide-react'

export default function Suppliers() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', country: '', opening_balance: '0' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('suppliers').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  const save = async () => {
    if (!business || !form.name) return
    const payload = { ...form, opening_balance: parseFloat(form.opening_balance) || 0 }
    if (editing) await supabase.from('suppliers').update(payload).eq('id', editing.id)
    else await supabase.from('suppliers').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', email: '', phone: '', address: '', city: '', country: '', opening_balance: '0' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this supplier?')) { await supabase.from('suppliers').delete().eq('id', id); load() } }
  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Suppliers" subtitle={`${items.length} suppliers`} actions={<button onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '', city: '', country: '', opening_balance: '0' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Supplier</button>} />
      <div className="px-6">
        <div className="relative mb-4 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="Search suppliers..." /></div>
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={<Truck className="w-8 h-8" />} title="No suppliers" description="Add suppliers to track purchases and stock." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Supplier</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Name</th><th className="table-header">Contact</th><th className="table-header">City</th><th className="table-header">Balance</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{s.name}</td>
                    <td className="table-cell"><div className="flex flex-col text-xs text-gray-500">{s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}{s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}</div></td>
                    <td className="table-cell">{s.city || '-'}</td>
                    <td className="table-cell">{formatCurrency(s.opening_balance, business?.currency, sym)}</td>
                    <td className="table-cell text-right"><button onClick={() => { setEditing(s); setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', city: s.city || '', country: s.country || '', opening_balance: String(s.opening_balance) }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(s.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        <div className="space-y-4">
          <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="label">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" /></div><div><label className="label">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" /></div></div>
          <div><label className="label">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input" /></div>
          <div className="grid grid-cols-3 gap-4"><div><label className="label">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input" /></div><div><label className="label">Country</label><input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input" /></div><div><label className="label">Opening Balance</label><input type="number" step="0.01" value={form.opening_balance} onChange={e => setForm({ ...form, opening_balance: e.target.value })} className="input" /></div></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
