# LifeCare AI 🌿

> **"Your Routine. Your Goals. Your Wellbeing."**  
> An AI-powered personal health, daily routine, reminder, and food calorie tracking platform built with React, Vite, TypeScript, Tailwind CSS, Express, Supabase PostgreSQL, and Google Gemini Vision (`@google/genai`).

---

## 📖 Product Overview

**LifeCare AI** is designed around a single human-centered principle:  
**The user controls the routine. LifeCare AI reminds, tracks, encourages, and assists.**

Unlike rigid health apps that force universal schedules or judge users for missing goals, LifeCare AI empowers users to establish their own waking, hydrating, dining, exercise, and resting rhythm. Every completed activity triggers the user's **exact customized words of encouragement**, fostering consistency without shame.

---

## 🌟 Key Features

1. **Self-Directed Daily Schedule Builder**
   - Create custom recurring activities with local timing (`HH:MM`).
   - Granular recurrence rules: Daily, Weekdays, Weekends, and Selected Days.
   - Configure duration, priority, and reminder status.
   - Set custom notification text and **custom completion encouragement affirmations**.
   - Pause, duplicate, edit, or delete activities at any time.

2. **Personalized Encouragement Engine**
   - When completing any scheduled task, the user's specific affirmation is displayed immediately (floating toast or celebration modal).
   - Nonjudgmental status states: **Completed**, **Skipped**, **Postponed**.
   - Automatic reminder suppression upon activity completion.

3. **Timezone-Aware Notifications & Idempotency**
   - Background reminder scheduler checking active tasks across user timezones.
   - Web Notifications API and Service Worker (`/sw.js`) background Web Push infrastructure.
   - `notification_delivery_logs` table prevents duplicate reminders.

4. **Hydration Intake Tracker**
   - Set personalized daily goals (e.g. 2,000 mL) and cup serving sizes (e.g. 250 mL).
   - One-tap quick logging (`+250 mL`, `+500 mL`, `+150 mL`) or custom milliliter inputs.
   - Animated SVG circular progress ring and timestamped daily history.

5. **Meal Logging & AI Food Scanner**
   - Dedicated meal management for breakfast, lunch, dinner, snacks, and custom meals.
   - **Google Gemini Vision** integration (`@google/genai`) analyzing food photos.
   - Returns structured nutritional estimates: dish name, ingredients, portion size, calories, protein, carbs, and fat.
   - **Safety First:** Estimates are clearly flagged with visual disclaimers. Users review and adjust portion sizes and calories before confirming to their journal.
   - Resilient development fallback mode when API keys are not yet configured.

6. **Daily History & Progress Analytics**
   - Visual trend charts using **Recharts**:
     - Routine completion rate (%) over 7, 14, or 30 days.
     - Water intake (mL) progression vs daily targets.
     - Calorie and macronutrient estimates.
   - Historical tabular log breakdown by date.

7. **Security & Data Isolation**
   - **Supabase PostgreSQL** with comprehensive **Row Level Security (RLS)** across all 9 tables.
   - Users can only read, insert, update, and delete their own private records.
   - JWT authentication via Supabase Auth with persistent session management.

8. **Design System & Accessibility**
   - Warm, welcoming palette: emerald/sage greens, soft sands, rounded cards (`rounded-2xl` / `rounded-3xl`), and subtle shadows.
   - Light and Dark modes with automatic system preference detection.
   - Mobile-first responsive layout with bottom thumb navigation on phones and desktop sidebar.

---

## 🏗️ Architecture & Project Structure

