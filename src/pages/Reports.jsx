import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import {
  BarChart3, Download, Users, Briefcase, FileSpreadsheet, Lock
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useEvents } from '../hooks/useEvents'
import { useProfiles } from '../hooks/useData'
import { EVENT_CATEGORIES, EVENT_CATEGORY_MAP } from '../lib/constants'
import { downloadCSV, formatDate, formatDateRange } from '../lib/utils'
import Spinner from '../components/common/Spinner'
import Badge from '../components/common/Badge'

export default function Reports() {
  const { isAdmin, isSupervisor } = useAuth()
  const { events, loading: eventsLoading } = useEvents()
  const { profiles, loading: profilesLoading } = useProfiles()

  const loading = eventsLoading || profilesLoading

  // 1. Category Chart Data
  const categoryChartData = useMemo(() => {
    const counts = {}
    EVENT_CATEGORIES.forEach(c => {
      counts[c.value] = { name: c.label, count: 0, color: c.color }
    })
    events.forEach(e => {
      if (counts[e.category]) {
        counts[e.category].count++
      }
    })
    return Object.values(counts)
  }, [events])

  // 2. Staff Schedule & Activity Breakdown
  const staffActivityData = useMemo(() => {
    return profiles.map(p => {
      const staffEvents = events.filter(e =>
        e.organizer_id === p.id || e.event_participants?.some(part => part.user_id === p.id)
      )
      const fieldworkCount = staffEvents.filter(e => e.category === 'fieldwork').length
      const meetingCount   = staffEvents.filter(e => e.category === 'meeting').length
      const leaveCount     = staffEvents.filter(e => e.category === 'leave').length
      const obCount        = staffEvents.filter(e => e.category === 'official_business').length

      return {
        id: p.id,
        name: p.full_name || p.display_name,
        jobTitle: p.job_title || 'Staff',
        totalEvents: staffEvents.length,
        meetingCount,
        fieldworkCount,
        obCount,
        leaveCount,
      }
    }).sort((a, b) => b.totalEvents - a.totalEvents)
  }, [profiles, events])

  // 3. Upcoming Official Activities (Fieldwork, Official Business, Training)
  const upcomingOfficialActivities = useMemo(() => {
    const now = new Date()
    const targetCategories = ['fieldwork', 'official_business', 'training']
    return events
      .filter(e => targetCategories.includes(e.category) && new Date(e.start_at) >= now)
      .slice(0, 10)
  }, [events])

  // 4. Approved Leave Summary (Admin / Supervisor only)
  const leaveSummary = useMemo(() => {
    if (!isSupervisor) return []
    return events.filter(e => e.category === 'leave')
  }, [events, isSupervisor])

  // Export functions
  function handleExportAllEvents() {
    const data = events.map(e => ({
      Title: e.title,
      Category: EVENT_CATEGORY_MAP[e.category]?.label || e.category,
      Start: formatDate(e.start_at, 'yyyy-MM-dd HH:mm'),
      End: formatDate(e.end_at, 'yyyy-MM-dd HH:mm'),
      Organizer: e.organizer?.full_name || e.organizer?.display_name || 'N/A',
      Participants: e.event_participants?.map(p => p.profile?.full_name || p.profile?.display_name).filter(Boolean).join(', ') || 'None',
      Location: e.location || 'N/A',
      Status: e.status,
    }))
    downloadCSV(data, `staff_schedule_report_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  function handleExportLeaveSummary() {
    const data = leaveSummary.map(e => ({
      StaffMember: e.organizer?.full_name || e.organizer?.display_name || 'N/A',
      Start: formatDate(e.start_at, 'yyyy-MM-dd'),
      End: formatDate(e.end_at, 'yyyy-MM-dd'),
      Duration: e.all_day ? 'All-day' : 'Partial',
      Status: e.approval_status || e.status,
    }))
    downloadCSV(data, `staff_leave_summary_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="text-primary-600" size={28} />
            Staff Schedule Reports & Analytics
          </h1>
          <p className="page-subtitle">Track staff workload, scheduled activities, fieldwork, and leave metrics</p>
        </div>
        <button
          className="btn-secondary"
          onClick={handleExportAllEvents}
          disabled={loading || events.length === 0}
        >
          <Download size={16} /> Export Schedule (CSV)
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Events by Category Chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 text-base mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-primary-600" />
              Activities by Category
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [`${value} activities`, 'Total']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 2: Staff Schedule & Activity Breakdown */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 text-base mb-3 flex items-center gap-2">
                <Users size={18} className="text-primary-600" />
                Staff Schedule Breakdown ({staffActivityData.length} Staff)
              </h3>
              <div className="table-container max-h-80 overflow-y-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Total</th>
                      <th>Meetings</th>
                      <th>Fieldwork</th>
                      <th>Leave</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffActivityData.map(s => (
                      <tr key={s.id}>
                        <td>
                          <p className="font-medium text-gray-900 leading-none">{s.name}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{s.jobTitle}</p>
                        </td>
                        <td>
                          <span className="font-bold text-gray-900">{s.totalEvents}</span>
                        </td>
                        <td>{s.meetingCount}</td>
                        <td>{s.fieldworkCount + s.obCount}</td>
                        <td>{s.leaveCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Upcoming Official Activities */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 text-base mb-3 flex items-center gap-2">
                <Briefcase size={18} className="text-primary-600" />
                Upcoming Travel, Fieldwork & Training
              </h3>
              {upcomingOfficialActivities.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No upcoming official travel or fieldwork scheduled.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {upcomingOfficialActivities.map(act => (
                    <div key={act.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={act.category === 'fieldwork' ? 'green' : 'yellow'}>
                            {EVENT_CATEGORY_MAP[act.category]?.label || act.category}
                          </Badge>
                          <span className="font-medium text-gray-900 text-sm">{act.title}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateRange(act.start_at, act.end_at)} {act.location ? `· ${act.location}` : ''}
                        </p>
                        {act.organizer && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Staff: {act.organizer.full_name || act.organizer.display_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Leave Summary (Supervisor/Admin only) */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-primary-600" />
                Approved Staff Leave Records
              </h3>
              {isSupervisor && leaveSummary.length > 0 && (
                <button
                  className="btn-secondary btn-sm"
                  onClick={handleExportLeaveSummary}
                >
                  <Download size={14} /> Export Leaves (CSV)
                </button>
              )}
            </div>

            {!isSupervisor ? (
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
                <Lock size={16} />
                <span>Leave summary details are restricted to supervisors and administrators.</span>
              </div>
            ) : leaveSummary.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No approved leave records found.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Leave Dates</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveSummary.map(leave => (
                      <tr key={leave.id}>
                        <td className="font-medium text-gray-900">
                          {leave.organizer?.full_name || leave.organizer?.display_name || 'Staff'}
                        </td>
                        <td>{formatDateRange(leave.start_at, leave.end_at, leave.all_day)}</td>
                        <td>{leave.all_day ? 'All-day' : 'Partial'}</td>
                        <td>
                          <Badge variant="green">Approved</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
