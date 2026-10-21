import { getInitials, stringToColor } from '../../lib/utils'

export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  }

  const name = user?.full_name || user?.display_name || user?.email || ''
  const initials = getInitials(name)
  const bg = user?.avatar_url ? '' : stringToColor(name)

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white shrink-0 ${className}`}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {initials}
    </div>
  )
}

