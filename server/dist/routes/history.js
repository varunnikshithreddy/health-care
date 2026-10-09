import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
import { devStore } from '../store/devStore.js';
const router = Router();
// GET /api/history?days=7
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const daysCount = parseInt(req.query.days || '7', 10);
        // Generate date range
        const dates = [];
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().substring(0, 10));
        }
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        let tasks = [];
        let completions = [];
        let waterEntries = [];
        let mealEntries = [];
        if (isLiveSupabase) {
            const [tRes, cRes, wRes, mRes] = await Promise.all([
                supabaseAdmin.from('tasks').select('*').eq('user_id', userId),
                supabaseAdmin
                    .from('task_completions')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('occurrence_date', startDate)
                    .lte('occurrence_date', endDate),
                supabaseAdmin
                    .from('water_entries')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('local_date', startDate)
                    .lte('local_date', endDate),
                supabaseAdmin
                    .from('meal_entries')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('local_date', startDate)
                    .lte('local_date', endDate),
            ]);
            tasks = tRes.data || [];
            completions = cRes.data || [];
            waterEntries = wRes.data || [];
            mealEntries = mRes.data || [];
        }
        else {
            devStore.tasks.forEach((t) => {
                if (t.user_id === userId)
                    tasks.push(t);
            });
            devStore.completions.forEach((c) => {
                if (c.user_id === userId && dates.includes(c.occurrence_date)) {
                    completions.push(c);
                }
            });
            const allW = devStore.waterEntries.get(userId) || [];
            waterEntries = allW.filter((w) => dates.includes(w.local_date));
            const allM = devStore.mealEntries.get(userId) || [];
            mealEntries = allM.filter((m) => dates.includes(m.local_date));
        }
        // Aggregate trends per date
        const dailyAnalytics = dates.map((date) => {
            const dayCompletions = completions.filter((c) => c.occurrence_date === date);
            const completedCount = dayCompletions.filter((c) => c.status === 'completed').length;
            const skippedCount = dayCompletions.filter((c) => c.status === 'skipped').length;
            const totalEligibleTasks = tasks.length || 1;
            const completionPercentage = Math.min(100, Math.round((completedCount / totalEligibleTasks) * 100));
            const dayWater = waterEntries.filter((w) => w.local_date === date);
            const totalWaterMl = dayWater.reduce((sum, w) => sum + (w.quantity_ml || 0), 0);
            const dayMeals = mealEntries.filter((m) => m.local_date === date);
            const totalCaloriesKcal = dayMeals.reduce((sum, m) => sum + (Number(m.estimated_calories_kcal) || 0), 0);
            const totalProteinG = dayMeals.reduce((sum, m) => sum + (Number(m.estimated_protein_g) || 0), 0);
            const totalCarbsG = dayMeals.reduce((sum, m) => sum + (Number(m.estimated_carbohydrates_g) || 0), 0);
            const totalFatG = dayMeals.reduce((sum, m) => sum + (Number(m.estimated_fat_g) || 0), 0);
            return {
                date,
                total_tasks: totalEligibleTasks,
                completed_tasks: completedCount,
                skipped_tasks: skippedCount,
                completion_percentage: completionPercentage,
                water_ml: totalWaterMl,
                meals_count: dayMeals.length,
                calories_kcal: Math.round(totalCaloriesKcal),
                protein_g: Math.round(totalProteinG),
                carbs_g: Math.round(totalCarbsG),
                fat_g: Math.round(totalFatG),
            };
        });
        return res.json({
            range: { start: startDate, end: endDate, days: daysCount },
            analytics: dailyAnalytics,
            summary: {
                total_tasks_completed: completions.filter((c) => c.status === 'completed').length,
                total_water_logged_ml: waterEntries.reduce((sum, w) => sum + (w.quantity_ml || 0), 0),
                total_meals_recorded: mealEntries.length,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to generate history analytics', details: err.message });
    }
});
export default router;
