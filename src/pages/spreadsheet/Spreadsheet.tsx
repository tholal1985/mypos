import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { Plus, Trash2, FileSpreadsheet, Upload, Download } from 'lucide-react'

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'green' | 'red'> = { pending: 'gray', processing: 'blue', completed: 'green', failed: 'red' }

export default function Spreadsheet() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'import', module: 'products', file_name: '' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('import_exports').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!business || !form.file_name) return
    await supabase.from('import_exports').insert({ ...form, business_id: business.id, status: 'completed', total_rows: 0, processed_rows: 0 })
    setShowModal(false); setForm({ type: 'import', module: 'products', file_name: '' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this record?')) { await supabase.from('import_exports').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="Import / Export" subtitle="Spreadsheet data management" actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Job</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<FileSpreadsheet className="w-8 h-8" />} title="No import/export jobs" description="Import products from spreadsheets or export your data." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Job</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Type</th><th className="table-header">Module</th><th className="table-header">File</th><th className="table-header">Status</th><th className="table-header">Date</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="table-cell">{i.type === 'import' ? <Upload className="w-4 h-4 text-primary-600 inline mr-1" /> : <Download className="w-4 h-4 text-success-600 inline mr-1" />}{i.type}</td>
                    <td className="table-cell capitalize">{i.module}</td>
                    <td className="table-cell">{i.file_name || '-'}</td>
                    <td className="table-cell"><Badge color={STATUS_COLORS[i.status] || 'gray'}>{i.status}</Badge></td>
                    <td className="table-cell text-gray-500">{formatDateTime(i.created_at)}</td>
                    <td className="table-cell text-right"><button onClick={() => del(i.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Import/Export Job">
        <div className="space-y-4">
          <div><label className="label">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input"><option value="import">Import</option><option value="export">Export</option></select></div>
          <div><label className="label">Module</label><select value={form.module} onChange={e => setForm({ ...form, module: e.target.value })} className="input"><option value="products">Products</option><option value="customers">Customers</option><option value="suppliers">Suppliers</option><option value="sales">Sales</option><option value="purchases">Purchases</option></select></div>
          <div><label className="label">File Name</label><input value={form.file_name} onChange={e => setForm({ ...form, file_name: e.target.value })} className="input" placeholder="data.xlsx" /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={create} className="btn-primary">Create</button></div>
        </div>
      </Modal>
    </div>
  )
}
