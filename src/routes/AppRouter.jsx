import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/layout/Layout'

import Login        from '../pages/Login'
import Dashboard    from '../pages/Dashboard'
import Calendar     from '../pages/Calendar'
import Availability from '../pages/Availability'
import MySchedule   from '../pages/MySchedule'
import Requests     from '../pages/Requests'
import Reports      from '../pages/Reports'
import Directory    from '../pages/Directory'
import Settings     from '../pages/Settings'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/calendar"     element={<Calendar />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/my-schedule"  element={<MySchedule />} />
          <Route path="/requests"     element={<Requests />} />
          <Route path="/reports"      element={<Reports />} />
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/directory" element={<Directory />} />
          </Route>
          <Route path="/settings"     element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
