-- ============================================================
-- 004_seed_data.sql
-- Sample data for development/testing
-- NOTE: Run this AFTER creating users through Supabase Auth UI
-- or use the scripts in README.md to create test accounts.
-- ============================================================

-- Sample departments
INSERT INTO public.departments (id, name, description, color)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Administration',    'Administrative and executive staff',      '#6366f1'),
  ('11111111-1111-1111-1111-111111111102', 'Information Technology', 'IT department',                     '#0ea5e9'),
  ('11111111-1111-1111-1111-111111111103', 'Human Resources',   'HR and people operations',                '#10b981'),
  ('11111111-1111-1111-1111-111111111104', 'Finance',           'Finance and accounting',                  '#f59e0b'),
  ('11111111-1111-1111-1111-111111111105', 'Operations',        'Field operations and logistics',          '#ef4444')
ON CONFLICT (id) DO NOTHING;

-- NOTE: Profile records are auto-created on user signup via trigger.
-- After creating users, update their departments and roles manually
-- or via the Admin panel.

