import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, ShieldAlert, CheckCircle, Clock, Globe, FileCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Alert from '../components/common/Alert'
import Spinner from '../components/common/Spinner'
import { FormField } from '../components/common/FormField'

export default function Settings() {
  const { isAdmin } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  const [settings, setSettings] = useState({
    office_name: 'Office Availability Calendar',
    office_timezone: 'Asia/Manila',
    working_hours_start: '08:00',
    working_hours_end: '17:00',
    working_days: [1, 2, 3, 4, 5],
    allow_employee_event_create: true,
    require_approval_for_leave: true,
    require_approval_for_travel: true,
  })

  useEffect(() => {
    async function loadSettings() {
      if (!isAdmin) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from('system_settings').select('*')
        if (error) throw error

        if (data && data.length > 0) {
          const loaded = {}
          data.forEach(item => {
            loaded[item.key] = item.value
          })
          setSettings(prev => ({ ...prev, ...loaded }))
        }
      } catch (err) {
        console.error('Failed to load system settings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [isAdmin])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaveSuccess(false)

    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }))

      for (const item of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(item, { onConflict: 'key' })
        if (error) throw error
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleWorkingDay(dayIndex) {
    setSettings(prev => {
      const days = prev.working_days || []
      const exists = days.includes(dayIndex)
      return {
        ...prev,
        working_days: exists ? days.filter(d => d !== dayIndex) : [...days, dayIndex].sort(),
      }
    })
  }

  if (!isAdmin) {
    return (
      <div className="card p-8 max-w-lg mx-auto text-center mt-12 space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-sm text-gray-500">
          You do not have administrative privileges to view or modify system settings. Please contact your system administrator.
        </p>
      </div>
    )
  }

  const daysOfWeek = [
    { index: 1, label: 'Mon' },
    { index: 2, label: 'Tue' },
    { index: 3, label: 'Wed' },
    { index: 4, label: 'Thu' },
    { index: 5, label: 'Fri' },
    { index: 6, label: 'Sat' },
    { index: 0, label: 'Sun' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <SettingsIcon className="text-primary-600" size={28} />
          System Settings
        </h1>
        <p className="page-subtitle">Configure organization profile, working hours, and approval workflows</p>
      </div>

      {saveSuccess && (
        <Alert
          type="success"
          message="System settings updated successfully."
          onDismiss={() => setSaveSuccess(false)}
        />
      )}

      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Organization & General */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 text-base border-b border-gray-100 pb-3 flex items-center gap-2">
              <Globe size={18} className="text-primary-600" />
              General Office Information
            </h3>

            <FormField label="Office / Application Name" required>
              <input
                className="input"
                value={settings.office_name}
                onChange={e => setSettings(s => ({ ...s, office_name: e.target.value }))}
              />
            </FormField>

            <FormField label="Default Timezone">
              <select
                className="select"
                value={settings.office_timezone}
                onChange={e => setSettings(s => ({ ...s, office_timezone: e.target.value }))}
              >
                <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                <option value="UTC">UTC</option>
              </select>
            </FormField>
          </div>

          {/* Working Hours & Schedule */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 text-base border-b border-gray-100 pb-3 flex items-center gap-2">
              <Clock size={18} className="text-primary-600" />
              Working Hours & Standard Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Working Hours Start">
                <input
                  type="time"
                  className="input"
                  value={settings.working_hours_start}
                  onChange={e => setSettings(s => ({ ...s, working_hours_start: e.target.value }))}
                />
              </FormField>

              <FormField label="Working Hours End">
                <input
                  type="time"
                  className="input"
                  value={settings.working_hours_end}
                  onChange={e => setSettings(s => ({ ...s, working_hours_end: e.target.value }))}
                />
              </FormField>
            </div>

            <div>
              <label className="label">Official Working Days</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {daysOfWeek.map(d => {
                  const isChecked = (settings.working_days || []).includes(d.index)
                  return (
                    <button
                      type="button"
                      key={d.index}
                      onClick={() => toggleWorkingDay(d.index)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        isChecked
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Policies & Workflows */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 text-base border-b border-gray-100 pb-3 flex items-center gap-2">
              <FileCheck size={18} className="text-primary-600" />
              Permissions & Approval Policies
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 mt-1"
                  checked={settings.allow_employee_event_create}
                  onChange={e => setSettings(s => ({ ...s, allow_employee_event_create: e.target.checked }))}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Allow employees to schedule office events</p>
                  <p className="text-xs text-gray-400">When disabled, only supervisors and administrators can create shared calendar events.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 mt-1"
                  checked={settings.require_approval_for_leave}
                  onChange={e => setSettings(s => ({ ...s, require_approval_for_leave: e.target.checked }))}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Require supervisor approval for leave</p>
                  <p className="text-xs text-gray-400">Leave events are marked pending and only update staff availability once approved.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 mt-1"
                  checked={settings.require_approval_for_travel}
                  onChange={e => setSettings(s => ({ ...s, require_approval_for_travel: e.target.checked }))}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Require supervisor approval for official travel and fieldwork</p>
                  <p className="text-xs text-gray-400">Staff travel outside the office requires supervisor confirmation.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
