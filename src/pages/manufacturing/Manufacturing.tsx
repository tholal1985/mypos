import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, Factory } from 'lucide-react'

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'green'> = {
  pending: 'gray', in_progress: 'blue', completed: 'green',
}

export default function Manufacturing() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ product_id: '', quantity: '1', status: 'pending' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase.from('manufacturing_orders').select('*, products(name)').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').eq('business_id', business.id),
    ])
    setItems(m || []); setProducts(p || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.product_id) return
    const payload = { product_id: form.product_id, quantity: parseFloat(form.quantity) || 1, status: form.status }
    if (editing) await supabase.from('manufacturing_orders').update(payload).eq('id', editing.id)
    else await supabase.from('manufacturing_orders').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ product_id: '', quantity: '1', status: 'pending' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this order?')) { await supabase.from('manufacturing_orders').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="Manufacturing" subtitle={`${items.length} production orders`} actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Order</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Factory className="w-8 h-8" />} title="No manufacturing orders" description="Create production orders for your products." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Order</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Product</th><th className="table-header">Quantity</th><th className="table-header">Status</th><th className="table-header">Date</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{m.products?.name || '-'}</td>
                    <td className="table-cell">{m.quantity}</td>
                    <td className="table-cell"><Badge color={STATUS_COLORS[m.status] || 'gray'}>{m.status.replace('_', ' ')}</Badge></td>
                    <td className="table-cell text-gray-500">{formatDate(m.created_at)}</td>
                    <td className="table-cell text-right"><button onClick={() => { setEditing(m); setForm({ product_id: m.product_id || '', quantity: String(m.quantity), status: m.status }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(m.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Order' : 'New Manufacturing Order'}>
        <div className="space-y-4">
          <div><label className="label">Product *</label><select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className="input"><option value="">Select...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="label">Quantity</label><input type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="input" /></div>
          <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
