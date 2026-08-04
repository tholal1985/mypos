import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react'

export default function Expenses() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ category: 'general', description: '', amount: '0' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('expenses').select('*').eq('business_id', business.id).order('expense_date', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.amount) return
    const payload = { category: form.category, description: form.description, amount: parseFloat(form.amount) || 0 }
    if (editing) await supabase.from('expenses').update(payload).eq('id', editing.id)
    else await supabase.from('expenses').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ category: 'general', description: '', amount: '0' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this expense?')) { await supabase.from('expenses').delete().eq('id', id); load() } }
  const sym = business?.currency_symbol || '$'
  const total = items.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div>
      <PageHeader title="Expenses" subtitle={`Total: ${formatCurrency(total, business?.currency, sym)}`} actions={<button onClick={() => { setEditing(null); setForm({ category: 'general', description: '', amount: '0' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Expense</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Wallet className="w-8 h-8" />} title="No expenses" description="Track business expenses here." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Expense</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Category</th><th className="table-header">Description</th><th className="table-header">Date</th><th className="table-header">Amount</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="table-cell"><span className="badge bg-warning-100 text-warning-700">{e.category}</span></td>
                    <td className="table-cell">{e.description || '-'}</td>
                    <td className="table-cell text-gray-500">{formatDate(e.expense_date)}</td>
                    <td className="table-cell font-semibold text-error-600">-{formatCurrency(Number(e.amount), business?.currency, sym)}</td>
                    <td className="table-cell text-right"><button onClick={() => { setEditing(e); setForm({ category: e.category, description: e.description || '', amount: String(e.amount) }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(e.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <div className="space-y-4">
          <div><label className="label">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input"><option value="general">General</option><option value="rent">Rent</option><option value="utilities">Utilities</option><option value="salaries">Salaries</option><option value="supplies">Supplies</option><option value="marketing">Marketing</option><option value="other">Other</option></select></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" rows={3} /></div>
          <div><label className="label">Amount *</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
