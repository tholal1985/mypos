import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Users, Search, Phone, Mail } from 'lucide-react'

interface Customer { id: string; name: string; email: string | null; phone: string | null; address: string | null; city: string | null; country: string | null; opening_balance: number }

export default function Customers() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', country: '', opening_balance: '0' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search))

  const save = async () => {
    if (!business || !form.name) return
    const payload = { ...form, opening_balance: parseFloat(form.opening_balance) || 0 }
    if (editing) await supabase.from('customers').update(payload).eq('id', editing.id)
    else await supabase.from('customers').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', email: '', phone: '', address: '', city: '', country: '', opening_balance: '0' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this customer?')) { await supabase.from('customers').delete().eq('id', id); load() } }
  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${items.length} customers`} actions={<button onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '', city: '', country: '', opening_balance: '0' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Customer</button>} />
      <div className="px-6">
        <div className="relative mb-4 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="Search customers..." /></div>
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="No customers" description="Add customers to track sales and balances." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Customer</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Name</th><th className="table-header">Contact</th><th className="table-header">City</th><th className="table-header">Balance</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{c.name}</td>
                    <td className="table-cell"><div className="flex flex-col text-xs text-gray-500">{c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}{c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}</div></td>
                    <td className="table-cell">{c.city || '-'}</td>
                    <td className="table-cell">{formatCurrency(c.opening_balance, business?.currency, sym)}</td>
                    <td className="table-cell text-right"><button onClick={() => { setEditing(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', city: c.city || '', country: c.country || '', opening_balance: String(c.opening_balance) }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(c.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="lg">
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
