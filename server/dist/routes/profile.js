import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
import { devStore } from '../store/devStore.js';
const router = Router();
const UpdateProfileSchema = z.object({
    display_name: z.string().min(1).max(100).optional(),
    timezone: z.string().min(1).max(100).optional(),
    preferred_motivational_style: z.enum(['encouraging', 'mindful', 'energetic', 'calm']).optional(),
    wake_up_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    bed_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    theme_preference: z.enum(['light', 'dark', 'system']).optional(),
    encouragement_display_mode: z.enum(['toast', 'modal', 'subtle']).optional(),
    onboarding_completed: z.boolean().optional(),
});
// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        if (isLiveSupabase) {
            let { data: profile, error } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            if (!profile) {
                // Auto create if trigger didn't catch it
                const defaultProfile = {
                    id: userId,
                    display_name: req.user.email ? req.user.email.split('@')[0] : 'Wellness Explorer',
                    timezone: 'UTC',
                    preferred_motivational_style: 'encouraging',
                    wake_up_time: '07:00',
                    bed_time: '22:00',
                    theme_preference: 'system',
                    encouragement_display_mode: 'toast',
                    onboarding_completed: false,
                };
                const { data: created, error: insertErr } = await supabaseAdmin
                    .from('profiles')
                    .insert(defaultProfile)
                    .select()
                    .single();
                if (insertErr) {
                    return res.status(500).json({ error: insertErr.message });
                }
                profile = created;
            }
            return res.json({ profile });
        }
        else {
            let profile = devStore.profiles.get(userId);
            if (!profile) {
                profile = {
                    id: userId,
                    display_name: req.user.email ? req.user.email.split('@')[0] : 'Wellness Explorer',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                    preferred_motivational_style: 'encouraging',
                    wake_up_time: '07:00',
                    bed_time: '22:00',
                    theme_preference: 'system',
                    encouragement_display_mode: 'toast',
                    onboarding_completed: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                devStore.profiles.set(userId, profile);
            }
            return res.json({ profile });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve profile', details: err.message });
    }
});
// PATCH /api/profile
router.patch('/', requireAuth, validateBody(UpdateProfileSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = {
            ...req.body,
            updated_at: new Date().toISOString(),
        };
        if (isLiveSupabase) {
            const { data: updated, error } = await supabaseAdmin
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            return res.json({ profile: updated });
        }
        else {
            const existing = devStore.profiles.get(userId) || { id: userId };
            const updated = { ...existing, ...updates };
            devStore.profiles.set(userId, updated);
            return res.json({ profile: updated });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update profile', details: err.message });
    }
});
export default router;
