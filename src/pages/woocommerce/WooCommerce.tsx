import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { Plus, Pencil, Trash2, ShoppingBag, RefreshCw, Link2, Unlink } from 'lucide-react'

const STATUS_COLORS: Record<string, 'green' | 'red' | 'gray' | 'yellow'> = { connected: 'green', disconnected: 'red', error: 'gray', syncing: 'yellow' }

export default function WooCommerce() {
  const { business } = useAuthStore()
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ store_url: '', consumer_key: '', consumer_secret: '', auto_sync: false, sync_interval: '60' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('woocommerce_settings').select('id, business_id, store_url, consumer_key, auto_sync, sync_interval, status, last_sync_at').eq('business_id', business.id).maybeSingle()
    setSettings(data); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.store_url) return
    const payload: Record<string, unknown> = { store_url: form.store_url, consumer_key: form.consumer_key, auto_sync: form.auto_sync, sync_interval: parseInt(form.sync_interval) || 60, status: 'connected' }
    if (form.consumer_secret) payload.consumer_secret = form.consumer_secret
    if (settings) {
      await supabase.from('woocommerce_settings').update(payload).eq('id', settings.id)
    } else {
      await supabase.from('woocommerce_settings').insert({ ...payload, business_id: business.id })
    }
    setShowModal(false); load()
  }

  const disconnect = async () => {
    if (!settings || !confirm('Disconnect WooCommerce store?')) return
    await supabase.from('woocommerce_settings').update({ status: 'disconnected' }).eq('id', settings.id)
    load()
  }

  const syncNow = async () => {
    if (!settings) return
    await supabase.from('woocommerce_settings').update({ last_sync_at: new Date().toISOString() }).eq('id', settings.id)
    load()
  }

  return (
    <div>
      <PageHeader title="WooCommerce Sync" subtitle="Connect your WooCommerce store" actions={
        settings?.status === 'connected' ? (
          <div className="flex gap-2">
            <button onClick={syncNow} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Sync Now</button>
            <button onClick={disconnect} className="btn-danger"><Unlink className="w-4 h-4" /> Disconnect</button>
          </div>
        ) : <button onClick={() => { setForm({ store_url: '', consumer_key: '', consumer_secret: '', auto_sync: false, sync_interval: '60' }); setShowModal(true) }} className="btn-primary"><Link2 className="w-4 h-4" /> Connect Store</button>
      } />
      <div className="px-6">
        {loading ? <LoadingState /> : !settings ? (
          <EmptyState icon={<ShoppingBag className="w-8 h-8" />} title="No store connected" description="Connect your WooCommerce store to sync products and orders." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Link2 className="w-4 h-4" /> Connect Store</button>} />
        ) : (
          <div className="card p-6 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-primary-600" /></div>
              <div>
                <p className="font-semibold text-gray-900">{settings.store_url}</p>
                <Badge color={STATUS_COLORS[settings.status] || 'gray'}>{settings.status}</Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Auto Sync</span><span>{settings.auto_sync ? 'Enabled' : 'Disabled'}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Sync Interval</span><span>{settings.sync_interval} min</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Last Sync</span><span>{settings.last_sync_at ? formatDateTime(settings.last_sync_at) : 'Never'}</span></div>
            </div>
            <button onClick={() => { setForm({ store_url: settings.store_url, consumer_key: settings.consumer_key || '', consumer_secret: '', auto_sync: settings.auto_sync, sync_interval: String(settings.sync_interval) }); setShowModal(true) }} className="btn-secondary mt-4"><Pencil className="w-4 h-4" /> Edit Settings</button>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Connect WooCommerce Store" size="lg">
        <div className="space-y-4">
          <div><label className="label">Store URL *</label><input value={form.store_url} onChange={e => setForm({ ...form, store_url: e.target.value })} className="input" placeholder="https://yourstore.com" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Consumer Key</label><input value={form.consumer_key} onChange={e => setForm({ ...form, consumer_key: e.target.value })} className="input" /></div>
            <div><label className="label">Consumer Secret</label><input type="password" value={form.consumer_secret} onChange={e => setForm({ ...form, consumer_secret: e.target.value })} className="input" placeholder={settings ? 'Leave blank to keep current secret' : ''} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label flex items-center gap-2"><input type="checkbox" checked={form.auto_sync} onChange={e => setForm({ ...form, auto_sync: e.target.checked })} /> Enable Auto Sync</label></div>
            <div><label className="label">Sync Interval (minutes)</label><input type="number" value={form.sync_interval} onChange={e => setForm({ ...form, sync_interval: e.target.value })} className="input" /></div>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">Connect</button></div>
        </div>
      </Modal>
    </div>
  )
}
