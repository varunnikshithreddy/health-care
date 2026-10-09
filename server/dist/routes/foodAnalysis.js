import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { geminiVisionService } from '../services/geminiVision.js';
import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
import { devStore } from '../store/devStore.js';
import crypto from 'crypto';
const router = Router();
// Configure multer for memory storage and file validation
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid image file type. Supported formats: JPEG, PNG, WEBP.'));
        }
    },
});
// POST /api/food/analyze
router.post('/analyze', requireAuth, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'MissingImage',
                message: 'Please upload a food photo to analyze.',
            });
        }
        const mealType = req.body.meal_type || 'lunch';
        const userDescription = req.body.description || '';
        const analysisResult = await geminiVisionService.analyzeFoodImage(req.file.buffer, req.file.mimetype, {
            mealType,
            userDescription,
        });
        return res.json({
            success: true,
            analysis: analysisResult,
            preview_data_url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        });
    }
    catch (err) {
        console.error('Food analysis error:', err);
        res.status(500).json({
            error: 'AnalysisFailed',
            message: 'Unable to analyze image. Please try again or enter details manually.',
            details: err.message,
        });
    }
});
const ConfirmFoodSchema = z.object({
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'custom']),
    food_name: z.string().min(1),
    portion_description: z.string().optional().nullable(),
    portion_grams: z.number().positive().optional().nullable(),
    estimated_calories_kcal: z.number().nonnegative(),
    estimated_protein_g: z.number().nonnegative().optional().nullable(),
    estimated_carbohydrates_g: z.number().nonnegative().optional().nullable(),
    estimated_fat_g: z.number().nonnegative().optional().nullable(),
    analysis_metadata: z.record(z.any()).optional().nullable(),
    local_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
// POST /api/food/confirm
router.post('/confirm', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const validated = ConfirmFoodSchema.parse(req.body);
        const local_date = validated.local_date || new Date().toISOString().substring(0, 10);
        const mealData = {
            user_id: userId,
            meal_type: validated.meal_type,
            food_name: validated.food_name,
            portion_description: validated.portion_description || null,
            portion_grams: validated.portion_grams || null,
            estimated_calories_kcal: validated.estimated_calories_kcal,
            estimated_protein_g: validated.estimated_protein_g || 0,
            estimated_carbohydrates_g: validated.estimated_carbohydrates_g || 0,
            estimated_fat_g: validated.estimated_fat_g || 0,
            analysis_metadata: validated.analysis_metadata || {},
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
            return res.status(201).json({
                success: true,
                message: 'Meal confirmed and saved to your nutrition log',
                meal,
            });
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
            return res.status(201).json({
                success: true,
                message: 'Meal confirmed and saved to your nutrition log',
                meal,
            });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to confirm meal', details: err.message });
    }
});
export default router;
