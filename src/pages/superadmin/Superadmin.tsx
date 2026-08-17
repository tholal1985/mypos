import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge, StatCard } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, Crown, CreditCard, Users, Building2 } from 'lucide-react'

const STATUS_COLORS: Record<string, 'green' | 'red' | 'yellow' | 'gray'> = { active: 'green', expired: 'red', suspended: 'yellow', cancelled: 'gray' }

export default function Superadmin() {
  const { business, isPlatformAdmin } = useAuthStore()
  const [tab, setTab] = useState<'plans' | 'subscriptions'>('plans')
  const [plans, setPlans] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('saas_plans').select('*').order('price', { ascending: true }),
      business ? supabase.from('saas_subscriptions').select('*, saas_plans(name), businesses(name)').order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    ])
    setPlans(p || []); setSubscriptions(s || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (tab === 'plans') {
      if (!form.name) return
      const payload = { name: form.name, price: parseFloat(form.price) || 0, billing_cycle: form.billing_cycle, max_users: parseInt(form.max_users) || 5, max_products: parseInt(form.max_products) || 100, is_active: form.is_active !== false }
      if (editing) await supabase.from('saas_plans').update(payload).eq('id', editing.id)
      else await supabase.from('saas_plans').insert(payload)
    }
    setShowModal(false); setEditing(null); setForm({}); load()
  }

  const del = async (id: string) => {
    const table = tab === 'plans' ? 'saas_plans' : 'saas_subscriptions'
    if (confirm('Delete this record?')) { await supabase.from(table).delete().eq('id', id); load() }
  }

  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Superadmin" subtitle="SaaS plan & subscription management" actions={tab === 'plans' && isPlatformAdmin ? <button onClick={() => { setEditing(null); setForm({ name: '', price: '0', billing_cycle: 'monthly', max_users: '5', max_products: '100', is_active: true }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Plan</button> : undefined} />
      <div className="px-6">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('plans')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'plans' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Plans ({plans.length})</button>
          <button onClick={() => setTab('subscriptions')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'subscriptions' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Subscriptions ({subscriptions.length})</button>
        </div>

        {loading ? <LoadingState /> : tab === 'plans' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.length === 0 && <EmptyState icon={<Crown className="w-8 h-8" />} title="No plans" description="Create subscription plans for your SaaS." />}
            {plans.map(p => (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Crown className="w-5 h-5 text-primary-600" /></div>
                  {isPlatformAdmin && <div className="flex gap-1"><button onClick={() => { setEditing(p); setForm({ name: p.name, price: String(p.price), billing_cycle: p.billing_cycle, max_users: String(p.max_users), max_products: String(p.max_products), is_active: p.is_active }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(p.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>}
                </div>
                <p className="text-lg font-bold text-gray-900">{p.name}</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">{formatCurrency(Number(p.price), business?.currency, sym)}<span className="text-sm font-normal text-gray-400">/{p.billing_cycle}</span></p>
                <div className="mt-3 space-y-1 text-sm text-gray-500"><p><Users className="w-4 h-4 inline mr-1" />{p.max_users} users</p><p><Building2 className="w-4 h-4 inline mr-1" />{p.max_products} products</p></div>
                <div className="mt-3"><Badge color={p.is_active ? 'green' : 'gray'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></div>
              </div>
            ))}
          </div>
        ) : (
          subscriptions.length === 0 ? <EmptyState icon={<CreditCard className="w-8 h-8" />} title="No subscriptions" description="Business subscriptions will appear here." /> : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b"><tr><th className="table-header">Business</th><th className="table-header">Plan</th><th className="table-header">Start</th><th className="table-header">End</th><th className="table-header">Status</th><th className="table-header text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptions.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{s.businesses?.name || '-'}</td>
                      <td className="table-cell">{s.saas_plans?.name || '-'}</td>
                      <td className="table-cell text-gray-500">{formatDate(s.start_date)}</td>
                      <td className="table-cell text-gray-500">{s.end_date ? formatDate(s.end_date) : '-'}</td>
                      <td className="table-cell"><Badge color={STATUS_COLORS[s.status] || 'gray'}>{s.status}</Badge></td>
                      <td className="table-cell text-right">{isPlatformAdmin && <button onClick={() => del(s.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Plan' : 'Add Plan'}>
        <div className="space-y-4">
          <div><label className="label">Plan Name *</label><input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Price</label><input type="number" step="0.01" value={form.price || '0'} onChange={e => setForm({ ...form, price: e.target.value })} className="input" /></div>
            <div><label className="label">Billing Cycle</label><select value={form.billing_cycle || 'monthly'} onChange={e => setForm({ ...form, billing_cycle: e.target.value })} className="input"><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="lifetime">Lifetime</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Max Users</label><input type="number" value={form.max_users || '5'} onChange={e => setForm({ ...form, max_users: e.target.value })} className="input" /></div>
            <div><label className="label">Max Products</label><input type="number" value={form.max_products || '100'} onChange={e => setForm({ ...form, max_products: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Active</label><select value={form.is_active === false ? 'false' : 'true'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })} className="input"><option value="true">Yes</option><option value="false">No</option></select></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
