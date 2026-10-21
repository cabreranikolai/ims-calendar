import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  X, Calendar, Clock, MapPin, Link, Users, Tag,
  Edit2, Trash2, XCircle, User,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { EVENT_CATEGORY_MAP, APPROVAL_STATUS_COLORS, APPROVAL_STATUS_LABELS } from '../../lib/constants'
import { formatDateRange, formatDateTime } from '../../lib/utils'
import Avatar from '../common/Avatar'
import Badge from '../common/Badge'
import ConfirmDialog from '../common/ConfirmDialog'

export default function EventDetail({ event, onClose, onEdit, onCancel, onDelete }) {
  const { profile, isAdmin } = useAuth()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  if (!event) return null

  const category    = EVENT_CATEGORY_MAP[event.category]
  const isOrganizer = event.organizer_id === profile?.id
  const canEdit     = isOrganizer || isAdmin
  const canDelete   = isAdmin
  const isCancelled = event.status === 'cancelled'

  async function handleCancel() {
    setActionLoading(true)
    try { await onCancel(event.id) } finally {
      setActionLoading(false)
      setConfirmCancel(false)
      onClose()
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    try { await onDelete(event.id) } finally {
      setActionLoading(false)
      setConfirmDelete(false)
      onClose()
    }
  }

  return (
    <>
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl border-l border-gray-200 z-40 flex flex-col">
        {/* Header bar */}
        <div
          className="px-5 py-4 flex items-start justify-between shrink-0"
          style={{ borderBottom: `3px solid ${category?.color ?? '#6366f1'}` }}
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="badge text-white text-xs"
                style={{ backgroundColor: category?.color ?? '#6366f1' }}
              >
                {category?.label ?? event.category}
              </span>
              {isCancelled && <span className="badge bg-gray-100 text-gray-500">Cancelled</span>}
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-snug break-words">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Date/time */}
          <div className="flex items-start gap-3">
            <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700">
              {formatDateRange(event.start_at, event.end_at, event.all_day)}
            </p>
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div className="flex items-center gap-3">
              <User size={16} className="text-gray-400 shrink-0" />
              <div className="flex items-center gap-2">
                <Avatar user={event.organizer} size="xs" />
                <span className="text-sm text-gray-700">
                  {event.organizer.full_name || event.organizer.display_name}
                  <span className="text-gray-400"> (organizer)</span>
                </span>
              </div>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700">{event.location}</p>
            </div>
          )}

          {/* Meeting link */}
          {event.meeting_link && (
            <div className="flex items-center gap-3">
              <Link size={16} className="text-gray-400 shrink-0" />
              <a
                href={event.meeting_link}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary-600 hover:underline truncate"
              >
                Join Meeting
              </a>
            </div>
          )}

          {/* Department */}
          {event.department && (
            <div className="flex items-center gap-3">
              <Tag size={16} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{event.department.name}</span>
            </div>
          )}

          {/* Approval status */}
          {event.requires_approval && (
            <div className="flex items-center gap-3">
              <div className="w-4" />
              <span className={`badge ${APPROVAL_STATUS_COLORS[event.approval_status]}`}>
                {APPROVAL_STATUS_LABELS[event.approval_status]}
              </span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Participants */}
          {event.event_participants?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Participants ({event.event_participants.length})
              </p>
              <div className="space-y-2">
                {event.event_participants.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar user={p.profile} size="xs" />
                    <span className="text-sm text-gray-700">
                      {p.profile?.full_name || p.profile?.display_name}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto capitalize">{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Notes</p>
              <p className="text-sm text-gray-500 italic">{event.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && !isCancelled && (
          <div className="px-5 py-4 border-t border-gray-200 flex gap-2 shrink-0">
            <button className="btn-primary flex-1 justify-center" onClick={() => onEdit(event)}>
              <Edit2 size={15} /> Edit
            </button>
            {isOrganizer && (
              <button className="btn-secondary" onClick={() => setConfirmCancel(true)}>
                <XCircle size={15} /> Cancel
              </button>
            )}
            {canDelete && (
              <button
                className="btn-danger btn-sm px-3"
                onClick={() => setConfirmDelete(true)}
                title="Delete event"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

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

