-- Avoid recursive RLS evaluation between events and event_participants.
CREATE OR REPLACE FUNCTION public.is_event_participant(target_event UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_participants
    WHERE event_id = target_event
      AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_event_participant(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_event_participant(UUID) TO authenticated;

DROP POLICY IF EXISTS "events_select" ON public.events;

CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated
  USING (
    public.is_supervisor_or_admin()
    OR visibility = 'public'
    OR organizer_id = auth.uid()
    OR public.is_event_participant(id)
    OR (
      visibility = 'department'
      AND public.same_department(department_id)
    )
  );
