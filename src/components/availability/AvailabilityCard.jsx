import { useState } from 'react'
import Avatar from '../common/Avatar'
import { AVAILABILITY_STATUS_MAP } from '../../lib/constants'
import Modal from '../common/Modal'
import { FormField } from '../common/FormField'
import Alert from '../common/Alert'

export default function AvailabilityCard({ employee, onSetStatus, isOwnCard }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ status: 'available', note: '', end_at: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const avail = employee.availability
  const statusInfo = AVAILABILITY_STATUS_MAP[avail?.status] ?? AVAILABILITY_STATUS_MAP.available

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSetStatus(employee.id, {
        status: form.status,
        note: form.note,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      })
      setShowModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <Avatar user={employee} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {employee.full_name || employee.display_name}
            </p>
            {employee.job_title && (
              <p className="text-xs text-gray-400 truncate">{employee.job_title}</p>
            )}
            {employee.departments && (
              <p className="text-xs text-gray-400 truncate">{employee.departments.name}</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.dot}`} />
          <span className={`badge text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>

        {/* Event or override note */}
        {avail?.source === 'event' && avail?.eventTitle && (
          <p className="text-xs text-gray-400 italic truncate">In: {avail.eventTitle}</p>
        )}
        {avail?.source === 'override' && avail?.note && (
          <p className="text-xs text-gray-400 italic truncate">{avail.note}</p>
        )}

        {/* Set My Status button */}
        {isOwnCard && (
          <button
            className="btn-secondary btn-sm w-full justify-center mt-1"
            onClick={() => { setForm({ status: avail?.status ?? 'available', note: '', end_at: '' }); setShowModal(true) }}
          >
            Set My Status
          </button>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Set Availability Status" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert type="error" message={error} />}

          <FormField label="Status" required>
            <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {Object.values(AVAILABILITY_STATUS_MAP).map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Note (optional)">
            <input
              className="input"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="e.g., Back at 3pm"
            />
          </FormField>

          <FormField label="Until (optional)">
            <input
              type="datetime-local"
              className="input"
              value={form.end_at}
              onChange={e => setForm(f => ({ ...f, end_at: e.target.value }))}
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Status'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

