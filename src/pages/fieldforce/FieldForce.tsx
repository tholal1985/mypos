import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, MapPin, ClipboardList, SquareCheck as CheckSquare, Square } from 'lucide-react'

const STATUS_COLORS: Record<string, 'green' | 'gray' | 'red'> = { active: 'green', inactive: 'gray', terminated: 'red' }
const TASK_STATUS_COLORS: Record<string, 'gray' | 'blue' | 'green'> = { todo: 'gray', in_progress: 'blue', done: 'green' }

export default function FieldForce() {
  const { business } = useAuthStore()
  const [tab, setTab] = useState<'agents' | 'visits' | 'tasks'>('agents')
  const [agents, setAgents] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const [{ data: a }, { data: v }, { data: t }, { data: c }] = await Promise.all([
      supabase.from('field_agents').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('field_visits').select('*, field_agents(name), customers(name)').eq('business_id', business.id).order('visit_date', { ascending: false }),
      supabase.from('field_tasks').select('*, field_agents(name)').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name').eq('business_id', business.id),
    ])
    setAgents(a || []); setVisits(v || []); setTasks(t || []); setCustomers(c || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business) return
    if (tab === 'agents') {
      if (!form.name) return
      if (editing) await supabase.from('field_agents').update({ name: form.name, email: form.email, phone: form.phone, territory: form.territory, status: form.status }).eq('id', editing.id)
      else await supabase.from('field_agents').insert({ name: form.name, email: form.email, phone: form.phone, territory: form.territory, status: form.status, business_id: business.id })
    } else if (tab === 'visits') {
      if (!form.agent_id) return
      if (editing) await supabase.from('field_visits').update({ agent_id: form.agent_id, customer_id: form.customer_id || null, location: form.location, notes: form.notes, status: form.status }).eq('id', editing.id)
      else await supabase.from('field_visits').insert({ agent_id: form.agent_id, customer_id: form.customer_id || null, location: form.location, notes: form.notes, status: form.status, business_id: business.id })
    } else if (tab === 'tasks') {
      if (!form.agent_id || !form.title) return
      if (editing) await supabase.from('field_tasks').update({ agent_id: form.agent_id, title: form.title, description: form.description, status: form.status, due_date: form.due_date || null }).eq('id', editing.id)
      else await supabase.from('field_tasks').insert({ agent_id: form.agent_id, title: form.title, description: form.description, status: form.status, due_date: form.due_date || null, business_id: business.id })
    }
    setShowModal(false); setEditing(null); setForm({}); load()
  }

  const del = async (id: string) => {
    const table = tab === 'agents' ? 'field_agents' : tab === 'visits' ? 'field_visits' : 'field_tasks'
    if (confirm('Delete this record?')) { await supabase.from(table).delete().eq('id', id); load() }
  }

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await supabase.from('field_tasks').update({ status: newStatus }).eq('id', task.id)
    load()
  }

  return (
    <div>
      <PageHeader title="Field Force" subtitle="Manage field agents, visits, and tasks" actions={<button onClick={() => { setEditing(null); setForm(tab === 'agents' ? { name: '', email: '', phone: '', territory: '', status: 'active' } : tab === 'visits' ? { agent_id: '', customer_id: '', location: '', notes: '', status: 'completed' } : { agent_id: '', title: '', description: '', status: 'todo', due_date: '' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add {tab === 'agents' ? 'Agent' : tab === 'visits' ? 'Visit' : 'Task'}</button>} />
      <div className="px-6">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('agents')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'agents' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Agents ({agents.length})</button>
          <button onClick={() => setTab('visits')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'visits' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Visits ({visits.length})</button>
          <button onClick={() => setTab('tasks')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'tasks' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Tasks ({tasks.length})</button>
        </div>

        {loading ? <LoadingState /> : tab === 'agents' ? (
          agents.length === 0 ? <EmptyState icon={<MapPin className="w-8 h-8" />} title="No agents" description="Add field agents to track their visits and tasks." /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map(a => (
                <div key={a.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div><p className="font-medium text-gray-900">{a.name}</p><Badge color={STATUS_COLORS[a.status] || 'gray'}>{a.status}</Badge>{a.territory && <p className="text-xs text-gray-500 mt-1">{a.territory}</p>}</div>
                    <div className="flex gap-1"><button onClick={() => { setEditing(a); setForm({ name: a.name, email: a.email || '', phone: a.phone || '', territory: a.territory || '', status: a.status }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(a.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{a.phone && <p>{a.phone}</p>}{a.email && <p>{a.email}</p>}</div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'visits' ? (
          visits.length === 0 ? <EmptyState icon={<MapPin className="w-8 h-8" />} title="No visits" description="Record field agent visits to customers." /> : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b"><tr><th className="table-header">Agent</th><th className="table-header">Customer</th><th className="table-header">Location</th><th className="table-header">Date</th><th className="table-header">Status</th><th className="table-header text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {visits.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{v.field_agents?.name || '-'}</td>
                      <td className="table-cell">{v.customers?.name || '-'}</td>
                      <td className="table-cell">{v.location || '-'}</td>
                      <td className="table-cell text-gray-500">{formatDate(v.visit_date)}</td>
                      <td className="table-cell"><Badge color="green">{v.status}</Badge></td>
                      <td className="table-cell text-right"><button onClick={() => { setEditing(v); setForm({ agent_id: v.agent_id, customer_id: v.customer_id || '', location: v.location || '', notes: v.notes || '', status: v.status }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button><button onClick={() => del(v.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          tasks.length === 0 ? <EmptyState icon={<ClipboardList className="w-8 h-8" />} title="No tasks" description="Assign tasks to field agents." /> : (
            <div className="space-y-2">
              {tasks.map(t => (
                <div key={t.id} className="card p-4 flex items-center gap-3">
                  <button onClick={() => toggleTaskStatus(t)} className="text-gray-400 hover:text-primary-600">{t.status === 'done' ? <CheckSquare className="w-5 h-5 text-success-600" /> : <Square className="w-5 h-5" />}</button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</p>
                    <p className="text-xs text-gray-500">{t.field_agents?.name} {t.due_date && `- Due ${formatDate(t.due_date)}`}</p>
                  </div>
                  <Badge color={TASK_STATUS_COLORS[t.status] || 'gray'}>{t.status.replace('_', ' ')}</Badge>
                  <button onClick={() => { setEditing(t); setForm({ agent_id: t.agent_id, title: t.title, description: t.description || '', status: t.status, due_date: t.due_date || '' }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(t.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Add ${tab === 'agents' ? 'Agent' : tab === 'visits' ? 'Visit' : 'Task'}`} size="lg">
        <div className="space-y-4">
          {tab === 'agents' && (<>
            <div><label className="label">Name *</label><input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="label">Email</label><input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="input" /></div><div><label className="label">Phone</label><input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="label">Territory</label><input value={form.territory || ''} onChange={e => setForm({ ...form, territory: e.target.value })} className="input" /></div><div><label className="label">Status</label><select value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="active">Active</option><option value="inactive">Inactive</option><option value="terminated">Terminated</option></select></div></div>
          </>)}
          {tab === 'visits' && (<>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Agent *</label><select value={form.agent_id || ''} onChange={e => setForm({ ...form, agent_id: e.target.value })} className="input"><option value="">Select...</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <div><label className="label">Customer</label><select value={form.customer_id || ''} onChange={e => setForm({ ...form, customer_id: e.target.value })} className="input"><option value="">None</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>
            <div><label className="label">Location</label><input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} className="input" /></div>
            <div><label className="label">Notes</label><textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" rows={3} /></div>
          </>)}
          {tab === 'tasks' && (<>
            <div><label className="label">Agent *</label><select value={form.agent_id || ''} onChange={e => setForm({ ...form, agent_id: e.target.value })} className="input"><option value="">Select...</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div><label className="label">Title *</label><input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="input" /></div>
            <div><label className="label">Description</label><textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="input" rows={3} /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="label">Due Date</label><input type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} className="input" /></div><div><label className="label">Status</label><select value={form.status || 'todo'} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option></select></div></div>
          </>)}
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
