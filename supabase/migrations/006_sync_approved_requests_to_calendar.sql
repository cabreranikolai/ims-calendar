ALTER TABLE public.events
  ADD COLUMN schedule_request_id UUID UNIQUE
  REFERENCES public.schedule_requests(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.sync_approved_schedule_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO public.events (
      title,
      description,
      category,
      start_at,
      end_at,
      organizer_id,
      department_id,
      location,
      visibility,
      status,
      requires_approval,
      approval_status,
      schedule_request_id
    )
    SELECT
      NEW.title,
      NEW.description,
      CASE NEW.category
        WHEN 'official_travel' THEN 'official_business'
        ELSE NEW.category
      END,
      NEW.start_at,
      NEW.end_at,
      NEW.requester_id,
      profile.department_id,
      NEW.destination,
      'department',
      'confirmed',
      true,
      'approved',
      NEW.id
    FROM public.profiles AS profile
    WHERE profile.id = NEW.requester_id
    ON CONFLICT (schedule_request_id) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        start_at = EXCLUDED.start_at,
        end_at = EXCLUDED.end_at,
        organizer_id = EXCLUDED.organizer_id,
        department_id = EXCLUDED.department_id,
        location = EXCLUDED.location,
        visibility = EXCLUDED.visibility,
        status = 'confirmed',
        requires_approval = true,
        approval_status = 'approved';
  ELSE
    UPDATE public.events
    SET status = 'cancelled',
        approval_status = NEW.status
    WHERE schedule_request_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_approved_schedule_request() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_schedule_request_sync_calendar
  AFTER INSERT OR UPDATE ON public.schedule_requests
  FOR EACH ROW EXECUTE FUNCTION public.sync_approved_schedule_request();

INSERT INTO public.events (
  title,
  description,
  category,
  start_at,
  end_at,
  organizer_id,
  department_id,
  location,
  visibility,
  status,
  requires_approval,
  approval_status,
  schedule_request_id
)
SELECT
  request.title,
  request.description,
  CASE request.category
    WHEN 'official_travel' THEN 'official_business'
    ELSE request.category
  END,
  request.start_at,
  request.end_at,
  request.requester_id,
  profile.department_id,
  request.destination,
  'department',
  'confirmed',
  true,
  'approved',
  request.id
FROM public.schedule_requests AS request
JOIN public.profiles AS profile ON profile.id = request.requester_id
WHERE request.status = 'approved'
ON CONFLICT (schedule_request_id) DO NOTHING;
