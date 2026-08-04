import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { Plus, Pencil, Trash2, Scale } from 'lucide-react'

export default function Units() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [conversionFactor, setConversionFactor] = useState('1')

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('units').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !name) return
    const payload = { name, short_name: shortName, conversion_factor: parseFloat(conversionFactor) || 1 }
    if (editing) await supabase.from('units').update(payload).eq('id', editing.id)
    else await supabase.from('units').insert({ ...payload, business_id: business.id })
    setShowModal(false); setEditing(null); setName(''); setShortName(''); setConversionFactor('1'); load()
  }

  const del = async (id: string) => { if (confirm('Delete this unit?')) { await supabase.from('units').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="Units" subtitle={`${items.length} units`} actions={<button onClick={() => { setEditing(null); setName(''); setShortName(''); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Unit</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Scale className="w-8 h-8" />} title="No units" description="Add measurement units like kg, piece, liter." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Unit</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Name</th><th className="table-header">Short Name</th><th className="table-header">Conversion Factor</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{u.name}</td>
                    <td className="table-cell">{u.short_name}</td>
                    <td className="table-cell">{u.conversion_factor}</td>
                    <td className="table-cell text-right"><button onClick={() => { setEditing(u); setName(u.name); setShortName(u.short_name); setConversionFactor(String(u.conversion_factor)); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(u.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Unit' : 'Add Unit'}>
        <div className="space-y-4">
          <div><label className="label">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="e.g. Kilogram" /></div>
          <div><label className="label">Short Name *</label><input value={shortName} onChange={e => setShortName(e.target.value)} className="input" placeholder="e.g. kg" /></div>
          <div><label className="label">Conversion Factor</label><input type="number" step="0.01" value={conversionFactor} onChange={e => setConversionFactor(e.target.value)} className="input" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
