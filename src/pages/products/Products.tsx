import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Package, Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  description: string | null
  category_id: string | null
  brand_id: string | null
  unit_id: string | null
  price: number
  cost: number
  stock: number
  alert_quantity: number
  type: string
  image_url: string | null
  categories?: { name: string } | null
  brands?: { name: string } | null
  units?: { name: string } | null
}

export default function Products() {
  const { business } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', description: '', category_id: '', brand_id: '',
    unit_id: '', price: '0', cost: '0', stock: '0', alert_quantity: '5', type: 'single',
  })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const [{ data: prods }, { data: cats }, { data: brs }, { data: unts }] = await Promise.all([
      supabase.from('products').select('*, categories(name), brands(name), units(name)').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').eq('business_id', business.id),
      supabase.from('brands').select('id, name').eq('business_id', business.id),
      supabase.from('units').select('id, name').eq('business_id', business.id),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setBrands(brs || [])
    setUnits(unts || [])
    setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', sku: '', barcode: '', description: '', category_id: '', brand_id: '', unit_id: '', price: '0', cost: '0', stock: '0', alert_quantity: '5', type: 'single' })
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name, sku: p.sku || '', barcode: p.barcode || '', description: p.description || '',
      category_id: p.category_id || '', brand_id: p.brand_id || '', unit_id: p.unit_id || '',
      price: String(p.price), cost: String(p.cost), stock: String(p.stock), alert_quantity: String(p.alert_quantity), type: p.type,
    })
    setShowModal(true)
  }

  const save = async () => {
    if (!business || !form.name) return
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      stock: parseFloat(form.stock) || 0,
      alert_quantity: parseFloat(form.alert_quantity) || 0,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      unit_id: form.unit_id || null,
    }
    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('products').insert({ ...payload, business_id: business.id })
    }
    setShowModal(false)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products`}
        actions={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Product</button>}
      />

      <div className="px-6">
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="Search by name, SKU, or barcode..." />
        </div>

        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={<Package className="w-8 h-8" />} title="No products yet" description="Add your first product to start selling." action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Product</button>} />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header">Name</th>
                    <th className="table-header">SKU</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Price</th>
                    <th className="table-header">Stock</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-medium">{p.name}</td>
                      <td className="table-cell text-gray-500">{p.sku || '-'}</td>
                      <td className="table-cell">{p.categories?.name || '-'}</td>
                      <td className="table-cell">{formatCurrency(p.price, business?.currency, sym)}</td>
                      <td className="table-cell">
                        <span className={p.stock <= p.alert_quantity ? 'text-error-600 font-medium' : ''}>{p.stock}</span>
                        {p.stock <= p.alert_quantity && <AlertTriangle className="w-3 h-3 text-error-500 inline ml-1" />}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => del(p.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Product name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">SKU</label><input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="input" placeholder="SKU" /></div>
            <div><label className="label">Barcode</label><input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="input" placeholder="Barcode" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Category</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="input">
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Brand</label>
              <select value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })} className="input">
                <option value="">None</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <select value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })} className="input">
                <option value="">None</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Selling Price</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input" /></div>
            <div><label className="label">Cost Price</label><input type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Stock</label><input type="number" step="0.01" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="input" /></div>
            <div><label className="label">Alert Quantity</label><input type="number" step="0.01" value={form.alert_quantity} onChange={e => setForm({ ...form, alert_quantity: e.target.value })} className="input" /></div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
