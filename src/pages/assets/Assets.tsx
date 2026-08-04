import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, Boxes } from 'lucide-react'

const STATUS_COLORS: Record<string, 'green' | 'gray' | 'red'> = {
  in_use: 'green', in_storage: 'gray', disposed: 'red',
}

export default function Assets() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', category: '', serial_number: '', purchase_date: '', purchase_value: '0', current_value: '0', status: 'in_use' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('assets').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.name) return
    const payload = { ...form, purchase_date: form.purchase_date || null, purchase_value: parseFloat(form.purchase_value) || 0, current_value: parseFloat(form.current_value) || 0 }
    if (editing) await supabase.from('assets').update(payload).eq('id', editing.id)
    else await supabase.from('assets').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', category: '', serial_number: '', purchase_date: '', purchase_value: '0', current_value: '0', status: 'in_use' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this asset?')) { await supabase.from('assets').delete().eq('id', id); load() } }
  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Assets" subtitle={`${items.length} assets`} actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Asset</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Boxes className="w-8 h-8" />} title="No assets" description="Track business assets and their values." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Asset</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Name</th><th className="table-header">Category</th><th className="table-header">Serial</th><th className="table-header">Status</th><th className="table-header">Value</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{a.name}</td>
                    <td className="table-cell">{a.category || '-'}</td>
                    <td className="table-cell text-gray-500">{a.serial_number || '-'}</td>
                    <td className="table-cell"><Badge color={STATUS_COLORS[a.status] || 'gray'}>{a.status.replace('_', ' ')}</Badge></td>
                    <td className="table-cell font-semibold">{formatCurrency(Number(a.current_value), business?.currency, sym)}</td>
                    <td className="table-cell text-right"><button onClick={() => { setEditing(a); setForm({ name: a.name, category: a.category || '', serial_number: a.serial_number || '', purchase_date: a.purchase_date || '', purchase_value: String(a.purchase_value), current_value: String(a.current_value), status: a.status }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(a.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Asset' : 'Add Asset'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
            <div><label className="label">Category</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Serial Number</label><input value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} className="input" /></div>
            <div><label className="label">Purchase Date</label><input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} className="input" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Purchase Value</label><input type="number" step="0.01" value={form.purchase_value} onChange={e => setForm({ ...form, purchase_value: e.target.value })} className="input" /></div>
            <div><label className="label">Current Value</label><input type="number" step="0.01" value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} className="input" /></div>
            <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="in_use">In Use</option><option value="in_storage">In Storage</option><option value="disposed">Disposed</option></select></div>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
