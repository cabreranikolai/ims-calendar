import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, Users, ClipboardList, Plus, Calendar, User, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useEvents } from '../hooks/useEvents'
import { useAvailability } from '../hooks/useAvailability'
import { useRequests } from '../hooks/useRequests'
import Avatar from '../components/common/Avatar'
import { EVENT_CATEGORY_MAP } from '../lib/constants'
import { formatTime, friendlyDate, todayStart, todayEnd, isEventUpcoming } from '../lib/utils'
import { isAfter, isBefore, addDays, startOfDay, endOfDay } from 'date-fns'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-8 bg-gray-200 rounded w-1/4" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, isSupervisor } = useAuth()
  const navigate = useNavigate()

  const now = new Date()
  const weekEnd = endOfDay(addDays(now, 7))

  const { events, loading: eventsLoading } = useEvents()
  const { employees, loading: availLoading } = useAvailability()
  const { requests, loading: reqLoading } = useRequests()

  const todayEvents = useMemo(() =>
    events.filter(e =>
      !isBefore(new Date(e.end_at), todayStart()) &&
      !isAfter(new Date(e.start_at), todayEnd())
    ), [events])

  const upcomingEvents = useMemo(() =>
    events
      .filter(e => isAfter(new Date(e.start_at), now) && isBefore(new Date(e.start_at), weekEnd))
      .slice(0, 5),
    [events])

  const availableCount = useMemo(() =>
    employees.filter(e => e.availability?.status === 'available').length,
    [employees])

  const pendingRequests = useMemo(() =>
    requests.filter(r => r.status === 'pending'),
    [requests])

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(now)

  const quickActions = [
    { label: 'New Event', icon: Plus, action: () => navigate('/calendar'), color: 'btn-primary' },
    { label: 'View Calendar', icon: Calendar, action: () => navigate('/calendar'), color: 'btn-secondary' },
    { label: 'My Schedule', icon: User, action: () => navigate('/my-schedule'), color: 'btn-secondary' },
    { label: 'Submit Request', icon: Send, action: () => navigate('/requests'), color: 'btn-secondary' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {profile?.display_name || profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {eventsLoading ? (
          Array.from({ length: isSupervisor ? 4 : 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays size={16} className="text-indigo-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Today's Events</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{todayEvents.length}</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-sky-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Upcoming (7d)</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{upcomingEvents.length}</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-emerald-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Staff Available</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {availLoading ? '—' : availableCount}
                <span className="text-sm text-gray-400 font-normal ml-1">/ {employees.length}</span>
              </p>
            </div>

            {isSupervisor && (
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList size={16} className="text-amber-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Requests</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {reqLoading ? '—' : pendingRequests.length}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's Events */}
        <div className="lg:col-span-2 card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Today's Events</h2>
          {eventsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
          ) : todayEvents.length === 0 ? (
            <div className="empty-state">
              <CalendarDays size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No events scheduled for today</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {todayEvents.map(event => {
                const cat = EVENT_CATEGORY_MAP[event.category]
                return (
                  <div key={event.id} className="flex items-center gap-3 py-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color ?? '#6366f1' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-400">
                        {event.all_day ? 'All day' : `${formatTime(event.start_at)} – ${formatTime(event.end_at)}`}
                        {event.organizer && (
                          <span className="ml-1">· {event.organizer.full_name || event.organizer.display_name}</span>
                        )}
                      </p>
                    </div>
                    {event.organizer && (
                      <Avatar user={event.organizer} size="xs" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map(({ label, icon: Icon, action, color }) => (
              <button
                key={label}
                onClick={action}
                className={`${color} w-full justify-start gap-3`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Upcoming Events</h2>
          <button className="btn-ghost text-sm" onClick={() => navigate('/calendar')}>
            View all
          </button>
        </div>

        {eventsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : upcomingEvents.length === 0 ? (
          <div className="empty-state">
            <Clock size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No upcoming events this week</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100">
            {upcomingEvents.map(event => {
              const cat = EVENT_CATEGORY_MAP[event.category]
              return (
                <div key={event.id} className="flex items-center gap-4 py-3">
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: cat?.color ?? '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-400">
                      {friendlyDate(event.start_at)}
                      {!event.all_day && ` · ${formatTime(event.start_at)}`}
                    </p>
                  </div>
                  <span className={`badge text-xs ${cat?.bg ?? 'bg-gray-100 text-gray-600'}`}>
                    {cat?.label ?? event.category}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
