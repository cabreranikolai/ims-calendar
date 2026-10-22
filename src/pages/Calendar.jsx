import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import listPlugin from '@fullcalendar/react/list'
import interactionPlugin from '@fullcalendar/react/interaction'
import breezyThemePlugin from '@fullcalendar/react/themes/breezy'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/breezy/theme.css'
import '@fullcalendar/react/themes/breezy/palettes/indigo.css'

import {
  Calendar as CalendarIcon, Plus, Filter, User, Tag,
  RotateCcw, Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { useEvents } from '../hooks/useEvents'
import { useProfiles } from '../hooks/useData'
import { getEventColorUserId, toFCEvent, userToColor } from '../lib/utils'
import { EVENT_CATEGORIES } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import EventDetail from '../components/calendar/EventDetail'
import EventForm from '../components/calendar/EventForm'
import Modal from '../components/common/Modal'
import Spinner from '../components/common/Spinner'

export default function Calendar() {
  const { user, isSupervisor } = useAuth()
  const navigate = useNavigate()
  const { profiles } = useProfiles()

  // Filters
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [category, setCategory]               = useState('')
  const [myEventsOnly, setMyEventsOnly]       = useState(false)

  const { events, loading, createEvent, updateEvent, cancelEvent, deleteEvent } = useEvents()

  // UI state
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showForm, setShowForm]           = useState(false)
  const [editingEvent, setEditingEvent]   = useState(null)
  const [newEventDate, setNewEventDate]   = useState('')
  const [formLoading, setFormLoading]     = useState(false)

  const calendarRef = useRef(null)

  // Filter events in memory for instant responsiveness and attendee matching
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (category && e.category !== category) return false
      if (myEventsOnly) {
        const isOrganizer = e.organizer_id === user?.id
        const isParticipant = e.event_participants?.some(p => p.user_id === user?.id)
        if (!isOrganizer && !isParticipant) return false
      }
      if (selectedStaffId) {
        const isOrganizer = e.organizer_id === selectedStaffId
        const isParticipant = e.event_participants?.some(p => p.user_id === selectedStaffId)
        if (!isOrganizer && !isParticipant) return false
      }
      return true
    })
  }, [events, category, myEventsOnly, selectedStaffId, user?.id])

  const fcEvents = useMemo(() => filteredEvents.map(toFCEvent), [filteredEvents])

  const eventStaff = useMemo(() => {
    const profilesById = new Map(profiles.map(profile => [profile.id, profile]))
    const staffById = new Map()

    events.forEach(event => {
      const staffId = getEventColorUserId(event)
      if (staffId) {
        const participant = event.event_participants?.find(p => p.user_id === staffId)
        staffById.set(
          staffId,
          profilesById.get(staffId) || participant?.profile || event.organizer || { id: staffId, display_name: 'Staff member' }
        )
      }
    })

    return [...staffById.values()].sort((a, b) =>
      (a.full_name || a.display_name || '').localeCompare(b.full_name || b.display_name || '')
    )
  }, [events, profiles])

  const hasActiveFilters = Boolean(selectedStaffId || category || myEventsOnly)

  function handleResetFilters() {
    setSelectedStaffId('')
    setCategory('')
    setMyEventsOnly(false)
  }

  function handleEventClick(info) {
    setSelectedEvent(info.event.extendedProps)
  }

  function handleDateSelect(info) {
    if (!isSupervisor) return
    const dateStr = format(info.start, "yyyy-MM-dd'T'HH:mm")
    setNewEventDate(dateStr)
    setEditingEvent(null)
    setShowForm(true)
  }

  function handleNewEvent() {
    if (!isSupervisor) {
      navigate('/requests')
      return
    }
    setEditingEvent(null)
    setNewEventDate('')
    setShowForm(true)
  }

  function handleEdit(event) {
    setEditingEvent(event)
    setSelectedEvent(null)
    setShowForm(true)
  }

  async function handleFormSubmit(data) {
    setFormLoading(true)
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, data)
      } else {
        await createEvent(data)
      }
      setShowForm(false)
      setEditingEvent(null)
    } finally {
      setFormLoading(false)
    }
  }

  function handleCloseDetail() {
    setSelectedEvent(null)
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <CalendarIcon className="text-primary-600" size={28} />
            Department Calendar
          </h1>
          <p className="page-subtitle">
            View, schedule, and track all staff activities, meetings, fieldwork, and leave
          </p>
        </div>
        <button className="btn-primary shrink-0 self-start sm:self-auto shadow-xs" onClick={handleNewEvent}>
          <Plus size={16} /> {isSupervisor ? 'New Event' : 'Request Schedule'}
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="card p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Staff Filter */}
          <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <User size={15} />
            </div>
            <select
              className="select text-sm py-2 pl-9 pr-8 w-full font-medium text-gray-700 bg-white"
              value={selectedStaffId}
              onChange={e => {
                setSelectedStaffId(e.target.value)
                if (e.target.value) setMyEventsOnly(false)
              }}
            >
              <option value="">All Staff Schedules</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.display_name} {p.job_title ? `(${p.job_title})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[170px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Tag size={15} />
            </div>
            <select
              className="select text-sm py-2 pl-9 pr-8 w-full text-gray-700 bg-white"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {EVENT_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* My Events Toggle */}
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={myEventsOnly}
              onChange={e => {
                setMyEventsOnly(e.target.checked)
                if (e.target.checked) setSelectedStaffId('')
              }}
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            My Events Only
          </label>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="btn-ghost btn-sm text-gray-500 hover:text-gray-900 gap-1.5"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>

        {/* Status / Count Indicator */}
        <div className="flex items-center gap-2.5 self-end md:self-auto text-xs font-medium text-gray-500">
          {loading ? (
            <div className="flex items-center gap-1.5 text-primary-600">
              <Spinner size="sm" /> Updating...
            </div>
          ) : (
            <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
              Showing <strong className="text-gray-900">{filteredEvents.length}</strong> {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
          )}
        </div>
      </div>

      {/* Main FullCalendar Card */}
      <div className="card p-4 sm:p-6 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, breezyThemePlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          todayText="Today"
          monthText="Month"
          weekTextLong="Week"
          dayText="Day"
          listText="Agenda"
          events={fcEvents}
          selectable={isSupervisor}
          selectMirror
          dayMaxEvents={4}
          weekends
          height="auto"
          eventClick={handleEventClick}
          select={isSupervisor ? handleDateSelect : undefined}
          eventDisplay="block"
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        />
      </div>

      {/* Interactive Category Legend */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary-600" />
              Activity Categories (Click to filter)
            </p>
            <p className="text-xs text-gray-400 mt-1">Calendar event colors identify the staff member.</p>
          </div>
          {category && (
            <button
              onClick={() => setCategory('')}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              Clear category filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map(cat => {
            const isSelected = category === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(prev => prev === cat.value ? '' : cat.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50 text-primary-800 font-semibold shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
        {eventStaff.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-gray-100">
            {eventStaff.map(staff => (
              <span key={staff.id} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: userToColor(staff.id) }}
                />
                {staff.full_name || staff.display_name || 'Staff member'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Event Detail side drawer */}
      {selectedEvent && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[1px] transition-opacity"
            onClick={handleCloseDetail}
          />
          <EventDetail
            event={selectedEvent}
            onClose={handleCloseDetail}
            onEdit={handleEdit}
            onCancel={cancelEvent}
            onDelete={deleteEvent}
          />
        </>
      )}

      {/* Event Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingEvent(null) }}
        title={editingEvent ? 'Edit Event' : 'Create New Event'}
        size="lg"
      >
        <EventForm
          event={editingEvent ? { ...editingEvent, start_at: newEventDate || editingEvent.start_at } : (newEventDate ? { start_at: newEventDate } : null)}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingEvent(null) }}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}
