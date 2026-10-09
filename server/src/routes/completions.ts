import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
import { devStore } from '../store/devStore.js';
import crypto from 'crypto';

const router = Router();

const CompleteTaskSchema = z.object({
  occurrence_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['completed', 'skipped', 'postponed']).default('completed'),
  notes: z.string().max(500).optional().nullable(),
});

// GET /api/completions?date=YYYY-MM-DD
router.get('/completions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const date = (req.query.date as string) || new Date().toISOString().substring(0, 10);

    if (isLiveSupabase) {
      const { data: completions, error } = await supabaseAdmin
        .from('task_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('occurrence_date', date);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ completions: completions || [], date });
    } else {
      const results: any[] = [];
      devStore.completions.forEach((c) => {
        if (c.user_id === userId && c.occurrence_date === date) {
          results.push(c);
        }
      });
      return res.json({ completions: results, date });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch completions', details: err.message });
  }
});

// POST /api/tasks/:id/completions
router.post(
  '/tasks/:id/completions',
  requireAuth,
  validateBody(CompleteTaskSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const taskId = String(req.params.id);
      const { occurrence_date, status, notes } = req.body;

      // 1. Fetch task to get the user's custom completion message
      let task: any = null;
      if (isLiveSupabase) {
        const { data: t } = await supabaseAdmin
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .eq('user_id', userId)
          .single();
        task = t;
      } else {
        task = devStore.tasks.get(taskId);
      }

      if (!task || task.user_id !== userId) {
        return res.status(404).json({ error: 'Task not found or unauthorized' });
      }

      const encouragementMessage =
        task.completion_message ||
        'Great job! Every small step counts towards your wellbeing.';

      // 2. Save completion record with upsert / duplicate prevention
      let record: any = null;

      if (isLiveSupabase) {
        const { data, error } = await supabaseAdmin
          .from('task_completions')
          .upsert(
            {
              user_id: userId,
              task_id: taskId,
              occurrence_date,
              status,
              notes: notes || null,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,task_id,occurrence_date' }
          )
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }
        record = data;

        // Also log into notification_delivery_logs as suppressed so no reminder fires
        try {
          await supabaseAdmin
            .from('notification_delivery_logs')
            .upsert(
              {
                user_id: userId,
                task_id: taskId,
                scheduled_for: new Date().toISOString(),
                occurrence_date,
                delivery_status: 'suppressed',
                attempt_count: 1,
                error_message: 'Task completed by user; reminder suppressed.',
              },
              { onConflict: 'user_id,task_id,occurrence_date' }
            );
        } catch {
          // Non-critical background suppression log
        }
      } else {
        const key = `${userId}_${taskId}_${occurrence_date}`;
        const existing = devStore.completions.get(key);
        record = {
          id: existing?.id || crypto.randomUUID(),
          user_id: userId,
          task_id: taskId,
          occurrence_date,
          status,
          notes: notes || null,
          completed_at: new Date().toISOString(),
          created_at: existing?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        devStore.completions.set(key, record);
      }

      return res.status(200).json({
        success: true,
        completion: record,
        encouragement_message: encouragementMessage,
        task_title: task.title,
        status,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record completion', details: err.message });
    }
  }
);

// DELETE /api/tasks/:id/completions?date=YYYY-MM-DD
router.delete('/tasks/:id/completions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const taskId = String(req.params.id);
    const date = (req.query.date as string) || new Date().toISOString().substring(0, 10);

    if (isLiveSupabase) {
      const { error } = await supabaseAdmin
        .from('task_completions')
        .delete()
        .eq('user_id', userId)
        .eq('task_id', taskId)
        .eq('occurrence_date', date);

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.json({ success: true, message: 'Completion reverted' });
    } else {
      const key = `${userId}_${taskId}_${date}`;
      devStore.completions.delete(key);
      return res.json({ success: true, message: 'Completion reverted' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to revert completion', details: err.message });
  }
});

export default router;
