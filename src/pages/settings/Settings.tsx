import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/ui'
import { Save } from 'lucide-react'

export default function Settings() {
  const { business, user, refreshBusinesses } = useAuthStore()
  const [name, setName] = useState(business?.name || '')
  const [currency, setCurrency] = useState(business?.currency || 'USD')
  const [currencySymbol, setCurrencySymbol] = useState(business?.currency_symbol || '$')
  const [taxLabel, setTaxLabel] = useState(business?.tax_label || 'Tax')
  const [defaultTaxRate, setDefaultTaxRate] = useState(String(business?.default_tax_rate || 0))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (!business) return
    setSaving(true)
    await supabase.from('businesses').update({
      name, currency, currency_symbol: currencySymbol, tax_label: taxLabel, default_tax_rate: parseFloat(defaultTaxRate) || 0,
    }).eq('id', business.id)
    await refreshBusinesses()
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your business configuration" />
      <div className="px-6 max-w-2xl">
        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Business Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Currency Code</label>
              <input value={currency} onChange={e => setCurrency(e.target.value)} className="input" placeholder="USD" />
            </div>
            <div>
              <label className="label">Currency Symbol</label>
              <input value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} className="input" placeholder="$" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tax Label</label>
              <input value={taxLabel} onChange={e => setTaxLabel(e.target.value)} className="input" placeholder="Tax" />
            </div>
            <div>
              <label className="label">Default Tax Rate (%)</label>
              <input type="number" step="0.01" value={defaultTaxRate} onChange={e => setDefaultTaxRate(e.target.value)} className="input" />
            </div>
          </div>
          <div className="pt-2">
            <p className="text-xs text-gray-400">Account: {user?.email}</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
            {saved && <span className="text-sm text-success-600">Saved successfully!</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
