import { useState, useMemo } from 'react'
import { Users, Filter } from 'lucide-react'
import { useAvailability } from '../hooks/useAvailability'
import { useAuth } from '../contexts/AuthContext'
import AvailabilityCard from '../components/availability/AvailabilityCard'
import SearchInput from '../components/common/SearchInput'
import Spinner from '../components/common/Spinner'
import { AVAILABILITY_STATUSES } from '../lib/constants'

export default function Availability() {
  const { user } = useAuth()
  const { employees, loading, error, setOverride } = useAvailability()

  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Status counts for top summary
  const statusCounts = useMemo(() => {
    const counts = { all: employees.length }
    AVAILABILITY_STATUSES.forEach(s => {
      counts[s.value] = 0
    })
    employees.forEach(emp => {
      const st = emp.availability?.status || 'available'
      if (counts[st] !== undefined) {
        counts[st]++
      }
    })
    return counts
  }, [employees])

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const name = (emp.full_name || emp.display_name || '').toLowerCase()
      const title = (emp.job_title || '').toLowerCase()
      const searchMatch = !search || name.includes(search.toLowerCase()) || title.includes(search.toLowerCase())

      const roleMatch = selectedRole === 'all' || emp.role === selectedRole

      const statusMatch = selectedStatus === 'all' || (emp.availability?.status || 'available') === selectedStatus

      return searchMatch && roleMatch && statusMatch
    })
  }, [employees, search, selectedRole, selectedStatus])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="text-primary-600" size={28} />
            Staff Availability
          </h1>
          <p className="page-subtitle">Real-time staff availability derived from schedules and events</p>
        </div>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`card p-3 text-left transition-all ${
            selectedStatus === 'all' ? 'ring-2 ring-primary-500 bg-primary-50/50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-xs font-medium text-gray-500">All Staff</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.all || 0}</p>
        </button>

        {AVAILABILITY_STATUSES.map(st => {
          const isSelected = selectedStatus === st.value
          return (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`card p-3 text-left transition-all ${
                isSelected ? 'ring-2 ring-primary-500 bg-primary-50/50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                <p className="text-xs font-medium text-gray-500 truncate">{st.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts[st.value] || 0}</p>
            </button>
          )
        })}
      </div>

      {/* Filters bar */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or title..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              className="select text-sm py-1.5 pl-3 pr-8"
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="supervisor">Supervisors</option>
              <option value="employee">Staff / Employees</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          Error loading staff availability: {error}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="empty-state card">
          <Users className="empty-state-icon" />
          <p className="empty-state-title">No employees found</p>
          <p className="empty-state-desc">Try adjusting your search criteria or department filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map(emp => (
            <AvailabilityCard
              key={emp.id}
              employee={emp}
              isOwnCard={emp.id === user?.id}
              onSetStatus={setOverride}
            />
          ))}
        </div>
      )}
    </div>
  )
}

