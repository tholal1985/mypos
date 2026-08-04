import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { LoadingState } from '@/components/ui'
import { ArrowLeft, Printer } from 'lucide-react'

export default function SaleDetail() {
  const { id } = useParams()
  const { business } = useAuthStore()
  const [sale, setSale] = useState<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: l }, { data: p }] = await Promise.all([
        supabase.from('sales').select('*, customers(name, email, phone)').eq('id', id).maybeSingle(),
        supabase.from('sale_lines').select('*, products(name)').eq('sale_id', id),
        supabase.from('sale_payments').select('*').eq('sale_id', id),
      ])
      setSale(s); setLines(l || []); setPayments(p || []); setLoading(false)
    })()
  }, [id])

  if (loading) return <LoadingState />
  if (!sale) return <div className="p-6"><p className="text-gray-500">Sale not found.</p><Link to="/sales" className="btn-secondary mt-4">Back to Sales</Link></div>
  const sym = business?.currency_symbol || '$'

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/sales" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" /> Back to Sales</Link>
        <button onClick={() => window.print()} className="btn-secondary"><Printer className="w-4 h-4" /> Print</button>
      </div>

      <div className="card p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{business?.name}</h1>
            <p className="text-sm text-gray-500">{business?.currency} - {business?.tax_label}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Invoice</p>
            <p className="text-lg font-bold text-gray-900">{sale.invoice_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
          <div><p className="text-xs text-gray-400">Date</p><p className="text-sm font-medium">{formatDateTime(sale.sale_date)}</p></div>
          <div><p className="text-xs text-gray-400">Customer</p><p className="text-sm font-medium">{sale.customers?.name || 'Walk-in Customer'}</p></div>
        </div>

        <table className="w-full mb-6">
          <thead className="border-b border-gray-200">
            <tr><th className="table-header">Product</th><th className="table-header text-center">Qty</th><th className="table-header text-right">Price</th><th className="table-header text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map(l => (
              <tr key={l.id}>
                <td className="table-cell">{l.products?.name || 'Unknown'}</td>
                <td className="table-cell text-center">{l.quantity}</td>
                <td className="table-cell text-right">{formatCurrency(Number(l.unit_price), business?.currency, sym)}</td>
                <td className="table-cell text-right font-medium">{formatCurrency(Number(l.total), business?.currency, sym)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-64 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(Number(sale.subtotal), business?.currency, sym)}</span></div>
          {Number(sale.discount_total) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span>-{formatCurrency(Number(sale.discount_total), business?.currency, sym)}</span></div>}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200"><span>Total</span><span className="text-primary-600">{formatCurrency(Number(sale.total), business?.currency, sym)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Paid</span><span className="text-success-600">{formatCurrency(Number(sale.paid_amount), business?.currency, sym)}</span></div>
          {Number(sale.change_return) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Change</span><span>{formatCurrency(Number(sale.change_return), business?.currency, sym)}</span></div>}
        </div>

        {payments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Payment Details</p>
            {payments.map(p => (
              <div key={p.id} className="flex justify-between text-sm"><span className="text-gray-500 capitalize">{p.method}</span><span>{formatCurrency(Number(p.amount), business?.currency, sym)}</span></div>
            ))}
          </div>
        )}

        <div className="text-center mt-8 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}
