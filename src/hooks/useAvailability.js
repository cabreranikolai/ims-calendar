import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CATEGORY_TO_AVAILABILITY } from '../lib/constants'
import { isEventActive } from '../lib/utils'

/**
 * Returns derived availability for all employees based on:
 *  1. Current active events
 *  2. Active availability_overrides
 *  3. Fallback: 'available'
 */
export function useAvailability() {
  const { user } = useAuth()
  const [employees, setEmployees]   = useState([])
  const [overrides, setOverrides]   = useState([])
  const [activeEvents, setActiveEvents] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const now = new Date().toISOString()

      const [profilesRes, overridesRes, eventsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*, departments(id, name, color)')
          .eq('is_active', true)
          .order('full_name'),

        supabase
          .from('availability_overrides')
          .select('*')
          .lte('start_at', now)
          .or(`end_at.is.null,end_at.gte.${now}`),

        supabase
          .from('events')
          .select('*, event_participants(user_id)')
          .eq('status', 'confirmed')
          .eq('approval_status', 'approved')
          .lte('start_at', now)
          .gte('end_at', now),
      ])

      if (profilesRes.error) throw profilesRes.error
      setEmployees(profilesRes.data ?? [])
      setOverrides(overridesRes.data ?? [])
      setActiveEvents(eventsRes.data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60_000) // refresh every minute
    return () => clearInterval(interval)
  }, [fetchData])

  // Derive availability for a specific user
  function getAvailabilityFor(userId) {
    // 1. Check override first
    const override = overrides.find(o => o.user_id === userId)
    if (override) {
      return { status: override.status, source: 'override', note: override.note }
    }

    // 2. Check active events
    const activeEvent = activeEvents.find(e =>
      e.organizer_id === userId ||
      e.event_participants?.some(p => p.user_id === userId)
    )
    if (activeEvent) {
      const status = CATEGORY_TO_AVAILABILITY[activeEvent.category] ?? 'unavailable'
      return { status, source: 'event', eventTitle: activeEvent.title }
    }

    // 3. Default
    return { status: 'available', source: 'default' }
  }

  // Employees with their derived availability
  const employeesWithStatus = employees.map(emp => ({
    ...emp,
    availability: getAvailabilityFor(emp.id),
  }))

  async function setOverride(userId, { status, note, start_at, end_at }) {
    // Remove existing overrides for this user that haven't ended
    await supabase
      .from('availability_overrides')
      .delete()
      .eq('user_id', userId)
      .is('end_at', null)

    const { error: err } = await supabase.from('availability_overrides').insert({
      user_id: userId,
      status,
      note,
      start_at: start_at ?? new Date().toISOString(),
      end_at: end_at ?? null,
    })
    if (err) throw err
    await fetchData()
  }

  async function clearOverride(userId) {
    await supabase.from('availability_overrides').delete().eq('user_id', userId)
    await fetchData()
  }

  return {
    employees: employeesWithStatus,
    loading,
    error,
    setOverride,
    clearOverride,
    refetch: fetchData,
  }
}

