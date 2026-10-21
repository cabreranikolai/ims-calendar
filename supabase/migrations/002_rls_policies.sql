-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Helper: is supervisor or admin
CREATE OR REPLACE FUNCTION public.is_supervisor_or_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'));
$$;

-- Helper: same department as current user
CREATE OR REPLACE FUNCTION public.same_department(target_dept UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND department_id = target_dept
  );
$$;

-- ============================================================
-- PROFILES policies
-- ============================================================
-- Anyone authenticated can read non-private profile info
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can update their own profile (except role/is_active)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Admins can insert profiles
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR id = auth.uid());

-- ============================================================
-- DEPARTMENTS policies
-- ============================================================
CREATE POLICY "departments_select_all" ON public.departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "departments_modify_admin" ON public.departments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- EVENTS policies
-- ============================================================
-- Public events visible to all
-- Department events visible to same department + supervisors/admins
-- Private events visible only to organizer and participants
CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated
  USING (
    status != 'cancelled' OR organizer_id = auth.uid() OR public.is_supervisor_or_admin()
    -- Visibility:
    -- public: all
    -- department: same dept or supervisor/admin
    -- private: organizer or participant or admin
  );

-- Separate fine-grained select by visibility
DROP POLICY IF EXISTS "events_select" ON public.events;

CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated
  USING (
    -- Admins and supervisors see everything
    public.is_supervisor_or_admin()
    -- Public events
    OR visibility = 'public'
    -- Own events
    OR organizer_id = auth.uid()
    -- Participant
    OR EXISTS (
      SELECT 1 FROM public.event_participants
      WHERE event_id = id AND user_id = auth.uid()
    )
    -- Department events for same-department members
    OR (
      visibility = 'department' AND
      public.same_department(department_id)
    )
  );

-- Insert: any authenticated user can create events
CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (organizer_id = auth.uid() OR public.is_admin());

-- Update: organizer or admin
CREATE POLICY "events_update" ON public.events
  FOR UPDATE TO authenticated
  USING (organizer_id = auth.uid() OR public.is_admin())
  WITH CHECK (organizer_id = auth.uid() OR public.is_admin());

-- Delete: organizer or admin
CREATE POLICY "events_delete" ON public.events
  FOR DELETE TO authenticated
  USING (organizer_id = auth.uid() OR public.is_admin());

-- ============================================================
-- EVENT_PARTICIPANTS policies
-- ============================================================
CREATE POLICY "participants_select" ON public.event_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_supervisor_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id AND organizer_id = auth.uid()
    )
  );

CREATE POLICY "participants_insert" ON public.event_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id AND (organizer_id = auth.uid() OR public.is_admin())
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "participants_update" ON public.event_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "participants_delete" ON public.event_participants
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id AND organizer_id = auth.uid()
    )
  );

-- ============================================================
-- AVAILABILITY_OVERRIDES policies
-- ============================================================
CREATE POLICY "overrides_select" ON public.availability_overrides
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_supervisor_or_admin());

CREATE POLICY "overrides_insert" ON public.availability_overrides
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "overrides_update" ON public.availability_overrides
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "overrides_delete" ON public.availability_overrides
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- SCHEDULE_REQUESTS policies
-- ============================================================
CREATE POLICY "requests_select" ON public.schedule_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR public.is_supervisor_or_admin()
  );

CREATE POLICY "requests_insert" ON public.schedule_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "requests_update" ON public.schedule_requests
  FOR UPDATE TO authenticated
  USING (
    (requester_id = auth.uid() AND status = 'pending')
    OR public.is_supervisor_or_admin()
  );

-- ============================================================
-- REQUEST_REVIEWS policies
-- ============================================================
CREATE POLICY "reviews_select" ON public.request_reviews
  FOR SELECT TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.schedule_requests
      WHERE id = request_id AND requester_id = auth.uid()
    )
    OR public.is_supervisor_or_admin()
  );

CREATE POLICY "reviews_insert" ON public.request_reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() AND public.is_supervisor_or_admin());

-- ============================================================
-- NOTIFICATIONS policies
-- ============================================================
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Allow service role to insert notifications (for triggers)
CREATE POLICY "notifications_insert_service" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- SYSTEM_SETTINGS policies
-- ============================================================
CREATE POLICY "settings_select_all" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "settings_modify_admin" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

