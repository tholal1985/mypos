import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react'

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'yellow' | 'green'> = {
  pending: 'gray', in_progress: 'blue', completed: 'yellow', delivered: 'green',
}

export default function RepairJobs() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ customer_id: '', product_name: '', serial_number: '', issue: '', status: 'pending', charge: '0' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase.from('repair_jobs').select('*, customers(name)').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name').eq('business_id', business.id),
    ])
    setItems(r || []); setCustomers(c || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.product_name) return
    const payload = { ...form, customer_id: form.customer_id || null, charge: parseFloat(form.charge) || 0 }
    if (editing) await supabase.from('repair_jobs').update(payload).eq('id', editing.id)
    else await supabase.from('repair_jobs').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ customer_id: '', product_name: '', serial_number: '', issue: '', status: 'pending', charge: '0' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this repair job?')) { await supabase.from('repair_jobs').delete().eq('id', id); load() } }
  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Repair Jobs" subtitle={`${items.length} jobs`} actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Repair</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Wrench className="w-8 h-8" />} title="No repair jobs" description="Track device repair requests from customers." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Repair</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Product</th><th className="table-header">Customer</th><th className="table-header">Issue</th><th className="table-header">Status</th><th className="table-header">Charge</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{r.product_name}<br /><span className="text-xs text-gray-400">{r.serial_number || ''}</span></td>
                    <td className="table-cell">{r.customers?.name || '-'}</td>
                    <td className="table-cell max-w-xs truncate">{r.issue}</td>
                    <td className="table-cell"><Badge color={STATUS_COLORS[r.status] || 'gray'}>{r.status.replace('_', ' ')}</Badge></td>
                    <td className="table-cell font-semibold">{formatCurrency(Number(r.charge), business?.currency, sym)}</td>
                    <td className="table-cell text-right"><button onClick={() => { setEditing(r); setForm({ customer_id: r.customer_id || '', product_name: r.product_name, serial_number: r.serial_number || '', issue: r.issue, status: r.status, charge: String(r.charge) }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(r.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Repair' : 'New Repair'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Customer</label><select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} className="input"><option value="">Walk-in</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="delivered">Delivered</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Product Name *</label><input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} className="input" /></div>
            <div><label className="label">Serial Number</label><input value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Issue *</label><textarea value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} className="input" rows={3} /></div>
          <div><label className="label">Charge</label><input type="number" step="0.01" value={form.charge} onChange={e => setForm({ ...form, charge: e.target.value })} className="input" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
