import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ListOrdered, Trash2 } from 'lucide-react'

export default function Purchases() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ supplier_id: '', reference_number: '', paid_amount: '0' })
  const [lines, setLines] = useState([{ product_id: '', quantity: '1', unit_cost: '0' }])

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const [{ data: p }, { data: s }, { data: pr }] = await Promise.all([
      supabase.from('purchases').select('*, suppliers(name)').eq('business_id', business.id).order('purchase_date', { ascending: false }),
      supabase.from('suppliers').select('id, name').eq('business_id', business.id),
      supabase.from('products').select('id, name').eq('business_id', business.id),
    ])
    setItems(p || []); setSuppliers(s || []); setProducts(pr || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const addLine = () => setLines([...lines, { product_id: '', quantity: '1', unit_cost: '0' }])
  const updateLine = (i: number, field: string, value: string) => setLines(lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i))
  const total = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_cost) || 0), 0)

  const save = async () => {
    if (!business || !lines.some(l => l.product_id)) return
    const { data: purchase } = await supabase.from('purchases').insert({
      business_id: business.id,
      supplier_id: form.supplier_id || null,
      reference_number: form.reference_number,
      total,
      paid_amount: parseFloat(form.paid_amount) || 0,
    }).select().single()

    if (purchase) {
      const validLines = lines.filter(l => l.product_id)
      await Promise.all([
        ...validLines.map(l => supabase.from('purchase_lines').insert({
          purchase_id: purchase.id,
          product_id: l.product_id,
          quantity: parseFloat(l.quantity) || 0,
          unit_cost: parseFloat(l.unit_cost) || 0,
          total: (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_cost) || 0),
        })),
        ...validLines.map(l => supabase.rpc('adjust_stock', { p_id: l.product_id, delta: Math.max(0, parseFloat(l.quantity) || 0) })),
      ])
    }
    setShowModal(false); setForm({ supplier_id: '', reference_number: '', paid_amount: '0' }); setLines([{ product_id: '', quantity: '1', unit_cost: '0' }]); load()
  }

  const del = async (id: string) => { if (confirm('Delete this purchase?')) { await supabase.from('purchases').delete().eq('id', id); load() } }
  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Purchases" subtitle={`${items.length} purchase orders`} actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Purchase</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<ListOrdered className="w-8 h-8" />} title="No purchases" description="Record stock purchases from suppliers." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Purchase</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Reference</th><th className="table-header">Supplier</th><th className="table-header">Date</th><th className="table-header">Total</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{p.reference_number || '-'}</td>
                    <td className="table-cell">{p.suppliers?.name || '-'}</td>
                    <td className="table-cell text-gray-500">{formatDate(p.purchase_date)}</td>
                    <td className="table-cell font-semibold">{formatCurrency(Number(p.total), business?.currency, sym)}</td>
                    <td className="table-cell text-right"><button onClick={() => del(p.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Purchase" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Supplier</label><select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} className="input"><option value="">Select...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="label">Reference #</label><input value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} className="input" /></div>
            <div><label className="label">Paid Amount</label><input type="number" step="0.01" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })} className="input" /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="label mb-0">Products</label><button onClick={addLine} className="btn-ghost text-sm"><Plus className="w-4 h-4" /> Add Line</button></div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={l.product_id} onChange={e => updateLine(i, 'product_id', e.target.value)} className="input flex-1"><option value="">Select product...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <input type="number" step="0.01" value={l.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} className="input w-20" placeholder="Qty" />
                  <input type="number" step="0.01" value={l.unit_cost} onChange={e => updateLine(i, 'unit_cost', e.target.value)} className="input w-28" placeholder="Cost" />
                  <span className="text-sm font-medium w-20 text-right">{formatCurrency((parseFloat(l.quantity) || 0) * (parseFloat(l.unit_cost) || 0), business?.currency, sym)}</span>
                  <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-error-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t"><span className="text-lg font-bold">Total: {formatCurrency(total, business?.currency, sym)}</span><div className="flex gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">Create Purchase</button></div></div>
        </div>
      </Modal>
    </div>
  )
}
