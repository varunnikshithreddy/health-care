import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
import { devStore } from '../store/devStore.js';
import crypto from 'crypto';
const router = Router();
const UpdateWaterGoalSchema = z.object({
    daily_goal_ml: z.number().int().min(500).max(10000),
    preferred_serving_ml: z.number().int().min(50).max(2000).default(250),
});
const AddWaterEntrySchema = z.object({
    quantity_ml: z.number().int().min(10).max(3000),
    local_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    note: z.string().max(200).optional().nullable(),
});
// GET /api/water/goal
router.get('/goal', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        if (isLiveSupabase) {
            let { data: goal, error } = await supabaseAdmin
                .from('water_goals')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
            if (!goal) {
                // Create default
                const { data: created } = await supabaseAdmin
                    .from('water_goals')
                    .insert({ user_id: userId, daily_goal_ml: 2000, preferred_serving_ml: 250 })
                    .select()
                    .single();
                goal = created;
            }
            return res.json({ goal: goal || { daily_goal_ml: 2000, preferred_serving_ml: 250 } });
        }
        else {
            let goal = devStore.waterGoals.get(userId);
            if (!goal) {
                goal = {
                    id: 'goal-' + userId,
                    user_id: userId,
                    daily_goal_ml: 2000,
                    preferred_serving_ml: 250,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                devStore.waterGoals.set(userId, goal);
            }
            return res.json({ goal });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch water goal', details: err.message });
    }
});
// PUT /api/water/goal
router.put('/goal', requireAuth, validateBody(UpdateWaterGoalSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { daily_goal_ml, preferred_serving_ml } = req.body;
        if (isLiveSupabase) {
            const { data: goal, error } = await supabaseAdmin
                .from('water_goals')
                .upsert({
                user_id: userId,
                daily_goal_ml,
                preferred_serving_ml,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
                .select()
                .single();
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            return res.json({ goal });
        }
        else {
            const goal = {
                id: 'goal-' + userId,
                user_id: userId,
                daily_goal_ml,
                preferred_serving_ml,
                updated_at: new Date().toISOString(),
            };
            devStore.waterGoals.set(userId, goal);
            return res.json({ goal });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update water goal', details: err.message });
    }
});
// GET /api/water/entries?date=YYYY-MM-DD
router.get('/entries', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const date = req.query.date || new Date().toISOString().substring(0, 10);
        if (isLiveSupabase) {
            const { data: entries, error } = await supabaseAdmin
                .from('water_entries')
                .select('*')
                .eq('user_id', userId)
                .eq('local_date', date)
                .order('logged_at', { ascending: true });
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            const totalMl = (entries || []).reduce((sum, e) => sum + e.quantity_ml, 0);
            return res.json({ entries: entries || [], total_ml: totalMl, date });
        }
        else {
            const all = devStore.waterEntries.get(userId) || [];
            const filtered = all.filter((e) => e.local_date === date);
            const totalMl = filtered.reduce((sum, e) => sum + e.quantity_ml, 0);
            return res.json({ entries: filtered, total_ml: totalMl, date });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch water entries', details: err.message });
    }
});
// POST /api/water/entries
router.post('/entries', requireAuth, validateBody(AddWaterEntrySchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { quantity_ml, note } = req.body;
        const local_date = req.body.local_date || new Date().toISOString().substring(0, 10);
        const entryData = {
            user_id: userId,
            quantity_ml,
            local_date,
            note: note || null,
            logged_at: new Date().toISOString(),
        };
        if (isLiveSupabase) {
            const { data: entry, error } = await supabaseAdmin
                .from('water_entries')
                .insert(entryData)
                .select()
                .single();
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            return res.status(201).json({ entry });
        }
        else {
            const id = crypto.randomUUID();
            const entry = {
                ...entryData,
                id,
                created_at: new Date().toISOString(),
            };
            const list = devStore.waterEntries.get(userId) || [];
            list.push(entry);
            devStore.waterEntries.set(userId, list);
            return res.status(201).json({ entry });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to record water entry', details: err.message });
    }
});
// DELETE /api/water/entries/:id
router.delete('/entries/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const id = String(req.params.id);
        if (isLiveSupabase) {
            const { error } = await supabaseAdmin
                .from('water_entries')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            return res.json({ success: true, message: 'Water entry removed' });
        }
        else {
            const list = devStore.waterEntries.get(userId) || [];
            const updated = list.filter((e) => e.id !== id);
            devStore.waterEntries.set(userId, updated);
            return res.json({ success: true, message: 'Water entry removed' });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete water entry', details: err.message });
    }
});
export default router;
