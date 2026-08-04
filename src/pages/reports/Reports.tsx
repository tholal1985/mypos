import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, LoadingState, StatCard } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Wallet, Package } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function Reports() {
  const { business } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [stats, setStats] = useState({ totalSales: 0, totalExpenses: 0, totalProfit: 0, totalOrders: 0, avgOrder: 0 })

  useEffect(() => {
    (async () => {
      if (!business) return
      const [{ data: sales }, { data: expenses }] = await Promise.all([
        supabase.from('sales').select('total, sale_date').eq('business_id', business.id).order('sale_date', { ascending: false }).limit(30),
        supabase.from('expenses').select('amount').eq('business_id', business.id),
      ])

      const totalSales = (sales || []).reduce((s: number, r: any) => s + Number(r.total), 0)
      const totalExpenses = (expenses || []).reduce((s: number, r: any) => s + Number(r.amount), 0)

      setStats({
        totalSales,
        totalExpenses,
        totalProfit: totalSales - totalExpenses,
        totalOrders: sales?.length || 0,
        avgOrder: sales?.length ? totalSales / sales.length : 0,
      })

      const last14: any[] = []
      const now = new Date()
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
        const de = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString()
        const total = (sales || []).filter((s: any) => s.sale_date >= ds && s.sale_date < de).reduce((sum: number, s: any) => sum + Number(s.total), 0)
        last14.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), sales: total })
      }
      setSalesData(last14)

      const months: Record<string, number> = {}
      ;(sales || []).forEach((s: any) => {
        const d = new Date(s.sale_date)
        const key = d.toLocaleDateString('en-US', { month: 'short' })
        months[key] = (months[key] || 0) + Number(s.total)
      })
      setMonthlyData(Object.entries(months).map(([month, total]) => ({ month, total })))

      setLoading(false)
    })()
  }, [business])

  if (loading) return <LoadingState label="Generating reports..." />
  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Reports" subtitle="Business performance overview" />
      <div className="px-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={formatCurrency(stats.totalSales, business?.currency, sym)} icon={<DollarSign className="w-5 h-5" />} color="success" />
          <StatCard label="Total Expenses" value={formatCurrency(stats.totalExpenses, business?.currency, sym)} icon={<TrendingDown className="w-5 h-5" />} color="error" />
          <StatCard label="Net Profit" value={formatCurrency(stats.totalProfit, business?.currency, sym)} icon={<TrendingUp className="w-5 h-5" />} color="primary" />
          <StatCard label="Avg Order Value" value={formatCurrency(stats.avgOrder, business?.currency, sym)} icon={<ShoppingCart className="w-5 h-5" />} color="accent" />
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales - Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v, business?.currency, sym)} />
              <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v, business?.currency, sym)} />
                <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[300px] text-sm text-gray-400">No data available</div>}
        </div>
      </div>
    </div>
  )
}
