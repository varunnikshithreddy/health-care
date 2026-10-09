-- ==============================================================================
-- LIFECARE AI - INITIAL SCHEMA MIGRATION (001_initial_schema.sql)
-- Comprehensive Schema, Indexes, Triggers, Row-Level Security (RLS) & Seed Data
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS (safe creation)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
        CREATE TYPE task_status_enum AS ENUM ('completed', 'skipped', 'postponed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level_enum') THEN
        CREATE TYPE priority_level_enum AS ENUM ('low', 'medium', 'high');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status_enum') THEN
        CREATE TYPE delivery_status_enum AS ENUM ('sent', 'suppressed', 'failed');
    END IF;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Wellness Explorer',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    preferred_motivational_style TEXT NOT NULL DEFAULT 'encouraging',
    wake_up_time TEXT NOT NULL DEFAULT '07:00',
    bed_time TEXT NOT NULL DEFAULT '22:00',
    theme_preference TEXT NOT NULL DEFAULT 'system',
    encouragement_display_mode TEXT NOT NULL DEFAULT 'toast',
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TASKS TABLE (Personalized Daily Routine Tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Custom activity',
    local_time TEXT NOT NULL, -- Format 'HH:MM' (24-hour)
    timezone TEXT NOT NULL DEFAULT 'UTC',
    recurrence_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekdays', 'weekends', 'selected_days', 'once'
    recurrence_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sun, 1=Mon, ..., 6=Sat
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    reminder_enabled BOOLEAN NOT NULL DEFAULT true,
    notification_message TEXT,
    completion_message TEXT NOT NULL DEFAULT 'Great job! Every small step counts towards your wellbeing.',
    snooze_duration_minutes INTEGER NOT NULL DEFAULT 10,
    priority priority_level_enum NOT NULL DEFAULT 'medium',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TASK COMPLETIONS TABLE (Logs task states per calendar date)
CREATE TABLE IF NOT EXISTS public.task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    occurrence_date DATE NOT NULL,
    status task_status_enum NOT NULL DEFAULT 'completed',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_task_completion_per_day UNIQUE (user_id, task_id, occurrence_date)
);

