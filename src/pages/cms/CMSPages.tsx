import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'

export default function CMSPages() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', slug: '', content: '', status: 'draft' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('cms_pages').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.title) return
    const payload = { ...form, slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-') }
    if (editing) await supabase.from('cms_pages').update(payload).eq('id', editing.id)
    else await supabase.from('cms_pages').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setForm({ title: '', slug: '', content: '', status: 'draft' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this page?')) { await supabase.from('cms_pages').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="CMS Pages" subtitle={`${items.length} pages`} actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Page</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<FileText className="w-8 h-8" />} title="No pages" description="Create content pages for your business website." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Page</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Title</th><th className="table-header">Slug</th><th className="table-header">Status</th><th className="table-header">Date</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{p.title}</td>
                    <td className="table-cell text-gray-500">/{p.slug}</td>
                    <td className="table-cell"><Badge color={p.status === 'published' ? 'green' : 'gray'}>{p.status}</Badge></td>
                    <td className="table-cell text-gray-500">{formatDate(p.created_at)}</td>
                    <td className="table-cell text-right"><button onClick={() => { setEditing(p); setForm({ title: p.title, slug: p.slug, content: p.content || '', status: p.status }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(p.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Page' : 'Add Page'} size="xl">
        <div className="space-y-4">
          <div><label className="label">Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" /></div>
          <div><label className="label">Slug</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="input" placeholder="auto-generated from title" /></div>
          <div><label className="label">Content</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="input" rows={8} /></div>
          <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="draft">Draft</option><option value="published">Published</option></select></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
