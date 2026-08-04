import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, BookOpen, Globe, Lock } from 'lucide-react'

export default function ProductCatalogue() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '', is_public: false })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('product_catalogues').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.name) return
    const payload = { name: form.name, description: form.description, is_public: form.is_public }
    if (editing) await supabase.from('product_catalogues').update(payload).eq('id', editing.id)
    else await supabase.from('product_catalogues').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ name: '', description: '', is_public: false }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this catalogue?')) { await supabase.from('product_catalogues').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="Product Catalogues" subtitle={`${items.length} catalogues`} actions={<button onClick={() => { setEditing(null); setForm({ name: '', description: '', is_public: false }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Catalogue</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No catalogues" description="Create product catalogues to showcase your products." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Catalogue</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(c => (
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary-600" /></div>
                    {c.is_public ? <Globe className="w-4 h-4 text-success-500" /> : <Lock className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex gap-1"><button onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || '', is_public: c.is_public }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(c.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
                </div>
                <p className="font-semibold text-gray-900 mt-3">{c.name}</p>
                {c.description && <p className="text-sm text-gray-500 mt-1">{c.description}</p>}
                <div className="mt-2"><Badge color={c.is_public ? 'green' : 'gray'}>{c.is_public ? 'Public' : 'Private'}</Badge></div>
                <p className="text-xs text-gray-400 mt-2">Created {formatDate(c.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Catalogue' : 'Add Catalogue'}>
        <div className="space-y-4">
          <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" rows={3} /></div>
          <div><label className="label flex items-center gap-2"><input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} /> Make this catalogue public</label></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
