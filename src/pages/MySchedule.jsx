import { useState, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { CalendarDays, Plus, Clock, Building, Mail, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useEvents } from '../hooks/useEvents'
import { toFCEvent } from '../lib/utils'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import EventForm from '../components/calendar/EventForm'
import EventDetail from '../components/calendar/EventDetail'
import Spinner from '../components/common/Spinner'

export default function MySchedule() {
  const { profile, user } = useAuth()
  const { events, loading, createEvent, updateEvent, cancelEvent, deleteEvent } = useEvents()

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const calendarRef = useRef(null)

  // Filter events to only those where user is organizer or participant
  const myEvents = useMemo(() => {
    if (!user) return []
    return events.filter(e => {
      const isOrganizer = e.organizer_id === user.id
      const isParticipant = e.event_participants?.some(p => p.user_id === user.id)
      return isOrganizer || isParticipant
    })
  }, [events, user])

  const fcEvents = useMemo(() => myEvents.map(toFCEvent), [myEvents])

  function handleEventClick(clickInfo) {
    const rawEvent = clickInfo.event.extendedProps
    setSelectedEvent(rawEvent)
  }

  function handleDateClick(arg) {
    setEditingEvent({
      start_at: arg.dateStr.includes('T') ? arg.dateStr : `${arg.dateStr}T09:00:00`,
      end_at: arg.dateStr.includes('T') ? arg.dateStr : `${arg.dateStr}T10:00:00`,
      all_day: arg.allDay,
    })
    setIsFormOpen(true)
  }

  async function handleFormSubmit(formData) {
    setFormLoading(true)
    try {
      if (editingEvent?.id) {
        await updateEvent(editingEvent.id, formData)
      } else {
        await createEvent(formData)
      }
      setIsFormOpen(false)
      setEditingEvent(null)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CalendarDays className="text-primary-600" size={28} />
            My Schedule
          </h1>
          <p className="page-subtitle">Your personal agenda, organized meetings, and assigned tasks</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingEvent(null)
            setIsFormOpen(true)
          }}
        >
          <Plus size={16} /> New Personal Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 cols: Personal Calendar */}
        <div className="lg:col-span-3 card p-4">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Spinner size="lg" />
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="listWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'listWeek,timeGridDay,timeGridWeek,dayGridMonth',
              }}
              events={fcEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              editable={false}
              selectable={true}
              height="auto"
              nowIndicator={true}
            />
          )}
        </div>

        {/* Right 1 col: Profile & Quick Info */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar user={profile} size="lg" />
              <div>
                <h3 className="font-semibold text-gray-900 leading-snug">
                  {profile?.full_name || profile?.display_name || 'My Profile'}
                </h3>
                <p className="text-xs text-gray-400">{profile?.job_title || 'Employee'}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building size={14} className="text-gray-400" />
                <span>{profile?.departments?.name || 'No Department'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-gray-400" />
                <span className="capitalize">{profile?.role || 'employee'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span>Working: {profile?.working_hours_start || '08:00'} - {profile?.working_hours_end || '17:00'}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <Badge variant="primary" className="w-full justify-center py-1">
                Active Schedule
              </Badge>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Schedule Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-600">Total Activities</span>
                <span className="font-semibold text-gray-900">{myEvents.length}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-600">Organized by Me</span>
                <span className="font-semibold text-gray-900">
                  {myEvents.filter(e => e.organizer_id === user?.id).length}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600">Invited As Participant</span>
                <span className="font-semibold text-gray-900">
                  {myEvents.filter(e => e.organizer_id !== user?.id).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side panel detail */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(evt) => {
            setEditingEvent(evt)
            setSelectedEvent(null)
            setIsFormOpen(true)
          }}
          onCancel={cancelEvent}
          onDelete={deleteEvent}
        />
      )}

      {/* Event Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingEvent(null)
        }}
        title={editingEvent?.id ? 'Edit Event' : 'Create Personal Event'}
        size="lg"
      >
        <EventForm
          event={editingEvent}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingEvent(null)
          }}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}
