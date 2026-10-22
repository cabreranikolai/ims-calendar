import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Clock, Users, ClipboardList, Plus, Calendar,
  User, Send, ArrowRight, MapPin
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useEvents } from '../hooks/useEvents'
import { useAvailability } from '../hooks/useAvailability'
import { useRequests } from '../hooks/useRequests'
import Avatar from '../components/common/Avatar'
import { EVENT_CATEGORY_MAP, AVAILABILITY_STATUS_MAP } from '../lib/constants'
import { formatTime, friendlyDate, todayStart, todayEnd } from '../lib/utils'
import { isAfter, isBefore, addDays, endOfDay } from 'date-fns'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3.5 bg-gray-200 rounded w-1/2" />
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-16 h-8 bg-gray-100 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, user, isSupervisor } = useAuth()
  const navigate = useNavigate()

  const { events, loading: eventsLoading } = useEvents()
  const { employees, loading: availLoading } = useAvailability()
  const { requests, loading: reqLoading } = useRequests()

  const now = useMemo(() => new Date(), [])
  const weekEnd = useMemo(() => endOfDay(addDays(new Date(), 7)), [])

  // Filter today's events
  const todayEvents = useMemo(() => {
    const tStart = todayStart()
    const tEnd = todayEnd()
    return events.filter(e =>
      !isBefore(new Date(e.end_at), tStart) &&
      !isAfter(new Date(e.start_at), tEnd)
    )
  }, [events])

  // Filter upcoming 7 days events
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => isAfter(new Date(e.start_at), now) && isBefore(new Date(e.start_at), weekEnd))
      .slice(0, 6)
  }, [events, now, weekEnd])

  // Staff availability metrics
  const availableCount = useMemo(() =>
    employees.filter(e => (e.availability?.status || 'available') === 'available').length,
    [employees])

  // Pending requests for review
  const pendingRequests = useMemo(() =>
    requests.filter(r => r.status === 'pending'),
    [requests])

  // User's own requests
  const myPendingRequests = useMemo(() =>
    requests.filter(r => r.requester_id === user?.id && r.status === 'pending'),
    [requests, user?.id])

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date())
  }, [])

  const quickActions = [
    {
      label: 'New Event',
      desc: 'Schedule a meeting or activity',
      icon: Plus,
      action: () => navigate('/calendar'),
      primary: true,
    },
    {
      label: 'View Calendar',
      desc: 'Check full department schedule',
      icon: Calendar,
      action: () => navigate('/calendar'),
      primary: false,
    },
    {
      label: 'My Schedule',
      desc: 'Your personal agenda & events',
      icon: User,
      action: () => navigate('/my-schedule'),
      primary: false,
    },
    {
      label: 'Submit Request',
      desc: 'Leave, travel, or fieldwork',
      icon: Send,
      action: () => navigate('/requests'),
      primary: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header with Greeting and Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {greeting()}, {profile?.display_name || profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Overview of department activities, staff schedules, and availability
          </p>
        </div>
        <div className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl shadow-xs text-xs font-medium text-gray-600">
          <CalendarDays size={14} className="text-primary-600 shrink-0" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {eventsLoading || availLoading || reqLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {/* Card 1: Today's Events */}
            <div
              onClick={() => navigate('/calendar')}
              className="stat-card cursor-pointer group hover:border-indigo-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Today's Events
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                  <CalendarDays size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-gray-900 leading-none">
                  {todayEvents.length}
                </p>
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  {todayEvents.length === 1 ? '1 event scheduled today' : `${todayEvents.length} events scheduled today`}
                </p>
              </div>
            </div>

            {/* Card 2: Upcoming (7d) */}
            <div
              onClick={() => navigate('/calendar')}
              className="stat-card cursor-pointer group hover:border-sky-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Upcoming (7d)
                </span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 group-hover:bg-sky-100 transition-colors">
                  <Clock size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-gray-900 leading-none">
                  {upcomingEvents.length}
                </p>
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  Across the next 7 days
                </p>
              </div>
            </div>

            {/* Card 3: Staff Available */}
            <div
              onClick={() => navigate('/availability')}
              className="stat-card cursor-pointer group hover:border-emerald-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Staff Available
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-gray-900 leading-none">
                  {availableCount}
                  <span className="text-base text-gray-400 font-normal ml-1">
                    / {employees.length}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  {employees.length - availableCount === 0
                    ? 'All staff in office'
                    : `${employees.length - availableCount} busy or away`}
                </p>
              </div>
            </div>

            {/* Card 4: Requests Status */}
            <div
              onClick={() => navigate('/requests')}
              className="stat-card cursor-pointer group hover:border-amber-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {isSupervisor ? 'Pending Reviews' : 'My Requests'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                  <ClipboardList size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-gray-900 leading-none">
                  {isSupervisor ? pendingRequests.length : myPendingRequests.length}
                </p>
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  {isSupervisor
                    ? pendingRequests.length > 0 ? 'Action required' : 'All caught up'
                    : 'Pending approvals'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Today's Schedule */}
        <div className="lg:col-span-2 card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Today's Schedule</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {todayEvents.length}
                </span>
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                Open Calendar <ArrowRight size={13} />
              </button>
            </div>

            {eventsLoading ? (
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : todayEvents.length === 0 ? (
              <div className="empty-state py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                  <CalendarDays size={22} />
                </div>
                <p className="text-sm font-semibold text-gray-700">No events scheduled for today</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  The department schedule is clear. Click "New Event" to plan a meeting or add an activity.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {todayEvents.map(event => {
                  const cat = EVENT_CATEGORY_MAP[event.category]
                  return (
                    <div
                      key={event.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigate('/calendar')}
                    >
                      {/* Left: Time and Title */}
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Time pill */}
                        <div className="shrink-0 w-28 text-left">
                          <p className="text-xs font-semibold text-gray-900">
                            {event.all_day ? 'All-day' : formatTime(event.start_at)}
                          </p>
                          {!event.all_day && (
                            <p className="text-[11px] text-gray-400 leading-tight">
                              to {formatTime(event.end_at)}
                            </p>
                          )}
                        </div>

                        {/* Event Category Color Bar */}
                        <div
                          className="w-1 self-stretch rounded-full shrink-0"
                          style={{ backgroundColor: cat?.color ?? '#6366f1' }}
                        />

                        {/* Title and details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {event.title}
                            </p>
                            <span className={`badge text-[11px] py-0 px-2 ${cat?.bg ?? 'bg-gray-100 text-gray-700'}`}>
                              {cat?.label ?? event.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            {event.organizer && (
                              <span className="font-medium text-gray-700">
                                {event.organizer.full_name || event.organizer.display_name}
                              </span>
                            )}
                            {event.location && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1 text-gray-500 truncate">
                                  <MapPin size={11} className="shrink-0" />
                                  {event.location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Organizer Avatar */}
                      {event.organizer && (
                        <div className="shrink-0 flex items-center gap-2 pl-3 sm:pl-0">
                          <Avatar user={event.organizer} size="sm" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions + Staff Availability Snapshot */}
        <div className="space-y-6">

          {/* Quick Actions Card */}
          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickActions.map(({ label, desc, icon: Icon, action, primary }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                    primary
                      ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      primary ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${primary ? 'text-white' : 'text-gray-900'}`}>
                        {label}
                      </p>
                      <p className={`text-xs mt-0.5 truncate ${primary ? 'text-indigo-100' : 'text-gray-400'}`}>
                        {desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} className={`shrink-0 ml-2 transition-transform group-hover:translate-x-0.5 ${
                    primary ? 'text-white' : 'text-gray-400'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Staff Availability Snapshot Card */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Staff Availability</h2>
              <button
                onClick={() => navigate('/availability')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            {availLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-7 h-7 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : employees.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No staff records registered yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {employees.slice(0, 5).map(emp => {
                  const statusKey = emp.availability?.status || 'available'
                  const statusInfo = AVAILABILITY_STATUS_MAP[statusKey] ?? AVAILABILITY_STATUS_MAP.available
                  return (
                    <div key={emp.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar user={emp} size="xs" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {emp.full_name || emp.display_name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {emp.job_title || 'Staff Member'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                        <span className="text-[11px] font-medium text-gray-600">
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Upcoming Activities Section */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Upcoming This Week</h2>
            <p className="text-xs text-gray-500 mt-0.5">Scheduled events across the next 7 days</p>
          </div>
          <button
            onClick={() => navigate('/calendar')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            Full Calendar <ArrowRight size={13} />
          </button>
        </div>

        {eventsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="empty-state py-8">
            <Clock size={28} className="text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">No upcoming events this week</p>
            <p className="text-xs text-gray-400 mt-1">Your upcoming schedule for the next 7 days is clear.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingEvents.map(event => {
              const cat = EVENT_CATEGORY_MAP[event.category]
              return (
                <div
                  key={event.id}
                  onClick={() => navigate('/calendar')}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`badge text-[11px] py-0.5 px-2 ${cat?.bg ?? 'bg-gray-100 text-gray-700'}`}>
                        {cat?.label ?? event.category}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">
                        {friendlyDate(event.start_at)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 leading-snug truncate">
                      {event.title}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock size={12} className="text-gray-400 shrink-0" />
                      <span>{event.all_day ? 'All-day event' : `${formatTime(event.start_at)} – ${formatTime(event.end_at)}`}</span>
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    {event.organizer ? (
                      <span className="truncate font-medium text-gray-700">
                        {event.organizer.full_name || event.organizer.display_name}
                      </span>
                    ) : (
                      <span className="text-gray-400">Department</span>
                    )}

                    {event.location && (
                      <span className="flex items-center gap-1 text-gray-400 truncate max-w-[120px]">
                        <MapPin size={11} className="shrink-0" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
