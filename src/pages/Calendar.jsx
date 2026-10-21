import { useCallback, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useEvents } from '../hooks/useEvents'
import { useDepartments } from '../hooks/useData'
import { toFCEvent } from '../lib/utils'
import { EVENT_CATEGORIES } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import EventDetail from '../components/calendar/EventDetail'
import EventForm from '../components/calendar/EventForm'
import Modal from '../components/common/Modal'
import Spinner from '../components/common/Spinner'

export default function Calendar() {
  const { user } = useAuth()
  const { departments } = useDepartments()

  // Filters
  const [departmentId, setDepartmentId] = useState('')
  const [category, setCategory]         = useState('')
  const [myEventsOnly, setMyEventsOnly] = useState(false)

  const filters = useMemo(() => ({
    ...(departmentId ? { departmentId } : {}),
    ...(category ? { category } : {}),
    ...(myEventsOnly ? { organizerId: user?.id } : {}),
  }), [departmentId, category, myEventsOnly, user?.id])

  const { events, loading, createEvent, updateEvent, cancelEvent, deleteEvent } = useEvents({ filters })

  // UI state
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showForm, setShowForm]           = useState(false)
  const [editingEvent, setEditingEvent]   = useState(null)
  const [newEventDate, setNewEventDate]   = useState('')
  const [formLoading, setFormLoading]     = useState(false)

  const calendarRef = useRef(null)

  const fcEvents = useMemo(() => events.map(toFCEvent), [events])

  function handleEventClick(info) {
    setSelectedEvent(info.event.extendedProps)
  }

  function handleDateSelect(info) {
    const dateStr = format(info.start, "yyyy-MM-dd'T'HH:mm")
    setNewEventDate(dateStr)
    setEditingEvent(null)
    setShowForm(true)
  }

  function handleNewEvent() {
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500">All scheduled office events and activities</p>
        </div>
        <button className="btn-primary" onClick={handleNewEvent}>
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Filter bar */}
      <div className="card py-3 flex flex-wrap items-center gap-3">
        <select
          className="select text-sm w-auto"
          value={departmentId}
          onChange={e => setDepartmentId(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          className="select text-sm w-auto"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {EVENT_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={myEventsOnly}
            onChange={e => setMyEventsOnly(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-gray-300"
          />
          My Events Only
        </label>

        {loading && <Spinner size="sm" className="ml-auto" />}
      </div>

      {/* Calendar */}
      <div className="card p-0 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          events={fcEvents}
          selectable
          selectMirror
          dayMaxEvents={4}
          weekends
          height="auto"
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDisplay="block"
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        />
      </div>

      {/* Category legend */}
      <div className="card py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Legend</p>
        <div className="flex flex-wrap gap-3">
          {EVENT_CATEGORIES.map(cat => (
            <div key={cat.value} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.label}
            </div>
          ))}
        </div>
      </div>

      {/* Event Detail side panel */}
      {selectedEvent && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
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
        title={editingEvent ? 'Edit Event' : 'New Event'}
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
