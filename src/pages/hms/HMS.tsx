import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { PageHeader, Modal, EmptyState, LoadingState, Badge } from '@/components/ui'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Plus, Pencil, Trash2, HeartPulse, Stethoscope, Calendar, DollarSign } from 'lucide-react'

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow'> = {
  scheduled: 'gray', confirmed: 'blue', completed: 'green', cancelled: 'red', no_show: 'yellow',
}
const BILLING_COLORS: Record<string, 'red' | 'yellow' | 'green'> = { unpaid: 'red', partial: 'yellow', paid: 'green' }

export default function HMS() {
  const { business } = useAuthStore()
  const [tab, setTab] = useState<'patients' | 'appointments' | 'records' | 'billing'>('patients')
  const [patients, setPatients] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [billing, setBilling] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  const load = useCallback(async () => {
    if (!business) return
    setLoading(true)
    const [{ data: p }, { data: a }, { data: r }, { data: b }] = await Promise.all([
      supabase.from('hms_patients').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('hms_appointments').select('*, hms_patients(name)').eq('business_id', business.id).order('appointment_date', { ascending: false }),
      supabase.from('hms_medical_records').select('*, hms_patients(name)').eq('business_id', business.id).order('record_date', { ascending: false }),
      supabase.from('hms_billing').select('*, hms_patients(name)').eq('business_id', business.id).order('billing_date', { ascending: false }),
    ])
    setPatients(p || []); setAppointments(a || []); setRecords(r || []); setBilling(b || []); setLoading(false)
  }, [business])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!business) return
    const tables: Record<string, string> = { patients: 'hms_patients', appointments: 'hms_appointments', records: 'hms_medical_records', billing: 'hms_billing' }
    const table = tables[tab]
    if (tab === 'patients') {
      if (!form.name) return
      const payload = { name: form.name, email: form.email, phone: form.phone, gender: form.gender, date_of_birth: form.date_of_birth || null, address: form.address, blood_group: form.blood_group, emergency_contact: form.emergency_contact }
      if (editing) await supabase.from(table).update(payload).eq('id', editing.id)
      else await supabase.from(table).insert({ ...payload, business_id: business.id })
    } else if (tab === 'appointments') {
      if (!form.patient_id) return
      const payload = { patient_id: form.patient_id, doctor_name: form.doctor_name, appointment_date: form.appointment_date, reason: form.reason, status: form.status }
      if (editing) await supabase.from(table).update(payload).eq('id', editing.id)
      else await supabase.from(table).insert({ ...payload, business_id: business.id })
    } else if (tab === 'records') {
      if (!form.patient_id) return
      const payload = { patient_id: form.patient_id, diagnosis: form.diagnosis, prescription: form.prescription, notes: form.notes }
      if (editing) await supabase.from(table).update(payload).eq('id', editing.id)
      else await supabase.from(table).insert({ ...payload, business_id: business.id })
    } else if (tab === 'billing') {
      if (!form.patient_id) return
      const payload = { patient_id: form.patient_id, invoice_number: form.invoice_number, amount: parseFloat(form.amount) || 0, paid_amount: parseFloat(form.paid_amount) || 0, status: form.status }
      if (editing) await supabase.from(table).update(payload).eq('id', editing.id)
      else await supabase.from(table).insert({ ...payload, business_id: business.id })
    }
    setShowModal(false); setEditing(null); setForm({}); load()
  }

  const del = async (id: string) => {
    const tables: Record<string, string> = { patients: 'hms_patients', appointments: 'hms_appointments', records: 'hms_medical_records', billing: 'hms_billing' }
    if (confirm('Delete this record?')) { await supabase.from(tables[tab]).delete().eq('id', id); load() }
  }

  const sym = business?.currency_symbol || '$'
  const tabs = [
    { key: 'patients', label: 'Patients', icon: HeartPulse, count: patients.length },
    { key: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
    { key: 'records', label: 'Medical Records', icon: Stethoscope, count: records.length },
    { key: 'billing', label: 'Billing', icon: DollarSign, count: billing.length },
  ]

  return (
    <div>
      <PageHeader title="Hospital Management" subtitle="Patients, appointments, records & billing" actions={<button onClick={() => { setEditing(null); setForm(tab === 'patients' ? { name: '', email: '', phone: '', gender: '', date_of_birth: '', address: '', blood_group: '', emergency_contact: '' } : tab === 'appointments' ? { patient_id: '', doctor_name: '', appointment_date: '', reason: '', status: 'scheduled' } : tab === 'records' ? { patient_id: '', diagnosis: '', prescription: '', notes: '' } : { patient_id: '', invoice_number: `BILL${Date.now().toString().slice(-6)}`, amount: '0', paid_amount: '0', status: 'unpaid' }); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add</button>} />
      <div className="px-6">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {tabs.map(t => { const Icon = t.icon; return (
            <button key={t.key} onClick={() => setTab(t.key as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Icon className="w-4 h-4" /> {t.label} ({t.count})</button>
          ) })}
        </div>

        {loading ? <LoadingState /> : (
          <>
            {tab === 'patients' && (
              patients.length === 0 ? <EmptyState icon={<HeartPulse className="w-8 h-8" />} title="No patients" description="Register patients to manage their care." /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patients.map(p => (
                    <div key={p.id} className="card p-4">
                      <div className="flex items-start justify-between">
                        <div><p className="font-medium text-gray-900">{p.name}</p>{p.gender && <p className="text-xs text-gray-500 capitalize">{p.gender}{p.blood_group ? ` - ${p.blood_group}` : ''}</p>}{p.phone && <p className="text-xs text-gray-500 mt-1">{p.phone}</p>}</div>
                        <div className="flex gap-1"><button onClick={() => { setEditing(p); setForm({ name: p.name, email: p.email || '', phone: p.phone || '', gender: p.gender || '', date_of_birth: p.date_of_birth || '', address: p.address || '', blood_group: p.blood_group || '', emergency_contact: p.emergency_contact || '' }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(p.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
            {tab === 'appointments' && (
              appointments.length === 0 ? <EmptyState icon={<Calendar className="w-8 h-8" />} title="No appointments" description="Schedule patient appointments." /> : (
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b"><tr><th className="table-header">Patient</th><th className="table-header">Doctor</th><th className="table-header">Date</th><th className="table-header">Reason</th><th className="table-header">Status</th><th className="table-header text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {appointments.map(a => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="table-cell font-medium">{a.hms_patients?.name || '-'}</td>
                          <td className="table-cell">{a.doctor_name || '-'}</td>
                          <td className="table-cell text-gray-500">{formatDateTime(a.appointment_date)}</td>
                          <td className="table-cell">{a.reason || '-'}</td>
                          <td className="table-cell"><Badge color={STATUS_COLORS[a.status] || 'gray'}>{a.status.replace('_', ' ')}</Badge></td>
                          <td className="table-cell text-right">
                            <button onClick={() => { setEditing(a); setForm({ patient_id: a.patient_id, doctor_name: a.doctor_name || '', appointment_date: a.appointment_date, reason: a.reason || '', status: a.status }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => del(a.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
            {tab === 'records' && (
              records.length === 0 ? <EmptyState icon={<Stethoscope className="w-8 h-8" />} title="No medical records" description="Add patient diagnoses and prescriptions." /> : (
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b"><tr><th className="table-header">Patient</th><th className="table-header">Diagnosis</th><th className="table-header">Prescription</th><th className="table-header">Date</th><th className="table-header text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {records.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="table-cell font-medium">{r.hms_patients?.name || '-'}</td>
                          <td className="table-cell">{r.diagnosis || '-'}</td>
                          <td className="table-cell max-w-xs truncate">{r.prescription || '-'}</td>
                          <td className="table-cell text-gray-500">{formatDate(r.record_date)}</td>
                          <td className="table-cell text-right">
                            <button onClick={() => { setEditing(r); setForm({ patient_id: r.patient_id, diagnosis: r.diagnosis || '', prescription: r.prescription || '', notes: r.notes || '' }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => del(r.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
            {tab === 'billing' && (
              billing.length === 0 ? <EmptyState icon={<DollarSign className="w-8 h-8" />} title="No billing records" description="Create patient invoices and track payments." /> : (
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b"><tr><th className="table-header">Invoice</th><th className="table-header">Patient</th><th className="table-header">Amount</th><th className="table-header">Paid</th><th className="table-header">Status</th><th className="table-header text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {billing.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="table-cell font-medium">{b.invoice_number}</td>
                          <td className="table-cell">{b.hms_patients?.name || '-'}</td>
                          <td className="table-cell">{formatCurrency(Number(b.amount), business?.currency, sym)}</td>
                          <td className="table-cell">{formatCurrency(Number(b.paid_amount), business?.currency, sym)}</td>
                          <td className="table-cell"><Badge color={BILLING_COLORS[b.status] || 'gray'}>{b.status}</Badge></td>
                          <td className="table-cell text-right">
                            <button onClick={() => { setEditing(b); setForm({ patient_id: b.patient_id, invoice_number: b.invoice_number, amount: String(b.amount), paid_amount: String(b.paid_amount), status: b.status }); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => del(b.id)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded inline-flex"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Add ${tab === 'patients' ? 'Patient' : tab === 'appointments' ? 'Appointment' : tab === 'records' ? 'Medical Record' : 'Bill'}`} size="lg">
        <div className="space-y-4">
          {tab === 'patients' && (<>
            <div><label className="label">Name *</label><input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input" /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="label">Email</label><input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="input" /></div><div><label className="label">Phone</label><input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" /></div></div>
            <div className="grid grid-cols-3 gap-4"><div><label className="label">Gender</label><select value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })} className="input"><option value="">-</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div><div><label className="label">Date of Birth</label><input type="date" value={form.date_of_birth || ''} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="input" /></div><div><label className="label">Blood Group</label><input value={form.blood_group || ''} onChange={e => setForm({ ...form, blood_group: e.target.value })} className="input" placeholder="A+" /></div></div>
            <div><label className="label">Address</label><input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="input" /></div>
            <div><label className="label">Emergency Contact</label><input value={form.emergency_contact || ''} onChange={e => setForm({ ...form, emergency_contact: e.target.value })} className="input" /></div>
          </>)}
          {tab === 'appointments' && (<>
            <div><label className="label">Patient *</label><select value={form.patient_id || ''} onChange={e => setForm({ ...form, patient_id: e.target.value })} className="input"><option value="">Select...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="label">Doctor</label><input value={form.doctor_name || ''} onChange={e => setForm({ ...form, doctor_name: e.target.value })} className="input" /></div>
            <div><label className="label">Appointment Date & Time</label><input type="datetime-local" value={form.appointment_date || ''} onChange={e => setForm({ ...form, appointment_date: e.target.value })} className="input" /></div>
            <div><label className="label">Reason</label><input value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} className="input" /></div>
            <div><label className="label">Status</label><select value={form.status || 'scheduled'} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="scheduled">Scheduled</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No Show</option></select></div>
          </>)}
          {tab === 'records' && (<>
            <div><label className="label">Patient *</label><select value={form.patient_id || ''} onChange={e => setForm({ ...form, patient_id: e.target.value })} className="input"><option value="">Select...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="label">Diagnosis</label><input value={form.diagnosis || ''} onChange={e => setForm({ ...form, diagnosis: e.target.value })} className="input" /></div>
            <div><label className="label">Prescription</label><textarea value={form.prescription || ''} onChange={e => setForm({ ...form, prescription: e.target.value })} className="input" rows={3} /></div>
            <div><label className="label">Notes</label><textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" rows={2} /></div>
          </>)}
          {tab === 'billing' && (<>
            <div><label className="label">Patient *</label><select value={form.patient_id || ''} onChange={e => setForm({ ...form, patient_id: e.target.value })} className="input"><option value="">Select...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="label">Invoice Number</label><input value={form.invoice_number || ''} onChange={e => setForm({ ...form, invoice_number: e.target.value })} className="input" /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="label">Amount</label><input type="number" step="0.01" value={form.amount || '0'} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" /></div><div><label className="label">Paid Amount</label><input type="number" step="0.01" value={form.paid_amount || '0'} onChange={e => setForm({ ...form, paid_amount: e.target.value })} className="input" /></div></div>
            <div><label className="label">Status</label><select value={form.status || 'unpaid'} onChange={e => setForm({ ...form, status: e.target.value })} className="input"><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option></select></div>
          </>)}
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
