// User roles
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  EMPLOYEE: 'employee',
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  employee: 'Employee',
}

// Event categories
export const EVENT_CATEGORIES = [
  { value: 'meeting',          label: 'Meeting',                  color: '#6366f1', bg: 'bg-indigo-100 text-indigo-700' },
  { value: 'fieldwork',        label: 'Fieldwork',                color: '#10b981', bg: 'bg-emerald-100 text-emerald-700' },
  { value: 'official_business', label: 'Official Business / Travel', color: '#f59e0b', bg: 'bg-amber-100 text-amber-700' },
  { value: 'training',         label: 'Training / Seminar',       color: '#8b5cf6', bg: 'bg-violet-100 text-violet-700' },
  { value: 'office_activity',  label: 'Office Activity',          color: '#0ea5e9', bg: 'bg-sky-100 text-sky-700' },
  { value: 'leave',            label: 'Leave / Day Off',          color: '#f97316', bg: 'bg-orange-100 text-orange-700' },
  { value: 'holiday',          label: 'Holiday',                  color: '#ef4444', bg: 'bg-red-100 text-red-700' },
  { value: 'other',            label: 'Other',                    color: '#6b7280', bg: 'bg-gray-100 text-gray-700' },
]

export const EVENT_CATEGORY_MAP = Object.fromEntries(EVENT_CATEGORIES.map(c => [c.value, c]))

// Event status
export const EVENT_STATUS = {
  CONFIRMED: 'confirmed',
  TENTATIVE: 'tentative',
  CANCELLED: 'cancelled',
}

export const EVENT_STATUS_LABELS = {
  confirmed: 'Confirmed',
  tentative: 'Tentative',
  cancelled: 'Cancelled',
}

// Approval status
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
}

export const APPROVAL_STATUS_LABELS = {
  pending:   'Pending',
  approved:  'Approved',
  rejected:  'Rejected',
  cancelled: 'Cancelled',
}

export const APPROVAL_STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

// Visibility
export const VISIBILITY = {
  PUBLIC: 'public',
  DEPARTMENT: 'department',
  PRIVATE: 'private',
}

export const VISIBILITY_LABELS = {
  public:     'Public (Everyone)',
  department: 'Department Only',
  private:    'Private (Only Me)',
}

// Availability statuses
export const AVAILABILITY_STATUSES = [
  { value: 'available',            label: 'Available',              color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  { value: 'in_meeting',           label: 'In a Meeting',           color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  { value: 'on_fieldwork',         label: 'On Fieldwork',           color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'on_official_business', label: 'On Official Business',   color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  { value: 'on_leave',             label: 'On Approved Leave',      color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'unavailable',          label: 'Unavailable',            color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
]

export const AVAILABILITY_STATUS_MAP = Object.fromEntries(AVAILABILITY_STATUSES.map(s => [s.value, s]))

// Schedule request categories
export const REQUEST_CATEGORIES = [
  { value: 'official_travel', label: 'Official Travel' },
  { value: 'fieldwork',       label: 'Fieldwork' },
  { value: 'leave',           label: 'Leave' },
  { value: 'training',        label: 'Training / Seminar' },
  { value: 'other',           label: 'Other' },
]

// Participant status
export const PARTICIPANT_STATUS = {
  INVITED:   'invited',
  ACCEPTED:  'accepted',
  DECLINED:  'declined',
  TENTATIVE: 'tentative',
}

// Notification types
export const NOTIFICATION_TYPES = {
  EVENT_INVITE:      'event_invite',
  EVENT_UPDATE:      'event_update',
  EVENT_CANCEL:      'event_cancel',
  EVENT_REMINDER:    'event_reminder',
  REQUEST_DECISION:  'request_decision',
  SCHEDULE_CHANGE:   'schedule_change',
  GENERAL:           'general',
}

// Category → availability status mapping
export const CATEGORY_TO_AVAILABILITY = {
  meeting:          'in_meeting',
  fieldwork:        'on_fieldwork',
  official_business: 'on_official_business',
  training:         'in_meeting',
  office_activity:  'in_meeting',
  leave:            'on_leave',
  holiday:          'on_leave',
  other:            'unavailable',
}

