import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { Plus, Trash2, Inbox, Bell, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Info } from 'lucide-react'

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  high: <AlertCircle className="w-4 h-4 text-error-500" />,
  normal: <Info className="w-4 h-4 text-primary-500" />,
  low: <CheckCircle className="w-4 h-4 text-success-500" />,
}
const PRIORITY_COLORS: Record<string, 'red' | 'blue' | 'green' | 'gray'> = { high: 'red', normal: 'blue', low: 'green', normal2: 'gray' }

export default function InboxReport() {
  const { business } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'notification', message: '', priority: 'normal' })

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const { data } = await supabase.from('inbox_reports').select('*').eq('business_id', business.id).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business || !form.title) return
    await supabase.from('inbox_reports').insert({ ...form, business_id: business.id })
    setShowModal(false); setForm({ title: '', type: 'notification', message: '', priority: 'normal' }); load()
  }

  const markRead = async (id: string) => { await supabase.from('inbox_reports').update({ is_read: true }).eq('id', id); load() }
  const del = async (id: string) => { if (confirm('Delete this report?')) { await supabase.from('inbox_reports').delete().eq('id', id); load() } }
  const unreadCount = items.filter(i => !i.is_read).length

  return (
    <div>
      <PageHeader title="Inbox & Reports" subtitle={`${unreadCount} unread of ${items.length} total`} actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Report</button>} />
      <div className="px-6">
        {loading ? <LoadingState /> : items.length === 0 ? (
          <EmptyState icon={<Inbox className="w-8 h-8" />} title="No reports" description="System notifications and reports will appear here." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Report</button>} />
        ) : (
          <div className="space-y-2">
            {items.map(r => (
              <div key={r.id} className={`card p-4 flex items-start gap-3 ${!r.is_read ? 'border-primary-200 bg-primary-50/30' : ''}`}>
                <div className="mt-0.5">{PRIORITY_ICONS[r.priority] || <Bell className="w-4 h-4 text-gray-400" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${!r.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{r.title}</p>
                    {!r.is_read && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
                  </div>
                  {r.message && <p className="text-sm text-gray-500 mt-1">{r.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(r.created_at)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge color={PRIORITY_COLORS[r.priority] || 'gray'}>{r.priority}</Badge>
                  {!r.is_read && <button onClick={() => markRead(r.id)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="Mark as read"><CheckCircle className="w-4 h-4" /></button>}
                  <button onClick={() => del(r.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Report">
        <div className="space-y-4">
          <div><label className="label">Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input"><option value="notification">Notification</option><option value="alert">Alert</option><option value="report">Report</option><option value="warning">Warning</option></select></div>
            <div><label className="label">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input"><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></div>
          </div>
          <div><label className="label">Message</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="input" rows={3} /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">Create</button></div>
        </div>
      </Modal>
    </div>
  )
}
