import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { formatCurrency, generateInvoiceNumber, cn } from '@/lib/utils'
import { Search, ShoppingCart, Plus, Minus, X, Trash2, CreditCard, Banknote, CircleCheck as CheckCircle, User } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string | null
  price: number
  stock: number
  image_url: string | null
  categories?: { name: string } | { name: string }[] | null
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
}

export default function POS() {
  const { business } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paidAmount, setPaidAmount] = useState('')
  const [discount, setDiscount] = useState('0')
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastInvoice, setLastInvoice] = useState('')

  const load = useCallback(async () => {
    if (!business) return
    const [{ data: prods }, { data: cats }, { data: custs }] = await Promise.all([
      supabase.from('products').select('id, name, sku, price, stock, image_url, categories(name)').eq('business_id', business.id).order('name'),
      supabase.from('categories').select('id, name').eq('business_id', business.id),
      supabase.from('customers').select('id, name').eq('business_id', business.id),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setCustomers(custs || [])
  }, [business])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'all' || (Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name) === categories.find(c => c.id === activeCategory)?.name
    return matchSearch && matchCat
  })

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === p.id)
      if (existing) {
        if (existing.quantity >= p.stock) return prev
        return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1, stock: p.stock }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== id) return i
      const newQty = i.quantity + delta
      if (newQty <= 0) return i
      if (newQty > i.stock) return i
      return { ...i, quantity: newQty }
    }))
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.productId !== id))

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountAmount = parseFloat(discount) || 0
  const total = subtotal - discountAmount
  const paid = parseFloat(paidAmount) || 0
  const change = paid - total

  const checkout = async () => {
    if (!business || cart.length === 0) return
    const invoiceNo = generateInvoiceNumber('INV')
    const { data: sale } = await supabase.from('sales').insert({
      business_id: business.id,
      customer_id: selectedCustomer || null,
      invoice_number: invoiceNo,
      status: 'completed',
      payment_status: paid >= total ? 'paid' : 'partial',
      subtotal,
      discount_total: discountAmount,
      tax_total: 0,
      total,
      paid_amount: paid || total,
      change_return: Math.max(0, change),
    }).select().single()

    if (sale) {
      await Promise.all([
        ...cart.map(i => supabase.from('sale_lines').insert({
          sale_id: sale.id,
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.price,
          total: i.price * i.quantity,
        })),
        supabase.from('sale_payments').insert({
          sale_id: sale.id,
          amount: paid || total,
          method: paymentMethod,
        }),
        ...cart.map(i => supabase.from('products').update({ stock: i.stock - i.quantity }).eq('id', i.productId)),
      ])
    }

    setLastInvoice(invoiceNo)
    setShowSuccess(true)
    setCart([])
    setDiscount('0')
    setPaidAmount('')
    setSelectedCustomer('')
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const sym = business?.currency_symbol || '$'

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Point of Sale</h1>
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="Search products..." />
            </div>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button onClick={() => setActiveCategory('all')} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', activeCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>All</button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', activeCategory === c.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{c.name}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="card p-3 text-left hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <ShoppingCart className="w-8 h-8 text-gray-300" />}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-semibold text-primary-600">{formatCurrency(p.price, business?.currency, sym)}</p>
                  <p className={cn('text-xs', p.stock <= 5 ? 'text-error-500' : 'text-gray-400')}>{p.stock} left</p>
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No products found</p>}
        </div>
      </div>

      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Cart</h2>
            {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-error-600 hover:underline">Clear all</button>}
          </div>
          <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="input">
            <option value="">Walk-in Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(i => (
                <div key={i.productId} className="flex items-center gap-2 py-2 border-b border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{i.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(i.price, business?.currency, sym)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(i.productId, -1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="w-8 text-center text-sm font-medium">{i.quantity}</span>
                    <button onClick={() => updateQty(i.productId, 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <p className="text-sm font-semibold w-16 text-right">{formatCurrency(i.price * i.quantity, business?.currency, sym)}</p>
                  <button onClick={() => removeFromCart(i.productId)} className="text-gray-300 hover:text-error-500"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal, business?.currency, sym)}</span></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Discount</span>
              <input type="number" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} className="w-24 text-right input py-1" />
            </div>
            <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-100"><span>Total</span><span className="text-primary-600">{formatCurrency(total, business?.currency, sym)}</span></div>
          </div>

          <div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setPaymentMethod('cash')} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-colors', paymentMethod === 'cash' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600')}><Banknote className="w-4 h-4" /> Cash</button>
              <button onClick={() => setPaymentMethod('card')} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-colors', paymentMethod === 'card' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600')}><CreditCard className="w-4 h-4" /> Card</button>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">Paid Amount</span>
              <input type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder={String(total)} className="input flex-1 text-right" />
            </div>
            {paid > 0 && change > 0 && <p className="text-xs text-success-600 mt-1">Change: {formatCurrency(change, business?.currency, sym)}</p>}
          </div>

          <button onClick={checkout} disabled={cart.length === 0} className="btn-primary w-full py-3 text-base">
            <CheckCircle className="w-5 h-5" /> Complete Sale
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-success-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in-right z-50">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Sale completed!</p>
            <p className="text-xs text-success-100">Invoice: {lastInvoice}</p>
          </div>
        </div>
      )}
    </div>
  )
}
