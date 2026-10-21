import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useRequests() {
  const { user, isSupervisor } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchRequests = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('schedule_requests')
        .select(`
          *,
          requester:profiles!schedule_requests_requester_id_fkey(
            id, full_name, display_name, avatar_url, job_title,
            departments(name)
          ),
          request_reviews(
            id, action, comment, created_at,
            reviewer:profiles!request_reviews_reviewer_id_fkey(
              id, full_name, display_name
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Employees only see their own; supervisors/admins see all
      if (!isSupervisor) {
        query = query.eq('requester_id', user.id)
      }

      const { data, error: err } = await query
      if (err) throw err
      setRequests(data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, isSupervisor])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  async function submitRequest(data) {
    const { data: created, error: err } = await supabase
      .from('schedule_requests')
      .insert({ ...data, requester_id: user.id })
      .select()
      .single()
    if (err) throw err
    await fetchRequests()
    return created
  }

  async function reviewRequest(requestId, action, comment = '') {
    // Update request status
    const { error: updateErr } = await supabase
      .from('schedule_requests')
      .update({ status: action })
      .eq('id', requestId)
    if (updateErr) throw updateErr

    // Record review
    const { error: reviewErr } = await supabase
      .from('request_reviews')
      .insert({ request_id: requestId, reviewer_id: user.id, action, comment })
    if (reviewErr) throw reviewErr

    await fetchRequests()
  }

  async function cancelRequest(id) {
    const { error: err } = await supabase
      .from('schedule_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('requester_id', user.id) // Only own requests
    if (err) throw err
    await fetchRequests()
  }

  return { requests, loading, error, submitRequest, reviewRequest, cancelRequest, refetch: fetchRequests }
}