```
health care/
├── .env.example                     # Unified environment template
├── package.json                     # Monorepo root orchestration scripts
├── README.md                        # Documentation & setup instructions
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # DDL tables, indexes, RLS policies, triggers, seed
├── scripts/
│   └── migrate.js                   # Root migration helper
├── server/                          # Backend REST API & Notification Engine
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.ts                 # Express server & route mounting
│   │   ├── config/
│   │   │   ├── env.ts               # Environment validation
│   │   │   └── supabase.ts          # Supabase Admin client
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Bearer token verification & dev user fallback
│   │   │   ├── validation.ts        # Zod request payload validation
│   │   │   └── errorHandler.ts      # Safe error responses
│   │   ├── routes/
│   │   │   ├── profile.ts           # Profile & rhythm preferences
│   │   │   ├── tasks.ts             # Routine task CRUD & template seeding
│   │   │   ├── completions.ts       # Task completion & encouragement message dispatch
│   │   │   ├── water.ts             # Hydration goal & intake logs
│   │   │   ├── meals.ts             # Meal journal
│   │   │   ├── foodAnalysis.ts      # Multer upload & Gemini Vision food inference
│   │   │   ├── notifications.ts     # Push subscriptions & test pings
│   │   │   └── history.ts           # Trend analytics aggregator
│   │   ├── services/
│   │   │   ├── geminiVision.ts      # Official @google/genai Vision integration
│   │   │   ├── scheduler.ts         # Cron reminder engine with idempotency
│   │   │   └── pushService.ts       # Web Push VAPID encryption & dispatch
│   │   ├── scripts/
│   │   │   └── migrate.ts           # PostgreSQL DDL migration runner
│   │   └── test/
│   │       └── api.test.ts          # Vitest backend integration test suite
└── client/                          # Frontend React SPA
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── public/
    │   ├── favicon.svg
    │   └── sw.js                    # Push notification & offline Service Worker
    └── src/
        ├── App.tsx                  # Client routing & protected routes
        ├── main.tsx                 # React DOM mount
        ├── index.css                # Tailwind base styles, glassmorphism, animations
        ├── lib/
        │   ├── supabase.ts          # Supabase client
        │   ├── api.ts               # Typed fetch client
        │   └── notificationManager.ts # Web Push & Notification permission manager
        ├── context/
        │   ├── AuthContext.tsx      # Auth state, theme management, demo login
        │   └── NotificationContext.tsx # Toast & affirmation modal state
        ├── components/
        │   ├── ui/                  # Button, Card, Modal, Badge, ProgressRing, Skeleton, EmptyState
        │   ├── feedback/            # ToastContainer, EncouragementModal
        │   └── layout/              # Navbar, Sidebar, MobileNav, Footer, AppLayout
        ├── pages/
        │   ├── Landing.tsx          # Public landing showcase & demo launcher
        │   ├── Login.tsx            # Sign in
        │   ├── Signup.tsx           # Registration
        │   ├── ForgotPassword.tsx   # Password reset
        │   ├── Privacy.tsx          # Privacy policy
        │   ├── Terms.tsx            # Terms of service
        │   ├── Onboarding.tsx       # Initial preferences wizard
        │   ├── Dashboard.tsx        # Daily overview, progress rings, task timeline
        │   ├── Schedule.tsx         # Schedule builder & recurrence manager
        │   ├── Tasks.tsx            # Habit management & completion affirmations
        │   ├── Water.tsx            # Hydration tracker with quick presets
        │   ├── Meals.tsx            # Meal nutrition journal
        │   ├── FoodScanner.tsx      # AI photo scanner & editable review
        │   ├── History.tsx          # Historical analytics with Recharts
        │   └── Settings.tsx         # Preferences, tones, notifications & account controls
        └── test/
            └── App.test.tsx         # Vitest & Testing Library UI suite
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24.21.0)
- **npm** v9+

### 2. Installation
From the root workspace directory, install dependencies:
```bash
# Install root orchestration tools
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

---

## 🗄️ Database Setup & Migrations (Supabase Cloud PostgreSQL)

