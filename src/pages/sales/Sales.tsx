import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Receipt, Plus, Search, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Sales() {
  const { business } = useAuthStore()
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('sales').select('id, invoice_number, total, sale_date, payment_status, status, customers(name)').eq('business_id', business.id).order('sale_date', { ascending: false })
    setSales(data || [])
    setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const filtered = sales.filter(s => s.invoice_number.toLowerCase().includes(search.toLowerCase()) || (s.customers?.name || '').toLowerCase().includes(search.toLowerCase()))
  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Sales" subtitle={`${sales.length} transactions`} />
      <div className="px-6">
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="Search by invoice or customer..." />
        </div>
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={<Receipt className="w-8 h-8" />} title="No sales yet" description="Sales will appear here after you complete transactions at the POS." action={<Link to="/pos" className="btn-primary"><Plus className="w-4 h-4" /> Go to POS</Link>} />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr><th className="table-header">Invoice</th><th className="table-header">Date</th><th className="table-header">Customer</th><th className="table-header">Status</th><th className="table-header">Total</th><th className="table-header text-right">View</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{s.invoice_number}</td>
                      <td className="table-cell text-gray-500">{formatDate(s.sale_date)}</td>
                      <td className="table-cell">{s.customers?.name || 'Walk-in'}</td>
                      <td className="table-cell"><span className={`badge ${s.payment_status === 'paid' ? 'bg-success-100 text-success-700' : s.payment_status === 'partial' ? 'bg-warning-100 text-warning-700' : 'bg-error-100 text-error-700'}`}>{s.payment_status}</span></td>
                      <td className="table-cell font-semibold">{formatCurrency(Number(s.total), business?.currency, sym)}</td>
                      <td className="table-cell text-right"><Link to={`/sales/${s.id}`} className="inline-flex p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Eye className="w-4 h-4" /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
