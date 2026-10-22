import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CalendarDays, Clock, ExternalLink, MapPin, Pencil, ShieldCheck,
  Trash2, Users, X, XCircle,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { EVENT_CATEGORY_MAP, APPROVAL_STATUS_COLORS, APPROVAL_STATUS_LABELS } from '../../lib/constants'
import { formatDateRange, getEventColorUserId, userToColor } from '../../lib/utils'
import Avatar from '../common/Avatar'
import ConfirmDialog from '../common/ConfirmDialog'

export default function EventDetail({ event, onClose, onEdit, onCancel, onDelete }) {
  const { profile, isAdmin } = useAuth()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  if (!event) return null

  const category = EVENT_CATEGORY_MAP[event.category]
  const colorUserId = getEventColorUserId(event)
  const accentColor = colorUserId ? userToColor(colorUserId) : category?.color ?? '#4f46e5'
  const isOrganizer = event.organizer_id === profile?.id
  const isRequestEvent = Boolean(event.schedule_request_id)
  const canEdit = !isRequestEvent && (isOrganizer || isAdmin)
  const canDelete = !isRequestEvent && isAdmin
  const isCancelled = event.status === 'cancelled'

  async function handleCancel() {
    setActionLoading(true)
    try {
      await onCancel(event.id)
    } finally {
      setActionLoading(false)
      setConfirmCancel(false)
      onClose()
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    try {
      await onDelete(event.id)
    } finally {
      setActionLoading(false)
      setConfirmDelete(false)
      onClose()
    }
  }

  return (
    <>
      {createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-detail-title"
            className="relative flex max-h-[min(88vh,760px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 shrink-0" style={{ backgroundColor: accentColor }} />

          <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className="badge"
                  style={{ backgroundColor: `${category?.color ?? accentColor}18`, color: category?.color ?? accentColor }}
                >
                  {category?.label ?? event.category}
                </span>
                {isCancelled && <span className="badge bg-gray-100 text-gray-600">Cancelled</span>}
              </div>
              <h2 id="event-detail-title" className="break-words text-xl font-bold tracking-tight text-gray-900">
                {event.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close event details"
              className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 sm:col-span-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  {event.all_day ? <CalendarDays size={17} /> : <Clock size={17} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Date & time</p>
                  <p className="mt-0.5 text-sm font-medium leading-5 text-gray-800">
                    {formatDateRange(event.start_at, event.end_at, event.all_day)}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <MapPin size={17} className="mt-0.5 shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Location</p>
                    <p className="mt-0.5 break-words text-sm font-medium text-gray-800">{event.location}</p>
                  </div>
                </div>
              )}

              {event.meeting_link && (
                <a
                  href={event.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-primary-700 transition-colors hover:border-primary-200 hover:bg-primary-50"
                >
                  <ExternalLink size={17} className="shrink-0" />
                  <span className="truncate text-sm font-semibold">Join meeting</span>
                </a>
              )}

              {event.requires_approval && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 sm:col-span-2">
                  <ShieldCheck size={17} className="shrink-0 text-gray-400" />
                  <span className="text-sm text-gray-600">Approval</span>
                  <span className={`badge ml-auto ${APPROVAL_STATUS_COLORS[event.approval_status]}`}>
                    {APPROVAL_STATUS_LABELS[event.approval_status] ?? event.approval_status}
                  </span>
                </div>
              )}
            </div>

            {event.organizer && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Organizer</h3>
                <div className="flex items-center gap-3">
                  <Avatar user={event.organizer} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {event.organizer.full_name || event.organizer.display_name || 'Staff member'}
                    </p>
                    <p className="text-xs text-gray-400">Event organizer</p>
                  </div>
                </div>
              </section>
            )}

            {event.event_participants?.length > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <Users size={14} /> Participants
                  </h3>
                  <span className="text-xs font-medium text-gray-400">{event.event_participants.length}</span>
                </div>
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                  {event.event_participants.map((participant, index) => (
                    <div key={participant.id ?? participant.user_id ?? index} className="flex items-center gap-3 px-3.5 py-2.5">
                      <Avatar user={participant.profile} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">
                        {participant.profile?.full_name || participant.profile?.display_name || 'Staff member'}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-500">
                        {participant.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {event.description && (
              <section>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Description</h3>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">{event.description}</p>
              </section>
            )}

            {event.notes && (
              <section className="rounded-xl border border-amber-100 bg-amber-50/70 p-3.5">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Notes</h3>
                <p className="whitespace-pre-wrap text-sm leading-5 text-amber-900">{event.notes}</p>
              </section>
            )}
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-3.5 sm:px-6">
            {isRequestEvent ? (
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <ShieldCheck size={14} />
                Managed by an approved schedule request
              </p>
            ) : (
              <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            )}
            {canEdit && !isCancelled && (
              <div className="flex items-center gap-2">
                {isOrganizer && (
                  <button type="button" className="btn-secondary" onClick={() => setConfirmCancel(true)}>
                    <XCircle size={15} /> Cancel event
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete event"
                    title="Delete event"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button type="button" className="btn-primary" onClick={() => onEdit(event)}>
                  <Pencil size={15} /> Edit
                </button>
              </div>
            )}
          </footer>
          </section>
        </div>,
        document.body
      )}

      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        loading={actionLoading}
        title="Cancel Event"
        message={`Are you sure you want to cancel "${event.title}"? Participants will be notified.`}
        confirmLabel="Cancel Event"
      />
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Event"
        message={`Permanently delete "${event.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  )
}
