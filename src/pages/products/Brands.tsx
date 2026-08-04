import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'

export default function Brands() {
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
    const { data } = await supabase.from('brands').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !name) return
    if (editing) await supabase.from('brands').update({ name, description }).eq('id', editing.id)
    else await supabase.from('brands').insert({ name, description, business_id: business.id })
    setShowModal(false); setEditing(null); setName(''); setDescription(''); load()
  }

  const del = async (id: string) => { if (confirm('Delete this brand?')) { await supabase.from('brands').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="Brands" subtitle={`${items.length} brands`} actions={<button onClick={() => { setEditing(null); setName(''); setDescription(''); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Brand</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Tag className="w-8 h-8" />} title="No brands" description="Add brands for your products." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Brand</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map(b => (
              <div key={b.id} className="card p-4 flex items-center justify-between">
                <div><p className="font-medium text-gray-900">{b.name}</p><p className="text-xs text-gray-500">{b.description || ''}</p></div>
                <div className="flex gap-1"><button onClick={() => { setEditing(b); setName(b.name); setDescription(b.description || ''); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(b.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Brand' : 'Add Brand'}>
        <div className="space-y-4">
          <div><label className="label">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="input" /></div>
          <div><label className="label">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input" rows={3} /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
