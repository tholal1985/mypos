import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Plus, Pencil, Trash2, Globe, Eye } from 'lucide-react'

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'yellow' | 'green' | 'red'> = {
  pending: 'gray', processing: 'blue', shipped: 'yellow', delivered: 'green', cancelled: 'red',
}

export default function EcommerceOrders() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [viewing, setViewing] = useState<any>(null)
  const [viewItems, setViewItems] = useState<any[]>([])
  const [form, setForm] = useState({ order_number: '', customer_name: '', customer_email: '', customer_phone: '', customer_address: '', status: 'pending', subtotal: '0', shipping_cost: '0' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('ecommerce_orders').select('*').eq('business_id', business.id).order('order_date', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.order_number || !form.customer_name) return
    const subtotal = parseFloat(form.subtotal) || 0
    const shipping = parseFloat(form.shipping_cost) || 0
    const payload = { ...form, subtotal, shipping_cost: shipping, total: subtotal + shipping }
    if (editing) await supabase.from('ecommerce_orders').update(payload).eq('id', editing.id)
    else await supabase.from('ecommerce_orders').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ order_number: '', customer_name: '', customer_email: '', customer_phone: '', customer_address: '', status: 'pending', subtotal: '0', shipping_cost: '0' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this order?')) { await supabase.from('ecommerce_orders').delete().eq('id', id); load() } }

  const viewOrder = async (order: any) => {
    setViewing(order)
    const { data } = await supabase.from('ecommerce_order_items').select('*').eq('order_id', order.id)
    setViewItems(data || [])
  }

  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="E-Commerce Orders" subtitle={`${items.length} online orders`} actions={<button onClick={() => { setEditing(null); setForm({ order_number: `ORD${Date.now().toString().slice(-6)}`, customer_name: '', customer_email: '', customer_phone: '', customer_address: '', status: 'pending', subtotal: '0', shipping_cost: '0' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Order</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Globe className="w-8 h-8" />} title="No online orders" description="Manage e-commerce orders from your online store." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Order</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Order #</th><th className="table-header">Customer</th><th className="table-header">Date</th><th className="table-header">Status</th><th className="table-header">Total</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{o.order_number}</td>
                    <td className="table-cell">{o.customer_name}</td>
                    <td className="table-cell text-gray-500">{formatDateTime(o.order_date)}</td>
                    <td className="table-cell"><Badge color={STATUS_COLORS[o.status] || 'gray'}>{o.status}</Badge></td>
                    <td className="table-cell font-semibold">{formatCurrency(Number(o.total), business?.currency, sym)}</td>
                    <td className="table-cell text-right">
                      <button onClick={() => viewOrder(o)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { setEditing(o); setForm({ order_number: o.order_number, customer_name: o.customer_name, customer_email: o.customer_email || '', customer_phone: o.customer_phone || '', customer_address: o.customer_address || '', status: o.status, subtotal: String(o.subtotal), shipping_cost: String(o.shipping_cost) }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => del(o.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Order' : 'Add Order'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Order Number *</label><input value={form.order_number} onChange={e => setForm({ ...form, order_number: e.target.value })} className="input" /></div>
            <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Customer Name *</label><input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className="input" /></div>
            <div><label className="label">Phone</label><input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Email</label><input value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} className="input" /></div>
          <div><label className="label">Address</label><textarea value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} className="input" rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Subtotal</label><input type="number" step="0.01" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} className="input" /></div>
            <div><label className="label">Shipping Cost</label><input type="number" step="0.01" value={form.shipping_cost} onChange={e => setForm({ ...form, shipping_cost: e.target.value })} className="input" /></div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t"><span className="text-lg font-bold">Total: {formatCurrency((parseFloat(form.subtotal) || 0) + (parseFloat(form.shipping_cost) || 0), business?.currency, sym)}</span><div className="flex gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div></div>
        </div>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Order ${viewing?.order_number || ''}`} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-400">Customer</p><p className="text-sm font-medium">{viewing?.customer_name}</p></div>
            <div><p className="text-xs text-gray-400">Status</p><Badge color={STATUS_COLORS[viewing?.status] || 'gray'}>{viewing?.status}</Badge></div>
            <div><p className="text-xs text-gray-400">Phone</p><p className="text-sm">{viewing?.customer_phone || '-'}</p></div>
            <div><p className="text-xs text-gray-400">Email</p><p className="text-sm">{viewing?.customer_email || '-'}</p></div>
          </div>
          {viewing?.customer_address && <div><p className="text-xs text-gray-400">Address</p><p className="text-sm">{viewing.customer_address}</p></div>}
          {viewItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Items</p>
              <div className="space-y-2">
                {viewItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span>{item.product_name} x {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(Number(item.total), business?.currency, sym)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t"><span className="text-lg font-bold">Total: {formatCurrency(Number(viewing?.total || 0), business?.currency, sym)}</span></div>
        </div>
      </Modal>
    </div>
  )
}
