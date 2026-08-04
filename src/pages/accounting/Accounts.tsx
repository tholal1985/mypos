import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Landmark } from 'lucide-react'

export default function Accounts() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', type: 'cash', balance: '0' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('accounts').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.name) return
    const payload = { name: form.name, type: form.type, balance: parseFloat(form.balance) || 0 }
    if (editing) await supabase.from('accounts').update(payload).eq('id', editing.id)
    else await supabase.from('accounts').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', type: 'cash', balance: '0' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this account?')) { await supabase.from('accounts').delete().eq('id', id); load() } }
  const sym = business?.currency_symbol || '$'
  const totalBalance = items.reduce((s, a) => s + Number(a.balance), 0)

  return (
    <div>
      <PageHeader title="Accounts" subtitle={`Total balance: ${formatCurrency(totalBalance, business?.currency, sym)}`} actions={<button onClick={() => { setEditing(null); setForm({ name: '', type: 'cash', balance: '0' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Account</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Landmark className="w-8 h-8" />} title="No accounts" description="Create financial accounts to track money." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Account</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(a => (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Landmark className="w-5 h-5 text-primary-600" /></div>
                  <div className="flex gap-1"><button onClick={() => { setEditing(a); setForm({ name: a.name, type: a.type, balance: String(a.balance) }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(a.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
                </div>
                <p className="text-sm text-gray-500">{a.name}</p>
                <p className="text-xs text-gray-400 capitalize">{a.type}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(Number(a.balance), business?.currency, sym)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Account' : 'Add Account'}>
        <div className="space-y-4">
          <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Cash Register" /></div>
          <div><label className="label">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input"><option value="cash">Cash</option><option value="bank">Bank</option><option value="credit_card">Credit Card</option><option value="mobile_money">Mobile Money</option></select></div>
          <div><label className="label">Opening Balance</label><input type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} className="input" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
