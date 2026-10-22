-- New calendar events must be created by a supervisor or admin.
-- Approved schedule requests continue to create events via the
-- SECURITY DEFINER sync_approved_schedule_request trigger.
DROP POLICY IF EXISTS "events_insert" ON public.events;

CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_supervisor_or_admin());
