import { useState } from 'react'
import { FormField } from '../common/FormField'
import { REQUEST_CATEGORIES } from '../../lib/constants'
import Alert from '../common/Alert'

export default function RequestForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    category: 'leave',
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    destination: '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.start_at)     errs.start_at = 'Start date is required'
    if (!form.end_at)       errs.end_at   = 'End date is required'
    if (form.start_at && form.end_at && form.end_at <= form.start_at) {
      errs.end_at = 'End must be after start'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    try {
      await onSubmit({
        ...form,
        start_at: new Date(form.start_at).toISOString(),
        end_at:   new Date(form.end_at).toISOString(),
        destination: form.destination || null,
      })
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  const showDestination = ['official_travel', 'fieldwork'].includes(form.category)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && <Alert type="error" message={submitError} />}

      <FormField label="Request Type" required>
        <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
          {REQUEST_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Title" required error={errors.title}>
        <input
          className="input"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Brief description of the request…"
        />
      </FormField>

      <FormField label="Details / Purpose">
        <textarea
          className="input resize-none"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Provide additional context or justification…"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Date/Time" required error={errors.start_at}>
          <input
            type="datetime-local"
            className="input"
            value={form.start_at}
            onChange={e => set('start_at', e.target.value)}
          />
        </FormField>
        <FormField label="End Date/Time" required error={errors.end_at}>
          <input
            type="datetime-local"
            className="input"
            value={form.end_at}
            onChange={e => set('end_at', e.target.value)}
          />
        </FormField>
      </div>

      {showDestination && (
        <FormField label="Destination / Location">
          <input
            className="input"
            value={form.destination}
            onChange={e => set('destination', e.target.value)}
            placeholder="City, Province, or specific address…"
          />
        </FormField>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </form>
  )
}
