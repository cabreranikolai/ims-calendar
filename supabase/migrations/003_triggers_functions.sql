-- ============================================================
-- 003_triggers_functions.sql
-- Triggers and Database Functions
-- ============================================================

-- ============================================================
-- Auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_departments_updated
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_events_updated
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_overrides_updated
  BEFORE UPDATE ON public.availability_overrides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_requests_updated
  BEFORE UPDATE ON public.schedule_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Notify participants when event is updated
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_event_participants()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  participant RECORD;
  notif_type TEXT;
  notif_title TEXT;
  notif_msg TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      notif_type := 'event_cancel';
      notif_title := 'Event Cancelled';
      notif_msg := 'The event "' || NEW.title || '" has been cancelled.';
    ELSE
      notif_type := 'event_update';
      notif_title := 'Event Updated';
      notif_msg := 'The event "' || NEW.title || '" has been updated.';
    END IF;

    FOR participant IN
      SELECT user_id FROM public.event_participants
      WHERE event_id = NEW.id AND user_id != NEW.organizer_id
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (participant.user_id, notif_type, notif_title, notif_msg, '/calendar');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_updated_notify
  AFTER UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_participants();

-- ============================================================
-- Notify requester on schedule request status change
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_request_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  notif_title TEXT;
  notif_msg TEXT;
BEGIN
  IF NEW.status != OLD.status THEN
    IF NEW.status = 'approved' THEN
      notif_title := 'Request Approved';
      notif_msg := 'Your request "' || NEW.title || '" has been approved.';
    ELSIF NEW.status = 'rejected' THEN
      notif_title := 'Request Rejected';
      notif_msg := 'Your request "' || NEW.title || '" has been rejected.';
    ELSIF NEW.status = 'cancelled' THEN
      notif_title := 'Request Cancelled';
      notif_msg := 'Your request "' || NEW.title || '" has been cancelled.';
    ELSE
      RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (NEW.requester_id, 'request_decision', notif_title, notif_msg, '/requests');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_request_status_change
  AFTER UPDATE ON public.schedule_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_request_status_change();

-- ============================================================
-- Notify new event participants when added
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_participant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  evt RECORD;
BEGIN
  SELECT title, start_at INTO evt FROM public.events WHERE id = NEW.event_id;
  
  IF NEW.user_id != (SELECT organizer_id FROM public.events WHERE id = NEW.event_id) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'event_invite',
      'New Event Invitation',
      'You have been invited to "' || evt.title || '".',
      '/calendar'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_participant_added
  AFTER INSERT ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_participant();

-- ============================================================
-- Default system settings
-- ============================================================
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('office_name', '"Office Availability Calendar"', 'Display name of the office'),
  ('office_timezone', '"Asia/Manila"', 'Default timezone for the office'),
  ('working_hours_start', '"08:00"', 'Default working hours start time'),
  ('working_hours_end', '"17:00"', 'Default working hours end time'),
  ('working_days', '[1,2,3,4,5]', 'Working days: 0=Sun, 1=Mon ... 6=Sat'),
  ('allow_employee_event_create', 'true', 'Allow employees to create events'),
  ('require_approval_for_leave', 'true', 'Require approval for leave requests'),
  ('require_approval_for_travel', 'true', 'Require approval for travel requests')
ON CONFLICT (key) DO NOTHING;