The database schema is defined in [`/supabase/migrations/001_initial_schema.sql`](file:///c:/Users/kurab/Downloads/health%20care/supabase/migrations/001_initial_schema.sql).

It creates 9 tables, indexes, triggers, storage bucket rules, and strict Row Level Security (RLS) policies:
1. `profiles`
2. `tasks`
3. `task_completions` (with uniqueness constraint `(user_id, task_id, occurrence_date)`)
4. `water_goals`
5. `water_entries`
6. `meal_entries`
7. `food_photos`
8. `notification_subscriptions`
9. `notification_delivery_logs` (with uniqueness constraint preventing duplicate reminders)

### Option A: Run Migration Script directly with Node.js
If you have your Supabase direct connection string or session pooler URL:
1. Open `server/.env` and configure:
   ```env
   SUPABASE_DB_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
2. Run the migration command:
   ```bash
   npm run migrate
   ```
   The script connects securely via SSL, executes the DDL transaction, enables all RLS policies, and prints table verification.

### Option B: Supabase Cloud SQL Editor
Alternatively, you can copy the contents of [`/supabase/migrations/001_initial_schema.sql`](file:///c:/Users/kurab/Downloads/health%20care/supabase/migrations/001_initial_schema.sql) and paste them directly into your [Supabase Cloud SQL Editor](https://supabase.com/dashboard), then click **Run**.

---

## ⚙️ Environment Variables

Duplicate the template files to configure your live credentials:

### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5173

# Supabase Credentials
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SUPABASE-SERVICE-ROLE-KEY]
SUPABASE_DB_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Google GenAI (Gemini Vision)
GEMINI_API_KEY=[YOUR-GEMINI-API-KEY]
GEMINI_MODEL=gemini-2.5-flash

# Web Push VAPID Keys (for background reminders)
VAPID_PUBLIC_KEY=BC0z7Z3QWP9TvP1A5q4DfmnYn4B0huywOET9UMBbHQJkOxEGKwhM4C51u_QHyW5EBbhZgtv_X8Iz9Iv7PE0AB14
VAPID_PRIVATE_KEY=gmw3hVH4ZzItH8l7Ju8EIT1NRNeKAulHkPm8k1_9tz0
VAPID_SUBJECT=mailto:admin@lifecare.ai

# Reminder Scheduler Check Interval (Cron syntax: every minute)
SCHEDULER_CRON=* * * * *
```

### Frontend (`client/.env`):
```env
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
VITE_API_URL=/api
VITE_VAPID_PUBLIC_KEY=BC0z7Z3QWP9TvP1A5q4DfmnYn4B0huywOET9UMBbHQJkOxEGKwhM4C51u_QHyW5EBbhZgtv_X8Iz9Iv7PE0AB14
```

> **Note on Development / Offline Sandbox:**  
> If live Supabase credentials or Gemini API keys are omitted, the application runs in **Resilient Sandbox Mode**. The UI remains fully interactive with 1-click demo access, and the Food Scanner displays realistic nutritional estimates labeled clearly as simulation mode.

---

## 🏃 Running the Application

### Development Mode (Both Frontend & Backend)
From the root folder:
```bash
npm run dev
```
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

Or start them individually:
```bash
# Start backend
npm run dev:server

# Start frontend
npm run dev:client
```

---

## 🧪 Automated Testing

Both client and server include Vitest automated test suites:

```bash
# Run all tests (backend + frontend)
npm test

# Run backend API tests only
cd server && npm test

# Run frontend React component tests only
cd client && npm test
```

### Verified Test Results:
- **Backend**: 8/8 tests passed (Health check, Auth guard, Profile update, Routine task CRUD & recurrence, Task completion encouragement, Water logging & progress calculation, Meal confirmation, Historical analytics).
- **Frontend**: 4/4 tests passed (Landing page brand tagline, Button component variants, ProgressRing percentage calculation, EmptyState interactions).

---

## 🚀 Production Build & Deployment

To compile production bundles:
```bash
npm run build
```
- **Backend**: Compiles TypeScript into `server/dist/`.
- **Frontend**: Compiles optimized Vite bundle into `client/dist/`.

### Deployment Options:
1. **Frontend**: Deploy `client/dist` to Vercel, Netlify, or Cloudflare Pages.
2. **Backend**: Deploy `server` to Render, Railway, Fly.io, AWS App Runner, or Heroku.
3. **Database**: Supabase Cloud PostgreSQL.

---

## 🛡️ Security & Privacy Highlights

- **Row Level Security (RLS)** is enabled on all tables: users can never read, modify, or delete another user's data.
- **Service Role Secrets** remain exclusively on the server and are never bundled into frontend assets.
- **AI Estimation Safety**: Food photo estimates are marked as approximations with clear disclaimers, and users always have the opportunity to modify portion sizes and calories prior to confirmation.
