import { useState, useMemo } from 'react'
import {
  BookUser, Edit2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfiles } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { ROLES, ROLE_LABELS } from '../lib/constants'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import SearchInput from '../components/common/SearchInput'
import Pagination from '../components/common/Pagination'
import Spinner from '../components/common/Spinner'
import Alert from '../components/common/Alert'
import { FormField } from '../components/common/FormField'

export default function Directory() {
  const { isAdmin } = useAuth()
  const { profiles, loading, refetch: refetchProfiles } = useProfiles()

  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Modals state
  const [editingProfile, setEditingProfile] = useState(null)
  const [viewingProfile, setViewingProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Filtered & Paginated Profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const name = (p.full_name || p.display_name || '').toLowerCase()
      const title = (p.job_title || '').toLowerCase()
      const email = (p.email || '').toLowerCase()
      const searchMatch = !search || name.includes(search.toLowerCase()) || title.includes(search.toLowerCase()) || email.includes(search.toLowerCase())

      const roleMatch = selectedRole === 'all' || p.role === selectedRole

      return searchMatch && roleMatch
    })
  }, [profiles, search, selectedRole])

  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProfiles.slice(start, start + pageSize)
  }, [filteredProfiles, currentPage])

  const totalPages = Math.ceil(filteredProfiles.length / pageSize)

  // Edit Profile Handlers
  function handleOpenEditProfile(profile) {
    setEditingProfile(profile)
    setProfileForm({
      full_name: profile.full_name || '',
      display_name: profile.display_name || '',
      job_title: profile.job_title || '',
      role: profile.role || 'employee',
      is_active: profile.is_active ?? true,
      working_hours_start: profile.working_hours_start || '08:00',
      working_hours_end: profile.working_hours_end || '17:00',
    })
    setProfileError('')
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          display_name: profileForm.display_name,
          job_title: profileForm.job_title,
          role: profileForm.role,
          is_active: profileForm.is_active,
          working_hours_start: profileForm.working_hours_start,
          working_hours_end: profileForm.working_hours_end,
        })
        .eq('id', editingProfile.id)

      if (error) throw error

      await refetchProfiles()
      setEditingProfile(null)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BookUser className="text-primary-600" size={28} />
            Staff Directory
          </h1>
          <p className="page-subtitle">Department staff members, roles, contact information, and working hours</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={(val) => { setSearch(val); setCurrentPage(1); }}
            placeholder="Search by name, email, or job title..."
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="select text-sm py-1.5 pl-3 pr-8"
            value={selectedRole}
            onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="supervisor">Supervisors</option>
            <option value="employee">Staff / Employees</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="empty-state card">
          <BookUser className="empty-state-icon" />
          <p className="empty-state-title">No staff members found</p>
          <p className="empty-state-desc">Try clearing your search query or role filter.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Job Title</th>
                  <th>Role</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProfiles.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar user={p} size="sm" />
                        <div>
                          <p className="font-semibold text-gray-900 leading-none">
                            {p.full_name || p.display_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-700 font-medium">{p.job_title || '—'}</td>
                    <td>
                      <Badge
                        variant={p.role === 'admin' ? 'purple' : p.role === 'supervisor' ? 'blue' : 'default'}
                      >
                        {ROLE_LABELS[p.role] || p.role}
                      </Badge>
                    </td>
                    <td className="text-gray-500 text-xs">
                      {p.working_hours_start?.slice(0, 5)} - {p.working_hours_end?.slice(0, 5)}
                    </td>
                    <td>
                      {p.is_active ? (
                        <span className="badge bg-green-50 text-green-700">Active</span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-400">Inactive</span>
                      )}
                    </td>
                    <td className="text-right space-x-2">
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() => setViewingProfile(p)}
                      >
                        View
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleOpenEditProfile(p)}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {paginatedProfiles.length} of {filteredProfiles.length} staff members
            </p>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      <Modal
        isOpen={!!viewingProfile}
        onClose={() => setViewingProfile(null)}
        title="Staff Profile"
        size="sm"
      >
        {viewingProfile && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar user={viewingProfile} size="lg" />
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  {viewingProfile.full_name || viewingProfile.display_name}
                </h3>
                <p className="text-sm text-gray-500">{viewingProfile.job_title || 'Staff'}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-3 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{viewingProfile.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">System Role</span>
                <Badge variant={viewingProfile.role === 'admin' ? 'purple' : 'default'}>
                  {ROLE_LABELS[viewingProfile.role] || viewingProfile.role}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Working Hours</span>
                <span className="text-gray-900">{viewingProfile.working_hours_start} - {viewingProfile.working_hours_end}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Timezone</span>
                <span className="text-gray-900">{viewingProfile.timezone || 'Asia/Manila'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button className="btn-secondary" onClick={() => setViewingProfile(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Profile Modal (Admin Only) */}
      <Modal
        isOpen={!!editingProfile}
        onClose={() => setEditingProfile(null)}
        title="Edit Staff Member"
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileError && <Alert type="error" message={profileError} />}

          <FormField label="Full Name" required>
            <input
              className="input"
              value={profileForm.full_name}
              onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
            />
          </FormField>

          <FormField label="Display Name">
            <input
              className="input"
              value={profileForm.display_name}
              onChange={e => setProfileForm(f => ({ ...f, display_name: e.target.value }))}
            />
          </FormField>

          <FormField label="Job Title">
            <input
              className="input"
              value={profileForm.job_title}
              onChange={e => setProfileForm(f => ({ ...f, job_title: e.target.value }))}
              placeholder="e.g., Software Engineer, Project Coordinator"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Role" required>
              <select
                className="select"
                value={profileForm.role}
                onChange={e => setProfileForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value={ROLES.EMPLOYEE}>Employee</option>
                <option value={ROLES.SUPERVISOR}>Supervisor</option>
                <option value={ROLES.ADMIN}>Administrator</option>
              </select>
            </FormField>

            <FormField label="Account Status">
              <select
                className="select"
                value={profileForm.is_active ? 'true' : 'false'}
                onChange={e => setProfileForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Working Hours Start">
              <input
                type="time"
                className="input"
                value={profileForm.working_hours_start}
                onChange={e => setProfileForm(f => ({ ...f, working_hours_start: e.target.value }))}
              />
            </FormField>
            <FormField label="Working Hours End">
              <input
                type="time"
                className="input"
                value={profileForm.working_hours_end}
                onChange={e => setProfileForm(f => ({ ...f, working_hours_end: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEditingProfile(null)}
              disabled={profileSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={profileSaving}
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
