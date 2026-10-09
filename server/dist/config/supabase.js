import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';
export const isLiveSupabase = Boolean(config.supabase.url &&
    config.supabase.serviceRoleKey &&
    !config.supabase.url.includes('placeholder') &&
    !config.supabase.serviceRoleKey.includes('placeholder'));
export const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
