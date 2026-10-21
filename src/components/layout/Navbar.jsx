import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import Avatar from '../common/Avatar'
import NotificationPanel from '../notifications/NotificationPanel'
import { formatDate } from '../../lib/utils'

export default function Navbar({ onMenuToggle }) {
  const { profile, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const [showNotifs, setShowNotifs] = useState(false)
  const [showUser, setShowUser]     = useState(false)

  const notifRef = useRef(null)
  const userRef  = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20 sticky top-0">
      {/* Left: menu toggle + date */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm text-gray-500 hidden sm:block">
          {formatDate(new Date(), 'EEEE, MMMM d, yyyy')}
        </span>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUser(false) }}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUser(!showUser); setShowNotifs(false) }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Avatar user={profile} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-none">
                {profile?.display_name || profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{profile?.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-400">{profile?.email}</p>
              </div>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => { navigate('/my-schedule'); setShowUser(false) }}
              >
                <User size={15} /> My Profile
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

