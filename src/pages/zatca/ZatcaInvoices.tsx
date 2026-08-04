import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { Plus, Trash2, FileCheck, Send } from 'lucide-react'

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'green' | 'red'> = {
  pending: 'gray', submitted: 'blue', approved: 'green', rejected: 'red',
}

export default function ZatcaInvoices() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ sale_id: '', invoice_number: '' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const [{ data: z }, { data: s }] = await Promise.all([
      supabase.from('zatca_invoices').select('*, sales(invoice_number)').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('sales').select('id, invoice_number, total').eq('business_id', business.id).order('sale_date', { ascending: false }).limit(50),
    ])
    setItems(z || []); setSales(s || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!business || !form.invoice_number) return
    await supabase.from('zatca_invoices').insert({
      business_id: business.id,
      sale_id: form.sale_id || null,
      invoice_number: form.invoice_number,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    setShowModal(false); setForm({ sale_id: '', invoice_number: '' }); load()
  }

  const del = async (id: string) => { if (confirm('Delete this ZATCA invoice?')) { await supabase.from('zatca_invoices').delete().eq('id', id); load() } }

  return (
    <div>
      <PageHeader title="ZATCA Integration" subtitle="Saudi e-invoicing compliance" actions={<button onClick={() => { setForm({ sale_id: '', invoice_number: `ZATCA${Date.now().toString().slice(-6)}` }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Submit Invoice</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<FileCheck className="w-8 h-8" />} title="No ZATCA invoices" description="Submit invoices for Saudi tax compliance (ZATCA Phase 2)." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Submit Invoice</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="table-header">Invoice #</th><th className="table-header">Sale</th><th className="table-header">Status</th><th className="table-header">Submitted</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(z => (
                  <tr key={z.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{z.invoice_number}</td>
                    <td className="table-cell">{z.sales?.invoice_number || '-'}</td>
                    <td className="table-cell"><Badge color={STATUS_COLORS[z.status] || 'gray'}>{z.status}</Badge></td>
                    <td className="table-cell text-gray-500">{z.submitted_at ? formatDateTime(z.submitted_at) : '-'}</td>
                    <td className="table-cell text-right"><button onClick={() => del(z.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Submit ZATCA Invoice">
        <div className="space-y-4">
          <div><label className="label">Invoice Number *</label><input value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} className="input" /></div>
          <div><label className="label">Link to Sale</label><select value={form.sale_id} onChange={e => setForm({ ...form, sale_id: e.target.value })} className="input"><option value="">None</option>{sales.map(s => <option key={s.id} value={s.id}>{s.invoice_number}</option>)}</select></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={submit} className="btn-primary"><Send className="w-4 h-4" /> Submit</button></div>
        </div>
      </Modal>
    </div>
  )
}
