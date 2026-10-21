-- ============================================================
-- 001_initial_schema.sql
-- Office Availability Calendar - Core Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROFILES  (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  display_name  TEXT,
  avatar_url    TEXT,
  job_title     TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role          TEXT NOT NULL DEFAULT 'employee'
                CHECK (role IN ('admin', 'supervisor', 'employee')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  phone         TEXT,
  working_hours_start TIME DEFAULT '08:00',
  working_hours_end   TIME DEFAULT '17:00',
  timezone      TEXT DEFAULT 'Asia/Manila',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'meeting'
                  CHECK (category IN (
                    'meeting', 'fieldwork', 'official_business',
                    'training', 'office_activity', 'leave',
                    'holiday', 'other'
                  )),
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  all_day         BOOLEAN NOT NULL DEFAULT false,
  organizer_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id   UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  location        TEXT,
  meeting_link    TEXT,
  visibility      TEXT NOT NULL DEFAULT 'department'
                  CHECK (visibility IN ('public', 'department', 'private')),
  status          TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_status TEXT NOT NULL DEFAULT 'approved'
                  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled')),
  notes           TEXT,
  color           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT events_end_after_start CHECK (end_at > start_at)
);

-- ============================================================
-- EVENT PARTICIPANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_participants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'invited'
              CHECK (status IN ('invited', 'accepted', 'declined', 'tentative')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- ============================================================
-- AVAILABILITY OVERRIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.availability_overrides (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL
              CHECK (status IN (
                'available', 'in_meeting', 'on_fieldwork',
                'on_official_business', 'on_leave', 'unavailable'
              )),
  note        TEXT,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCHEDULE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedule_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category        TEXT NOT NULL
                  CHECK (category IN (
                    'official_travel', 'fieldwork', 'leave',
                    'training', 'other'
                  )),
  title           TEXT NOT NULL,
  description     TEXT,
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  destination     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  supporting_docs TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REQUEST REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.request_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id  UUID NOT NULL REFERENCES public.schedule_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL
              CHECK (action IN ('approved', 'rejected', 'comment')),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
              CHECK (type IN (
                'event_invite', 'event_update', 'event_cancel',
                'event_reminder', 'request_decision', 'schedule_change',
                'general'
              )),
  title       TEXT NOT NULL,
  message     TEXT,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_events_start_at       ON public.events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_end_at         ON public.events(end_at);
CREATE INDEX IF NOT EXISTS idx_events_organizer      ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_department     ON public.events(department_id);
CREATE INDEX IF NOT EXISTS idx_events_category       ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status         ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_participants_event    ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_user     ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_overrides_user        ON public.availability_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_overrides_start       ON public.availability_overrides(start_at);
CREATE INDEX IF NOT EXISTS idx_requests_requester    ON public.schedule_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_status       ON public.schedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_department   ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON public.profiles(role);

