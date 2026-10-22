-- Calendar events and their participants are visible to every signed-in user.
-- This includes events whose visibility column is set to private; it does not
-- grant access to anonymous visitors.
DROP POLICY IF EXISTS "events_select" ON public.events;

CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "participants_select" ON public.event_participants;

CREATE POLICY "participants_select" ON public.event_participants
  FOR SELECT TO authenticated
  USING (true);
