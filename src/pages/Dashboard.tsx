import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, StatCard, LoadingState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, ShoppingCart, Package, TrendingUp, TriangleAlert as AlertTriangle, Users } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'

const PIE_COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Dashboard() {
  const { business } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todaySales: 0,
    totalSales: 0,
    productCount: 0,
    lowStockCount: 0,
    customerCount: 0,
    todaySalesCount: 0,
  })
  const [salesData, setSalesData] = useState<{ date: string; total: number }[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number }[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])

  useEffect(() => {
    if (business) loadDashboard()
  }, [business])

  const loadDashboard = async () => {
    setLoading(true)
    const bid = business!.id
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [
      { data: todaySales },
      { data: allSales },
      { count: productCount },
      { data: lowStock },
      { count: customerCount },
      { count: todayCount },
      { data: recent },
      { data: topProductsData },
      { data: categoryStats },
    ] = await Promise.all([
      supabase.from('sales').select('total').eq('business_id', bid).gte('sale_date', todayStart),
      supabase.from('sales').select('total, sale_date').eq('business_id', bid).order('sale_date', { ascending: false }).limit(30),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', bid),
      supabase.from('products').select('name, stock, alert_quantity').eq('business_id', bid).lt('stock', 5),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', bid),
      supabase.from('sales').select('*', { count: 'exact', head: true }).eq('business_id', bid).gte('sale_date', todayStart),
      supabase.from('sales').select('id, invoice_number, total, sale_date, customers(name)').eq('business_id', bid).order('sale_date', { ascending: false }).limit(5),
      supabase.from('sale_lines').select('quantity, products(name)').eq('sale_id', 'in').order('quantity', { ascending: false }).limit(5),
      supabase.from('products').select('category_id, categories(name)').eq('business_id', bid),
    ])

    const todayTotal = (todaySales || []).reduce((sum: number, s: any) => sum + Number(s.total), 0)
    const allTotal = (allSales || []).reduce((sum: number, s: any) => sum + Number(s.total), 0)

    setStats({
      todaySales: todayTotal,
      totalSales: allTotal,
      productCount: productCount || 0,
      lowStockCount: (lowStock || []).filter(p => Number(p.stock) <= Number(p.alert_quantity)).length,
      customerCount: customerCount || 0,
      todaySalesCount: todayCount || 0,
    })

    const last7Days: { date: string; total: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString()
      const dayTotal = (allSales || [])
        .filter((s: any) => s.sale_date >= dayStart && s.sale_date < dayEnd)
        .reduce((sum: number, s: any) => sum + Number(s.total), 0)
      last7Days.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), total: dayTotal })
    }
    setSalesData(last7Days)

    setTopProducts((topProductsData || []).slice(0, 5).map((p: any) => ({
      name: p.products?.name || 'Unknown',
      quantity: Number(p.quantity),
    })))

    const catMap: Record<string, number> = {}
    ;(categoryStats || []).forEach((p: any) => {
      const cat = p.categories?.name || 'Uncategorized'
      catMap[cat] = (catMap[cat] || 0) + 1
    })
    setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })))

    setRecentSales(recent || [])
    setLoading(false)
  }

  if (loading) return <LoadingState label="Loading dashboard..." />
  const sym = business?.currency_symbol || '$'

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={business?.name} />

      <div className="px-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Today's Sales" value={formatCurrency(stats.todaySales, business?.currency, sym)} icon={<DollarSign className="w-5 h-5" />} color="success" />
          <StatCard label="Today's Orders" value={String(stats.todaySalesCount)} icon={<ShoppingCart className="w-5 h-5" />} color="primary" />
          <StatCard label="Total Sales" value={formatCurrency(stats.totalSales, business?.currency, sym)} icon={<TrendingUp className="w-5 h-5" />} color="accent" />
          <StatCard label="Products" value={String(stats.productCount)} icon={<Package className="w-5 h-5" />} color="warning" />
          <StatCard label="Low Stock" value={String(stats.lowStockCount)} icon={<AlertTriangle className="w-5 h-5" />} color="error" />
          <StatCard label="Customers" value={String(stats.customerCount)} icon={<Users className="w-5 h-5" />} color="primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-5 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales - Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v, business?.currency, sym)} />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-sm text-gray-400">No data yet</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-sm text-gray-400">No sales yet</div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sale.invoice_number}</p>
                      <p className="text-xs text-gray-500">{sale.customers?.name || 'Walk-in'} - {formatDate(sale.sale_date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-success-600">{formatCurrency(Number(sale.total), business?.currency, sym)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-sm text-gray-400">No sales yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
