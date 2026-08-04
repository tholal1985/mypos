import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, ScrollText } from 'lucide-react'

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow'> = {
  pending: 'gray', deposited: 'blue', cleared: 'green', bounced: 'red', cancelled: 'yellow',
}

export default function Cheques() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'received' | 'issued'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ cheque_number: '', bank_name: '', type: 'received', payee: '', amount: '0', issue_date: '', due_date: '', status: 'pending', notes: '' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('cheques').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? items : items.filter(c => c.type === filter)

  const save = async () => {
    if (!business || !form.cheque_number) return
    const payload = { ...form, amount: parseFloat(form.amount) || 0, issue_date: form.issue_date || null, due_date: form.due_date || null }
    if (editing) await supabase.from('cheques').update(payload).eq('id', editing.id)
    else await supabase.from('cheques').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ cheque_number: '', bank_name: '', type: 'received', payee: '', amount: '0', issue_date: '', due_date: '', status: 'pending', notes: '' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this cheque?')) { await supabase.from('cheques').delete().eq('id', id); load() } }
  const sym = business?.currency_symbol || '$'
  const totalReceived = items.filter(c => c.type === 'received').reduce((s, c) => s + Number(c.amount), 0)
  const totalIssued = items.filter(c => c.type === 'issued').reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div>
      <PageHeader title="Cheque Management" subtitle={`Received: ${formatCurrency(totalReceived, business?.currency, sym)} | Issued: ${formatCurrency(totalIssued, business?.currency, sym)}`} actions={<button onClick={() => { setEditing(null); setForm({ cheque_number: '', bank_name: '', type: 'received', payee: '', amount: '0', issue_date: '', due_date: '', status: 'pending', notes: '' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Cheque</button>} />
      <div className="px-6">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All ({items.length})</button>
          <button onClick={() => setFilter('received')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'received' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Received ({items.filter(c => c.type === 'received').length})</button>
          <button onClick={() => setFilter('issued')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'issued' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Issued ({items.filter(c => c.type === 'issued').length})</button>
        </div>
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={<ScrollText className="w-8 h-8" />} title="No cheques" description="Track received and issued cheques." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Cheque</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Cheque #</th><th className="table-header">Type</th><th className="table-header">Bank</th><th className="table-header">Payee</th><th className="table-header">Due Date</th><th className="table-header">Amount</th><th className="table-header">Status</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{c.cheque_number}</td>
                    <td className="table-cell"><Badge color={c.type === 'received' ? 'green' : 'red'}>{c.type}</Badge></td>
                    <td className="table-cell">{c.bank_name || '-'}</td>
                    <td className="table-cell">{c.payee || '-'}</td>
                    <td className="table-cell text-gray-500">{c.due_date ? formatDate(c.due_date) : '-'}</td>
                    <td className="table-cell font-semibold">{formatCurrency(Number(c.amount), business?.currency, sym)}</td>
                    <td className="table-cell"><Badge color={STATUS_COLORS[c.status] || 'gray'}>{c.status}</Badge></td>
                    <td className="table-cell text-right"><button onClick={() => { setEditing(c); setForm({ cheque_number: c.cheque_number, bank_name: c.bank_name || '', type: c.type, payee: c.payee || '', amount: String(c.amount), issue_date: c.issue_date || '', due_date: c.due_date || '', status: c.status, notes: c.notes || '' }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(c.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Cheque' : 'Add Cheque'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Cheque Number *</label><input value={form.cheque_number} onChange={e => setForm({ ...form, cheque_number: e.target.value })} className="input" /></div>
            <div><label className="label">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input"><option value="received">Received</option><option value="issued">Issued</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Bank Name</label><input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className="input" /></div>
            <div><label className="label">Payee</label><input value={form.payee} onChange={e => setForm({ ...form, payee: e.target.value })} className="input" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Amount</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" /></div>
            <div><label className="label">Issue Date</label><input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className="input" /></div>
            <div><label className="label">Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="pending">Pending</option><option value="deposited">Deposited</option><option value="cleared">Cleared</option><option value="bounced">Bounced</option><option value="cancelled">Cancelled</option></select></div>
          <div><label className="label">Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
