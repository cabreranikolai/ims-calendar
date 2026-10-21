# IMS Calendar — Office Availability and Shared Calendar System

A modern, multi-user web application for managing office schedules, staff availability, meetings, and coordination. Built with React, Vite, Tailwind CSS, and Supabase.

---

## Features

- 📅 **Shared Office Calendar** — Monthly, weekly, daily, and list views
- 👥 **Staff Availability** — Real-time derived status from approved events
- 📝 **Event Management** — Create, edit, cancel events with department/category filters
- 🔔 **Notifications** — In-app notifications for invitations, updates, approvals
- 📋 **Schedule Requests** — Submit and approve requests for leave, fieldwork, travel
- 📊 **Reports** — Activity summaries, CSV export
- 🔐 **Role-based access** — Admin, Supervisor, Employee with Supabase RLS

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | Frontend framework |
| Vite | 6 | Build tool |
| Tailwind CSS | 3 | Styling |
| Supabase | latest | Database, Auth, Realtime |
| FullCalendar | 6 | Calendar views |
| Recharts | latest | Charts |
| Lucide React | latest | Icons |
| date-fns | latest | Date utilities |

---

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd IMS_Calendar
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Find your keys in **Project Settings → API**

### 3. Set Up Database

Run the SQL migrations in order in the **Supabase SQL Editor**:

1. `supabase/migrations/001_initial_schema.sql` — Tables and indexes
2. `supabase/migrations/002_rls_policies.sql` — Row Level Security
3. `supabase/migrations/003_triggers_functions.sql` — Triggers and functions
4. `supabase/migrations/004_seed_data.sql` — Sample departments

### 4. Create Your First Admin User

1. Go to **Supabase Dashboard → Authentication → Users → Add User**
2. Create a user with email/password
3. In **SQL Editor**, promote them to admin:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', full_name = 'Your Name'
   WHERE email = 'your@email.com';
   ```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## Database Schema

```
profiles              — User accounts and roles
departments           — Department records
events                — Calendar events
event_participants    — Event attendee relationships
availability_overrides — Manual status overrides
schedule_requests     — Approval workflow requests
request_reviews       — Approval decisions and history
notifications         — In-app notification records
system_settings       — Admin-configurable settings
```

---

## User Roles

| Role | Capabilities |
|---|---|
| **Admin** | Full access: manage users, departments, all events, settings |
| **Supervisor** | View team schedules, review and approve requests |
| **Employee** | Create own events, view shared calendar, submit requests |

---

## Project Structure

```
src/
  components/
    common/          Button, Modal, ConfirmDialog, Avatar, Badge, etc.
    layout/          Sidebar, Navbar, Layout
    calendar/        EventForm, EventDetail
    availability/    AvailabilityCard
    notifications/   NotificationPanel
    requests/        RequestForm
    reports/         (chart and export components)
    admin/           (admin management components)
  contexts/
    AuthContext.jsx
    NotificationContext.jsx
  hooks/
    useEvents.js
    useAvailability.js
    useRequests.js
    useData.js
  lib/
    supabase.js
    constants.js
    utils.js
  pages/
    Login.jsx
    Dashboard.jsx
    Calendar.jsx
    Availability.jsx
    MySchedule.jsx
    Requests.jsx
    Reports.jsx
    Directory.jsx
    Settings.jsx
  routes/
    AppRouter.jsx
    ProtectedRoute.jsx
supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_triggers_functions.sql
    004_seed_data.sql
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |

> Never use the service_role key in frontend code. Always use the anon key with RLS policies.

---

## Build for Production

```bash
npm run build
```

The output is in the `dist/` folder. Deploy to Vercel, Netlify, or any static host.

### Vercel Deployment

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard under **Project Settings → Environment Variables**.

---

## Security Notes

- All database access is controlled by **Row Level Security (RLS)** policies in Supabase
- Employees cannot change their own role or activate/deactivate accounts
- Private events are not visible to other employees
- Leave reasons and sensitive details respect visibility settings
- The Supabase service_role key is never exposed to the frontend

---

## Roadmap

- [ ] Email notifications
- [ ] ICS calendar export
- [ ] Google Calendar integration
- [ ] Recurring events
- [ ] Resource/room booking
- [ ] Mobile app (React Native)
