import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Users, User, ClipboardList,
  BarChart3, BookUser, Settings, X, CalendarDays,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',          Icon: LayoutDashboard },
  { to: '/calendar',     label: 'Staff Calendar',     Icon: Calendar },
  { to: '/availability', label: 'Staff Availability', Icon: Users },
  { to: '/my-schedule',  label: 'My Schedule',        Icon: CalendarDays },
  { to: '/requests',     label: 'Schedule Requests',  Icon: ClipboardList },
  { to: '/reports',      label: 'Reports & Workload', Icon: BarChart3 },
  { to: '/directory',    label: 'Staff Directory',    Icon: BookUser, adminOnly: true },
  { to: '/settings',     label: 'Settings',           Icon: Settings, adminOnly: true },
]

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth()

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 flex flex-col
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0 lg:flex lg:z-auto
      `}>
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <CalendarDays size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">IMS Calendar</p>
              <p className="text-xs text-gray-400 mt-0.5">Office Scheduler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            IMS Calendar v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
