import { useState, useMemo } from 'react'
import {
  ClipboardList, Plus, CheckCircle, XCircle, Clock,
  MapPin, MessageSquare, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRequests } from '../hooks/useRequests'
import {
  REQUEST_CATEGORIES, APPROVAL_STATUS_COLORS, APPROVAL_STATUS_LABELS
} from '../lib/constants'
import { formatDateRange, formatDateTime } from '../lib/utils'
import Modal from '../components/common/Modal'
import Badge from '../components/common/Badge'
import Spinner from '../components/common/Spinner'
import RequestForm from '../components/requests/RequestForm'
import Avatar from '../components/common/Avatar'

export default function Requests() {
  const { user, isSupervisor } = useAuth()
  const { requests, loading, error, submitRequest, reviewRequest, cancelRequest } = useRequests()

  const [activeTab, setActiveTab] = useState('my_requests') // 'my_requests' | 'review'
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  // Review modal state
  const [reviewModalState, setReviewModalState] = useState({
    isOpen: false,
    requestId: null,
    action: null, // 'approved' | 'rejected'
    comment: '',
    loading: false,
  })

  // Filter requests according to tab
  const myRequests = useMemo(() => {
    if (!user) return []
    return requests.filter(r => r.requester_id === user.id)
  }, [requests, user])

  const pendingReviewRequests = useMemo(() => {
    if (!isSupervisor) return []
    return requests.filter(r => r.status === 'pending')
  }, [requests, isSupervisor])

  async function handleSubmitRequest(formData) {
    setFormLoading(true)
    try {
      await submitRequest(formData)
      setIsSubmitOpen(false)
    } finally {
      setFormLoading(false)
    }
  }

  function handleOpenReview(requestId, action) {
    setReviewModalState({
      isOpen: true,
      requestId,
      action,
      comment: '',
      loading: false,
    })
  }

  async function handleConfirmReview(e) {
    e.preventDefault()
    setReviewModalState(s => ({ ...s, loading: true }))
    try {
      await reviewRequest(
        reviewModalState.requestId,
        reviewModalState.action,
        reviewModalState.comment
      )
      setReviewModalState({ isOpen: false, requestId: null, action: null, comment: '', loading: false })
    } catch (err) {
      alert(`Error reviewing request: ${err.message}`)
      setReviewModalState(s => ({ ...s, loading: false }))
    }
  }

  const categoryMap = useMemo(() => {
    return Object.fromEntries(REQUEST_CATEGORIES.map(c => [c.value, c.label]))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList className="text-primary-600" size={28} />
            Schedule Requests
          </h1>
          <p className="page-subtitle">Submit, monitor, and review leave, travel, and schedule changes</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsSubmitOpen(true)}
        >
          <Plus size={16} /> Submit Request
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('my_requests')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'my_requests'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Requests
            <span className="badge bg-gray-100 text-gray-600 text-xs">
              {myRequests.length}
            </span>
          </button>

          {isSupervisor && (
            <button
              onClick={() => setActiveTab('review')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'review'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Review
              {pendingReviewRequests.length > 0 && (
                <span className="badge bg-amber-100 text-amber-800 text-xs font-semibold">
                  {pendingReviewRequests.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          Error loading requests: {error}
        </div>
      ) : (
        <div>
          {activeTab === 'my_requests' && (
            <div className="space-y-3">
              {myRequests.length === 0 ? (
                <div className="empty-state card">
                  <ClipboardList className="empty-state-icon" />
                  <p className="empty-state-title">No schedule requests</p>
                  <p className="empty-state-desc">You have not submitted any official travel, fieldwork, or leave requests yet.</p>
                </div>
              ) : (
                myRequests.map(req => {
                  const isExpanded = expandedId === req.id
                  return (
                    <div key={req.id} className="card p-4 transition-shadow hover:shadow-md">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="badge bg-primary-100 text-primary-700 font-semibold">
                              {categoryMap[req.category] || req.category}
                            </span>
                            <span className={`badge ${APPROVAL_STATUS_COLORS[req.status]}`}>
                              {APPROVAL_STATUS_LABELS[req.status]}
                            </span>
                            <span className="text-xs text-gray-400">
                              Submitted {formatDateTime(req.created_at, 'MMM d, yyyy')}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-base">{req.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={14} className="text-gray-400" />
                              {formatDateRange(req.start_at, req.end_at)}
                            </span>
                            {req.destination && (
                              <span className="flex items-center gap-1">
                                <MapPin size={14} className="text-gray-400" />
                                {req.destination}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'pending' && (
                            <button
                              className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                              onClick={() => cancelRequest(req.id)}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            className="btn-ghost btn-sm"
                            onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details & History */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          {req.description && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase">Reason / Description</p>
                              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{req.description}</p>
                            </div>
                          )}

                          {req.request_reviews?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Review History</p>
                              <div className="space-y-2">
                                {req.request_reviews.map(rev => (
                                  <div key={rev.id} className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-semibold text-gray-800">
                                        {rev.reviewer?.full_name || rev.reviewer?.display_name || 'Reviewer'}
                                      </span>
                                      <span className="text-gray-400">{formatDateTime(rev.created_at)}</span>
                                    </div>
                                    <p className="text-gray-600">
                                      Action: <strong className="capitalize">{rev.action}</strong>
                                    </p>
                                    {rev.comment && (
                                      <p className="text-gray-600 mt-1 italic">"{rev.comment}"</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'review' && isSupervisor && (
            <div className="space-y-3">
              {pendingReviewRequests.length === 0 ? (
                <div className="empty-state card">
                  <CheckCircle className="empty-state-icon text-green-500" />
                  <p className="empty-state-title">No pending reviews</p>
                  <p className="empty-state-desc">All schedule requests have been reviewed.</p>
                </div>
              ) : (
                pendingReviewRequests.map(req => (
                  <div key={req.id} className="card p-4 transition-shadow hover:shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Avatar user={req.requester} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 leading-none">
                              {req.requester?.full_name || req.requester?.display_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {req.requester?.departments?.name || 'Department'} · {req.requester?.job_title || 'Employee'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge bg-primary-100 text-primary-700 font-semibold">
                              {categoryMap[req.category] || req.category}
                            </span>
                            <h3 className="font-semibold text-gray-900 text-base inline">{req.title}</h3>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock size={14} className="text-gray-400" />
                              {formatDateRange(req.start_at, req.end_at)}
                            </span>
                            {req.destination && (
                              <span className="flex items-center gap-1">
                                <MapPin size={14} className="text-gray-400" />
                                {req.destination}
                              </span>
                            )}
                          </p>
                          {req.description && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                              {req.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 md:self-center">
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleOpenReview(req.id, 'rejected')}
                        >
                          <XCircle size={15} /> Reject
                        </button>
                        <button
                          className="btn-primary btn-sm bg-green-600 hover:bg-green-700"
                          onClick={() => handleOpenReview(req.id, 'approved')}
                        >
                          <CheckCircle size={15} /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit Request Modal */}
      <Modal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="Submit Schedule Request"
        size="md"
      >
        <RequestForm
          onSubmit={handleSubmitRequest}
          onCancel={() => setIsSubmitOpen(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Review Modal with Comment */}
      <Modal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState(s => ({ ...s, isOpen: false }))}
        title={reviewModalState.action === 'approved' ? 'Approve Schedule Request' : 'Reject Schedule Request'}
        size="sm"
      >
        <form onSubmit={handleConfirmReview} className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to <strong>{reviewModalState.action}</strong> this request?
          </p>

          <div>
            <label className="label">Reviewer Comment (optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={reviewModalState.comment}
              onChange={e => setReviewModalState(s => ({ ...s, comment: e.target.value }))}
              placeholder="Provide reason or notes for the applicant..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setReviewModalState(s => ({ ...s, isOpen: false }))}
              disabled={reviewModalState.loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={reviewModalState.action === 'approved' ? 'btn-primary bg-green-600 hover:bg-green-700' : 'btn-danger'}
              disabled={reviewModalState.loading}
            >
              {reviewModalState.loading ? 'Saving...' : `Confirm ${reviewModalState.action === 'approved' ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
