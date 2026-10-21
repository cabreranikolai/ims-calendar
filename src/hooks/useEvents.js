import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useEvents({ filters = {} } = {}) {
  const { user } = useAuth()
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const channelRef = useRef(null)

  const fetchEvents = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, full_name, display_name, avatar_url),
          department:departments(id, name, color),
          event_participants(id, user_id, status,
            profile:profiles(id, full_name, display_name, avatar_url))
        `)
        .neq('status', 'cancelled')
        .order('start_at', { ascending: true })

      if (filters.departmentId) query = query.eq('department_id', filters.departmentId)
      if (filters.category)     query = query.eq('category', filters.category)
      if (filters.organizerId)  query = query.eq('organizer_id', filters.organizerId)
      if (filters.start)        query = query.gte('start_at', filters.start)
      if (filters.end)          query = query.lte('start_at', filters.end)
      if (filters.status)       query = query.eq('status', filters.status)

      const { data, error: err } = await query
      if (err) throw err
      setEvents(data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, JSON.stringify(filters)])

  useEffect(() => {
    fetchEvents()

    channelRef.current = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants' }, fetchEvents)
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [fetchEvents])

  async function createEvent(data) {
    const { participants, ...eventData } = data
    const { data: created, error: err } = await supabase
      .from('events')
      .insert({ ...eventData, organizer_id: user.id })
      .select()
      .single()
    if (err) throw err

    // Add participants
    if (participants?.length) {
      const rows = participants.map(uid => ({
        event_id: created.id,
        user_id: uid,
        status: uid === user.id ? 'accepted' : 'invited',
      }))
      await supabase.from('event_participants').insert(rows)
    }

    await fetchEvents()
    return created
  }

  async function updateEvent(id, data) {
    const { participants, ...eventData } = data
    const { data: updated, error: err } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err

    // Sync participants if provided
    if (participants !== undefined) {
      await supabase.from('event_participants').delete().eq('event_id', id)
      if (participants.length) {
        const rows = participants.map(uid => ({
          event_id: id,
          user_id: uid,
          status: uid === user.id ? 'accepted' : 'invited',
        }))
        await supabase.from('event_participants').insert(rows)
      }
    }

    await fetchEvents()
    return updated
  }

  async function cancelEvent(id) {
    const { error: err } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (err) throw err
    await fetchEvents()
  }

  async function deleteEvent(id) {
    const { error: err } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    if (err) throw err
    await fetchEvents()
  }

  return { events, loading, error, refetch: fetchEvents, createEvent, updateEvent, cancelEvent, deleteEvent }
}

