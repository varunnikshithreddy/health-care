import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
import { devStore } from '../store/devStore.js';
import crypto from 'crypto';
const router = Router();
const MealEntrySchema = z.object({
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'custom']).default('lunch'),
    food_name: z.string().min(1, 'Food name is required').max(200),
    portion_description: z.string().max(200).optional().nullable(),
    portion_grams: z.number().positive().optional().nullable(),
    estimated_calories_kcal: z.number().nonnegative().optional().nullable(),
    estimated_protein_g: z.number().nonnegative().optional().nullable(),
    estimated_carbohydrates_g: z.number().nonnegative().optional().nullable(),
    estimated_fat_g: z.number().nonnegative().optional().nullable(),
    analysis_metadata: z.record(z.any()).optional().nullable(),
    image_url: z.string().url().optional().nullable(),
    local_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
// GET /api/meals?date=YYYY-MM-DD
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const date = req.query.date || new Date().toISOString().substring(0, 10);
        if (isLiveSupabase) {
            const { data: meals, error } = await supabaseAdmin
                .from('meal_entries')
                .select('*')
                .eq('user_id', userId)
                .eq('local_date', date)
                .order('logged_at', { ascending: true });
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            return res.json({ meals: meals || [], date });
        }
        else {
            const all = devStore.mealEntries.get(userId) || [];
            const filtered = all.filter((m) => m.local_date === date);
            return res.json({ meals: filtered, date });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch meals', details: err.message });
    }
});
// POST /api/meals
router.post('/', requireAuth, validateBody(MealEntrySchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const local_date = req.body.local_date || new Date().toISOString().substring(0, 10);
        const mealData = {
            ...req.body,
            user_id: userId,
            local_date,
            logged_at: new Date().toISOString(),
        };
        if (isLiveSupabase) {
            const { data: meal, error } = await supabaseAdmin
                .from('meal_entries')
                .insert(mealData)
                .select()
                .single();
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            return res.status(201).json({ meal });
        }
        else {
            const id = crypto.randomUUID();
            const meal = {
                ...mealData,
                id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const list = devStore.mealEntries.get(userId) || [];
            list.push(meal);
            devStore.mealEntries.set(userId, list);
            return res.status(201).json({ meal });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to record meal', details: err.message });
    }
});
// DELETE /api/meals/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const id = String(req.params.id);
        if (isLiveSupabase) {
            const { error } = await supabaseAdmin
                .from('meal_entries')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            return res.json({ success: true, message: 'Meal deleted successfully' });
        }
        else {
            const list = devStore.mealEntries.get(userId) || [];
            const updated = list.filter((m) => m.id !== id);
            devStore.mealEntries.set(userId, updated);
            return res.json({ success: true, message: 'Meal deleted successfully' });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete meal', details: err.message });
    }
});
export default router;
