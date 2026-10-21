import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns'

// Format a date for display
export function formatDate(date, fmt = 'MMM d, yyyy') {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

// Format datetime for display
export function formatDateTime(date, fmt = 'MMM d, yyyy h:mm a') {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

// Format time only
export function formatTime(date, fmt = 'h:mm a') {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

// Relative time (e.g., "2 hours ago")
export function fromNow(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

// Friendly date label
export function friendlyDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d))     return 'Today'
  if (isTomorrow(d))  return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMM d')
}

// Format date range for display
export function formatDateRange(start, end, allDay = false) {
  if (!start || !end) return '—'
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end

  if (allDay) {
    if (format(s, 'yyyy-MM-dd') === format(e, 'yyyy-MM-dd')) {
      return format(s, 'MMM d, yyyy')
    }
    return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`
  }

  if (format(s, 'yyyy-MM-dd') === format(e, 'yyyy-MM-dd')) {
    return `${format(s, 'MMM d, yyyy')} · ${format(s, 'h:mm a')} – ${format(e, 'h:mm a')}`
  }
  return `${format(s, 'MMM d, h:mm a')} – ${format(e, 'MMM d, yyyy h:mm a')}`
}

// Get start of today
export function todayStart() {
  return startOfDay(new Date())
}

// Get end of today
export function todayEnd() {
  return endOfDay(new Date())
}

// Check if an event is currently active
export function isEventActive(startAt, endAt) {
  const now = new Date()
  const s = typeof startAt === 'string' ? parseISO(startAt) : startAt
  const e = typeof endAt === 'string' ? parseISO(endAt) : endAt
  return isBefore(s, now) && isAfter(e, now)
}

// Check if event is upcoming (starts in the future)
export function isEventUpcoming(startAt) {
  const now = new Date()
  const s = typeof startAt === 'string' ? parseISO(startAt) : startAt
  return isAfter(s, now)
}

// Get initials from name
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Truncate text
export function truncate(text, maxLength = 60) {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

// Generate a random color from a string (deterministic)
export function stringToColor(str) {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#f59e0b', '#10b981', '#14b8a6',
    '#0ea5e9', '#3b82f6',
  ]
  let hash = 0
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Convert event for FullCalendar
export function toFCEvent(event) {
  return {
    id: event.id,
    title: event.title,
    start: event.start_at,
    end: event.end_at,
    allDay: event.all_day,
    backgroundColor: event.color || '#6366f1',
    borderColor: 'transparent',
    extendedProps: { ...event },
  }
}

// Download data as CSV
export function downloadCSV(data, filename) {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? ''
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str}"`
        : str
    }).join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Debounce
export function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// Pluralize
export function pluralize(count, singular, plural) {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`
}

