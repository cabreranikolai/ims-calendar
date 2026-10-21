import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useDepartments() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDepartments = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('name')
    setDepartments(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchDepartments() }, [fetchDepartments])

  return { departments, loading, refetch: fetchDepartments }
}

export function useProfiles(filters = {}) {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetchProfiles = useCallback(async () => {
    if (!user) return
    let query = supabase
      .from('profiles')
      .select('*, departments(id, name, color)')
      .eq('is_active', true)
      .order('full_name')

    if (filters.departmentId) query = query.eq('department_id', filters.departmentId)

    const { data } = await query
    setProfiles(data ?? [])
    setLoading(false)
  }, [user, JSON.stringify(filters)])

  useEffect(() => { fetchProfiles() }, [fetchProfiles])

  return { profiles, loading, refetch: fetchProfiles }
}

