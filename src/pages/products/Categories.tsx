import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react'

export default function Categories() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !name) return
    if (editing) await supabase.from('categories').update({ name, description }).eq('id', editing.id)
    else await supabase.from('categories').insert({ name, description, business_id: business.id })
    setShowModal(false); setEditing(null); setName(''); setDescription(''); load()
  }

  const del = async (id: string) => { if (confirm('Delete this category?')) { await supabase.from('categories').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="Categories" subtitle={`${items.length} categories`} actions={<button onClick={() => { setEditing(null); setName(''); setDescription(''); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Category</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<FolderTree className="w-8 h-8" />} title="No categories" description="Create categories to organize your products." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Category</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(c => (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div><p className="font-medium text-gray-900">{c.name}</p><p className="text-sm text-gray-500 mt-1">{c.description || 'No description'}</p></div>
                  <div className="flex gap-1"><button onClick={() => { setEditing(c); setName(c.name); setDescription(c.description || ''); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(c.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <div><label className="label">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Category name" /></div>
          <div><label className="label">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input" rows={3} /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
