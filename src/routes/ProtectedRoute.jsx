import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from '../components/common/LoadingScreen'

export default function ProtectedRoute({ requiredRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />

  // Role check
  if (requiredRole) {
    const hierarchy = { admin: 3, supervisor: 2, employee: 1 }
    const userLevel = hierarchy[profile?.role] ?? 0
    const required  = hierarchy[requiredRole] ?? 0
    if (userLevel < required) return <Navigate to="/" replace />
  }

  return <Outlet />
}

