import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { FormField } from '../common/FormField'
import {
  EVENT_CATEGORIES, VISIBILITY_LABELS, APPROVAL_STATUS,
} from '../../lib/constants'
import { useDepartments, useProfiles } from '../../hooks/useData'
import { useAuth } from '../../contexts/AuthContext'
import Alert from '../common/Alert'

const DEFAULT_FORM = {
  title: '',
  description: '',
  category: 'meeting',
  start_at: '',
  end_at: '',
  all_day: false,
  department_id: '',
  location: '',
  meeting_link: '',
  visibility: 'department',
  requires_approval: false,
  notes: '',
  participants: [],
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm")
}

export default function EventForm({ event, onSubmit, onCancel, loading }) {
  const { profile, isAdmin } = useAuth()
  const { departments } = useDepartments()
  const { profiles }    = useProfiles()

  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (event) {
      let startStr = toDatetimeLocal(event.start_at)
      let endStr = toDatetimeLocal(event.end_at)
      if (startStr && !endStr) {
        const startDate = new Date(event.start_at)
        startDate.setHours(startDate.getHours() + 1)
        endStr = toDatetimeLocal(startDate.toISOString())
      }
      setForm({
        title:             event.title ?? '',
        description:       event.description ?? '',
        category:          event.category ?? 'meeting',
        start_at:          startStr,
        end_at:            endStr,
        all_day:           event.all_day ?? false,
        department_id:     event.department_id ?? profile?.department_id ?? '',
        location:          event.location ?? '',
        meeting_link:      event.meeting_link ?? '',
        visibility:        event.visibility ?? 'department',
        requires_approval: event.requires_approval ?? false,
        notes:             event.notes ?? '',
        participants:      event.event_participants?.map(p => p.user_id) ?? [],
      })
    } else {
      // Pre-fill department for non-admin
      setForm(f => ({
        ...f,
        department_id: profile?.department_id ?? '',
      }))
    }
  }, [event, profile])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.title.trim())   errs.title   = 'Title is required'
    if (!form.start_at)       errs.start_at = 'Start date/time is required'
    if (!form.end_at)         errs.end_at   = 'End date/time is required'
    if (form.start_at && form.end_at && form.end_at <= form.start_at) {
      errs.end_at = 'End must be after start'
    }
    if (form.meeting_link && !/^https?:\/\//.test(form.meeting_link)) {
      errs.meeting_link = 'Must be a valid URL (https://…)'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    try {
      const payload = {
        ...form,
        start_at: new Date(form.start_at).toISOString(),
        end_at:   new Date(form.end_at).toISOString(),
        department_id: form.department_id || null,
        approval_status: form.requires_approval ? 'pending' : 'approved',
      }
      await onSubmit(payload)
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  function toggleParticipant(uid) {
    setForm(f => ({
      ...f,
      participants: f.participants.includes(uid)
        ? f.participants.filter(id => id !== uid)
        : [...f.participants, uid],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && <Alert type="error" message={submitError} />}

      {/* Title */}
      <FormField label="Event Title" required error={errors.title}>
        <input
          className="input"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g., Weekly Team Meeting"
        />
      </FormField>

      {/* Category */}
      <FormField label="Category" required>
        <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
          {EVENT_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </FormField>

      {/* All-day toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="all_day"
          checked={form.all_day}
          onChange={e => set('all_day', e.target.checked)}
          className="w-4 h-4 text-primary-600 rounded border-gray-300"
        />
        <label htmlFor="all_day" className="text-sm text-gray-700">All-day event</label>
      </div>

      {/* Start / End */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start" required error={errors.start_at}>
          <input
            type={form.all_day ? 'date' : 'datetime-local'}
            className="input"
            value={form.all_day ? form.start_at?.slice(0, 10) : form.start_at}
            onChange={e => set('start_at', e.target.value)}
          />
        </FormField>
        <FormField label="End" required error={errors.end_at}>
          <input
            type={form.all_day ? 'date' : 'datetime-local'}
            className="input"
            value={form.all_day ? form.end_at?.slice(0, 10) : form.end_at}
            onChange={e => set('end_at', e.target.value)}
          />
        </FormField>
      </div>

      {/* Description */}
      <FormField label="Description">
        <textarea
          className="input resize-none"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Optional description…"
        />
      </FormField>

      {/* Department */}
      <FormField label="Department">
        <select
          className="select"
          value={form.department_id}
          onChange={e => set('department_id', e.target.value)}
          disabled={!isAdmin && !!profile?.department_id}
        >
          <option value="">Select department…</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </FormField>

      {/* Location */}
      <FormField label="Location / Venue" error={errors.location}>
        <input
          className="input"
          value={form.location}
          onChange={e => set('location', e.target.value)}
          placeholder="Conference Room A, Building 2…"
        />
      </FormField>

      {/* Meeting link */}
      <FormField label="Meeting Link" error={errors.meeting_link}>
        <input
          className="input"
          type="url"
          value={form.meeting_link}
          onChange={e => set('meeting_link', e.target.value)}
          placeholder="https://meet.google.com/…"
        />
      </FormField>

      {/* Visibility */}
      <FormField label="Visibility">
        <select className="select" value={form.visibility} onChange={e => set('visibility', e.target.value)}>
          {Object.entries(VISIBILITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </FormField>

      {/* Requires approval */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="requires_approval"
          checked={form.requires_approval}
          onChange={e => set('requires_approval', e.target.checked)}
          className="w-4 h-4 text-primary-600 rounded border-gray-300"
        />
        <label htmlFor="requires_approval" className="text-sm text-gray-700">
          Requires supervisor approval
        </label>
      </div>

      {/* Participants */}
      <FormField label="Participants">
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
          {profiles.map(p => (
            <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.participants.includes(p.id)}
                onChange={() => toggleParticipant(p.id)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                {p.full_name || p.display_name}
                {p.departments && <span className="text-gray-400 ml-1">· {p.departments.name}</span>}
              </span>
            </label>
          ))}
        </div>
      </FormField>

      {/* Notes */}
      <FormField label="Notes">
        <textarea
          className="input resize-none"
          rows={2}
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Internal notes…"
        />
      </FormField>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : event ? 'Save Changes' : 'Create Event'}
        </button>
      </div>
    </form>
  )
}

