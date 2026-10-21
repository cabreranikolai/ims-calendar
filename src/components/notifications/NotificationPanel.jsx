import { Bell, Check, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../contexts/NotificationContext'
import { fromNow } from '../../lib/utils'

const TYPE_ICONS = {
  event_invite:     '📨',
  event_update:     '📝',
  event_cancel:     '❌',
  event_reminder:   '⏰',
  request_decision: '✅',
  schedule_change:  '📅',
  general:          '🔔',
}

export default function NotificationPanel({ onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const navigate = useNavigate()

  function handleClick(notif) {
    if (!notif.is_read) markAsRead(notif.id)
    if (notif.link) {
      navigate(notif.link)
      onClose()
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-gray-600" />
          <span className="font-semibold text-gray-900 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge bg-primary-100 text-primary-700">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
            >
              <Check size={12} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <Bell size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <ul>
            {notifications.map(notif => (
              <li
                key={notif.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                  notif.is_read ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'
                }`}
                onClick={() => handleClick(notif)}
              >
                <div className="text-lg shrink-0 mt-0.5">{TYPE_ICONS[notif.type] ?? '🔔'}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${notif.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{fromNow(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                )}
                <button
                  onClick={e => { e.stopPropagation(); deleteNotification(notif.id) }}
                  className="p-1 text-gray-300 hover:text-gray-500 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

