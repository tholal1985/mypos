import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ArrowLeftRight } from 'lucide-react'

export default function Transactions() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ account_id: '', type: 'credit', amount: '0', description: '' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const [{ data: t }, { data: a }] = await Promise.all([
      supabase.from('transactions').select('*, accounts(name)').eq('business_id', business.id).order('transaction_date', { ascending: false }),
      supabase.from('accounts').select('id, name').eq('business_id', business.id),
    ])
    setItems(t || []); setAccounts(a || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.account_id || !form.amount) return
    const amount = parseFloat(form.amount) || 0
    const { data: txn } = await supabase.from('transactions').insert({
      business_id: business.id, account_id: form.account_id, type: form.type, amount, description: form.description,
    }).select().single()

    if (txn) {
      const account = accounts.find(a => a.id === form.account_id)
      const newBalance = form.type === 'credit' ? Number(account.balance) + amount : Number(account.balance) - amount
      await supabase.from('accounts').update({ balance: newBalance }).eq('id', form.account_id)
    }
    setShowModal(false); setForm({ account_id: '', type: 'credit', amount: '0', description: '' }); load()
  }

  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Transactions" subtitle={`${items.length} transactions`} actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Transaction</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<ArrowLeftRight className="w-8 h-8" />} title="No transactions" description="Record money transfers between accounts." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Transaction</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Account</th><th className="table-header">Type</th><th className="table-header">Description</th><th className="table-header">Date</th><th className="table-header">Amount</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{t.accounts?.name || '-'}</td>
                    <td className="table-cell"><span className={`badge ${t.type === 'credit' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>{t.type === 'credit' ? 'Deposit' : 'Withdrawal'}</span></td>
                    <td className="table-cell">{t.description || '-'}</td>
                    <td className="table-cell text-gray-500">{formatDate(t.transaction_date)}</td>
                    <td className={`table-cell font-semibold ${t.type === 'credit' ? 'text-success-600' : 'text-error-600'}`}>{t.type === 'credit' ? '+' : '-'}{formatCurrency(Number(t.amount), business?.currency, sym)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Transaction">
        <div className="space-y-4">
          <div><label className="label">Account</label><select value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} className="input"><option value="">Select account...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div><label className="label">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input"><option value="credit">Deposit (Money In)</option><option value="debit">Withdrawal (Money Out)</option></select></div>
          <div><label className="label">Amount</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" /></div>
          <div><label className="label">Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">Create</button></div>
        </div>
      </Modal>
    </div>
  )
}