-- 6. WATER GOALS TABLE (Per-user hydration goal)
CREATE TABLE IF NOT EXISTS public.water_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    daily_goal_ml INTEGER NOT NULL DEFAULT 2000 CHECK (daily_goal_ml > 0),
    preferred_serving_ml INTEGER NOT NULL DEFAULT 250 CHECK (preferred_serving_ml > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. WATER ENTRIES TABLE (Hydration intake records)
CREATE TABLE IF NOT EXISTS public.water_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quantity_ml INTEGER NOT NULL CHECK (quantity_ml > 0),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    local_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. MEAL ENTRIES TABLE (Meal tracking & food nutrition logs)
CREATE TABLE IF NOT EXISTS public.meal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL DEFAULT 'lunch', -- 'breakfast', 'lunch', 'dinner', 'snack', 'custom'
    food_name TEXT NOT NULL,
    portion_description TEXT,
    portion_grams NUMERIC(8, 2),
    estimated_calories_kcal NUMERIC(8, 2),
    estimated_protein_g NUMERIC(8, 2),
    estimated_carbohydrates_g NUMERIC(8, 2),
    estimated_fat_g NUMERIC(8, 2),
    analysis_metadata JSONB DEFAULT '{}'::jsonb,
    image_url TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    local_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. FOOD PHOTOS TABLE (Uploaded food images for AI analysis)
CREATE TABLE IF NOT EXISTS public.food_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_entry_id UUID REFERENCES public.meal_entries(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. NOTIFICATION SUBSCRIPTIONS TABLE (Web Push tokens per browser/device)
CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_data JSONB NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. NOTIFICATION DELIVERY LOGS TABLE (Idempotency and delivery tracking)
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMPTZ NOT NULL,
    occurrence_date DATE NOT NULL,
    delivery_status delivery_status_enum NOT NULL DEFAULT 'sent',
    attempt_count INTEGER NOT NULL DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_notification_delivery_per_day UNIQUE (user_id, task_id, occurrence_date)
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_enabled ON public.tasks(user_id, enabled);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_date ON public.task_completions(user_id, occurrence_date);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON public.task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_water_entries_user_date ON public.water_entries(user_id, local_date);
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_date ON public.meal_entries(user_id, local_date);
CREATE INDEX IF NOT EXISTS idx_food_photos_user_id ON public.food_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_subs_user_id ON public.notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_user_task ON public.notification_delivery_logs(user_id, task_id, occurrence_date);

-- ==============================================================================
-- AUTOMATIC PROFILE & WATER GOAL CREATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create default profile
    INSERT INTO public.profiles (id, display_name, timezone)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'timezone', 'UTC')
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create default water goal
    INSERT INTO public.water_goals (user_id, daily_goal_ml, preferred_serving_ml)
    VALUES (new.id, 2000, 250)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Tasks RLS
DROP POLICY IF EXISTS "Users can read own tasks" ON public.tasks;
CREATE POLICY "Users can read own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Task Completions RLS
DROP POLICY IF EXISTS "Users can read own completions" ON public.task_completions;
CREATE POLICY "Users can read own completions" ON public.task_completions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own completions" ON public.task_completions;
CREATE POLICY "Users can insert own completions" ON public.task_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own completions" ON public.task_completions;
CREATE POLICY "Users can update own completions" ON public.task_completions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own completions" ON public.task_completions;
CREATE POLICY "Users can delete own completions" ON public.task_completions
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Water Goals RLS
DROP POLICY IF EXISTS "Users can read own water goal" ON public.water_goals;
CREATE POLICY "Users can read own water goal" ON public.water_goals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own water goal" ON public.water_goals;
CREATE POLICY "Users can insert own water goal" ON public.water_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own water goal" ON public.water_goals;
CREATE POLICY "Users can update own water goal" ON public.water_goals
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Water Entries RLS
DROP POLICY IF EXISTS "Users can read own water entries" ON public.water_entries;
CREATE POLICY "Users can read own water entries" ON public.water_entries
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own water entries" ON public.water_entries;
CREATE POLICY "Users can insert own water entries" ON public.water_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own water entries" ON public.water_entries;
CREATE POLICY "Users can update own water entries" ON public.water_entries
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own water entries" ON public.water_entries;
CREATE POLICY "Users can delete own water entries" ON public.water_entries
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Meal Entries RLS
DROP POLICY IF EXISTS "Users can read own meal entries" ON public.meal_entries;
CREATE POLICY "Users can read own meal entries" ON public.meal_entries
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meal entries" ON public.meal_entries;
CREATE POLICY "Users can insert own meal entries" ON public.meal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meal entries" ON public.meal_entries;
CREATE POLICY "Users can update own meal entries" ON public.meal_entries
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meal entries" ON public.meal_entries;
CREATE POLICY "Users can delete own meal entries" ON public.meal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Food Photos RLS
DROP POLICY IF EXISTS "Users can read own food photos" ON public.food_photos;
CREATE POLICY "Users can read own food photos" ON public.food_photos
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own food photos" ON public.food_photos;
CREATE POLICY "Users can insert own food photos" ON public.food_photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own food photos" ON public.food_photos;
CREATE POLICY "Users can delete own food photos" ON public.food_photos
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Notification Subscriptions RLS
DROP POLICY IF EXISTS "Users can read own notification subscriptions" ON public.notification_subscriptions;
CREATE POLICY "Users can read own notification subscriptions" ON public.notification_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification subscriptions" ON public.notification_subscriptions;
CREATE POLICY "Users can insert own notification subscriptions" ON public.notification_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notification subscriptions" ON public.notification_subscriptions;
CREATE POLICY "Users can delete own notification subscriptions" ON public.notification_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Notification Delivery Logs RLS
DROP POLICY IF EXISTS "Users can read own delivery logs" ON public.notification_delivery_logs;
CREATE POLICY "Users can read own delivery logs" ON public.notification_delivery_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own delivery logs" ON public.notification_delivery_logs;
CREATE POLICY "Users can insert own delivery logs" ON public.notification_delivery_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION (for food-photos)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-photos', 'food-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DROP POLICY IF EXISTS "Users can view their own food photos" ON storage.objects;
CREATE POLICY "Users can view their own food photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own food photos" ON storage.objects;
CREATE POLICY "Users can upload their own food photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own food photos" ON storage.objects;
CREATE POLICY "Users can delete own food photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==============================================================================
-- HELPER FUNCTIONS FOR SEEDING STARTER ROUTINES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.seed_default_user_routine(p_user_id UUID, p_tz TEXT DEFAULT 'UTC')
RETURNS void AS $$
BEGIN
    INSERT INTO public.tasks (user_id, title, description, category, local_time, timezone, recurrence_type, recurrence_days, notification_message, completion_message)
    VALUES
    (p_user_id, 'Morning Awakening', 'Wake up gently, stretch, and welcome the day', 'Wake up', '07:00', p_tz, 'daily', '{0,1,2,3,4,5,6}', 'Good morning! It is time to wake up and start your day on your own terms.', 'Wonderful start! You greeted the day with calm and clarity.'),
    (p_user_id, 'Morning Hydration', 'Drink a glass of fresh water to hydrate', 'Drink water', '07:15', p_tz, 'daily', '{0,1,2,3,4,5,6}', 'LifeCare AI — Water Break. Time for a refreshing glass of water.', 'Well done! Hydrating early powers your focus and energy.'),
    (p_user_id, 'Nourishing Breakfast', 'Enjoy a balanced breakfast', 'Breakfast', '08:00', p_tz, 'daily', '{0,1,2,3,4,5,6}', 'Your breakfast reminder is here. Fuel your body for the day ahead.', 'Great job fueling your morning with balanced nourishment!'),
    (p_user_id, 'Midday Water Break', 'Take a quick break and drink water', 'Drink water', '11:00', p_tz, 'daily', '{0,1,2,3,4,5,6}', 'Time for your midday hydration check-in!', 'Excellent consistency! Your body thanks you.'),
    (p_user_id, 'Healthy Lunch', 'Take a mindful pause for lunch', 'Lunch', '13:00', p_tz, 'daily', '{0,1,2,3,4,5,6}', 'Your lunch reminder is here. Step away and enjoy your meal.', 'Delightful! You gave yourself a mindful lunch break.'),
    (p_user_id, 'Afternoon Movement', 'Stretching, light walk, or quick workout', 'Exercise', '16:30', p_tz, 'daily', '{0,1,2,3,4,5,6}', 'Time for a brief stretch or movement break. Release any tension.', 'Fantastic job moving your body! Every small movement counts.'),
    (p_user_id, 'Wholesome Dinner', 'Relax and enjoy an evening dinner', 'Dinner', '19:30', p_tz, 'daily', '{0,1,2,3,4,5,6}', 'Dinner time reminder. Wind down and savor your dinner.', 'Great job winding down your day with a satisfying meal.'),
    (p_user_id, 'Evening Wind-Down', 'Disconnect from screens and prepare for restful sleep', 'Sleep', '22:00', p_tz, 'daily', '{0,1,2,3,4,5,6}', 'Time to prepare for restful sleep. Dim the lights and relax.', 'Peaceful rest ahead. You took great care of yourself today.')
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
