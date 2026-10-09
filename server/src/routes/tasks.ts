import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
import { devStore } from '../store/devStore.js';
import crypto from 'crypto';

const router = Router();

const TaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().default('Custom activity'),
  local_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM 24-hour format'),
  timezone: z.string().default('UTC'),
  recurrence_type: z.enum(['daily', 'weekdays', 'weekends', 'selected_days', 'once']).default('daily'),
  recurrence_days: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  duration_minutes: z.number().int().min(1).max(1440).default(15),
  reminder_enabled: z.boolean().default(true),
  notification_message: z.string().max(500).optional().nullable(),
  completion_message: z.string().min(1, 'Completion message is required').max(500).default('Great job! Every small step counts towards your wellbeing.'),
  snooze_duration_minutes: z.number().int().min(1).max(60).default(10),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  enabled: z.boolean().default(true),
});

const UpdateTaskSchema = TaskSchema.partial();

// GET /api/tasks
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    if (isLiveSupabase) {
      const { data: tasks, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('local_time', { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ tasks: tasks || [] });
    } else {
      const userTasks: any[] = [];
      devStore.tasks.forEach((t) => {
        if (t.user_id === userId) {
          userTasks.push(t);
        }
      });
      userTasks.sort((a, b) => a.local_time.localeCompare(b.local_time));
      return res.json({ tasks: userTasks });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

// POST /api/tasks
router.post(
  '/',
  requireAuth,
  validateBody(TaskSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const taskData = {
        ...req.body,
        user_id: userId,
        start_date: req.body.start_date || new Date().toISOString().substring(0, 10),
      };

      if (isLiveSupabase) {
        const { data: newTask, error } = await supabaseAdmin
          .from('tasks')
          .insert(taskData)
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json({ task: newTask });
      } else {
        const id = crypto.randomUUID();
        const newTask = {
          ...taskData,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        devStore.tasks.set(id, newTask);
        return res.status(201).json({ task: newTask });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create task', details: err.message });
    }
  }
);

// PATCH /api/tasks/:id
router.patch(
  '/:id',
  requireAuth,
  validateBody(UpdateTaskSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      if (isLiveSupabase) {
        const { data: updated, error } = await supabaseAdmin
          .from('tasks')
          .update({ ...req.body, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }
        if (!updated) {
          return res.status(404).json({ error: 'Task not found or access denied' });
        }

        return res.json({ task: updated });
      } else {
        const existing = devStore.tasks.get(id);
        if (!existing || existing.user_id !== userId) {
          return res.status(404).json({ error: 'Task not found' });
        }
        const updated = {
          ...existing,
          ...req.body,
          updated_at: new Date().toISOString(),
        };
        devStore.tasks.set(id, updated);
        return res.json({ task: updated });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update task', details: err.message });
    }
  }
);

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    if (isLiveSupabase) {
      const { error } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ success: true, message: 'Task deleted successfully' });
    } else {
      const existing = devStore.tasks.get(id);
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ error: 'Task not found' });
      }
      devStore.tasks.delete(id);
      return res.json({ success: true, message: 'Task deleted successfully' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

// POST /api/tasks/seed-defaults
router.post('/seed-defaults', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const tz = req.body.timezone || 'UTC';

    const defaultRoutine = [
      {
        title: 'Morning Awakening & Mindfulness',
        description: 'Wake up gently, stretch your arms, and breathe with calm focus.',
        category: 'Wake up',
        local_time: '07:00',
        timezone: tz,
        recurrence_type: 'daily',
        recurrence_days: [0, 1, 2, 3, 4, 5, 6],
        duration_minutes: 10,
        reminder_enabled: true,
        notification_message: 'Good morning! Rise gently and greet today with clarity.',
        completion_message: 'Wonderful start! You greeted the day on your own terms.',
        priority: 'high',
      },
      {
        title: 'Morning Hydration Check',
        description: 'Drink a glass of water to hydrate your body and mind.',
        category: 'Drink water',
        local_time: '07:15',
        timezone: tz,
        recurrence_type: 'daily',
        recurrence_days: [0, 1, 2, 3, 4, 5, 6],
        duration_minutes: 5,
        reminder_enabled: true,
        notification_message: 'LifeCare AI — Water Break. Time for a refreshing glass of water.',
        completion_message: 'Well done! Hydrating early powers your focus and energy.',
        priority: 'medium',
      },
      {
        title: 'Nourishing Breakfast',
        description: 'Enjoy a balanced breakfast with whole foods and protein.',
        category: 'Breakfast',
        local_time: '08:00',
        timezone: tz,
        recurrence_type: 'daily',
        recurrence_days: [0, 1, 2, 3, 4, 5, 6],
        duration_minutes: 25,
        reminder_enabled: true,
        notification_message: 'Your breakfast reminder is here. Fuel your body for the day ahead.',
        completion_message: 'Great job fueling your morning with balanced nourishment!',
        priority: 'medium',
      },
      {
        title: 'Midday Water Intake',
        description: 'Drink another glass of water.',
        category: 'Drink water',
        local_time: '11:00',
        timezone: tz,
        recurrence_type: 'daily',
        recurrence_days: [0, 1, 2, 3, 4, 5, 6],
        duration_minutes: 5,
        reminder_enabled: true,
        notification_message: 'Time for your midday hydration check-in!',
        completion_message: 'Excellent consistency! Your body thanks you.',
        priority: 'low',
      },
      {
        title: 'Mindful Lunch Break',
        description: 'Step away from work and savor a healthy lunch.',
        category: 'Lunch',
        local_time: '13:00',
        timezone: tz,
        recurrence_type: 'daily',
        recurrence_days: [0, 1, 2, 3, 4, 5, 6],
        duration_minutes: 35,
        reminder_enabled: true,
        notification_message: 'Your lunch reminder is here. Step away and enjoy your meal.',
        completion_message: 'Delightful! You gave yourself a mindful lunch break.',
        priority: 'medium',
      },
      {
        title: 'Afternoon Stretch or Walk',
        description: 'Take a short 15-minute walk or gentle stretch.',
        category: 'Exercise',
        local_time: '16:30',
        timezone: tz,
        recurrence_type: 'daily',
        recurrence_days: [0, 1, 2, 3, 4, 5, 6],
        duration_minutes: 15,
        reminder_enabled: true,
        notification_message: 'Time for a brief stretch or movement break. Release any tension.',
        completion_message: 'Fantastic job moving your body! Every small movement counts.',
        priority: 'medium',
      },
      {
        title: 'Wholesome Dinner',
        description: 'Wind down your day with a satisfying dinner.',
        category: 'Dinner',
        local_time: '19:30',
        timezone: tz,
        recurrence_type: 'daily',
        recurrence_days: [0, 1, 2, 3, 4, 5, 6],
        duration_minutes: 30,
        reminder_enabled: true,
        notification_message: 'Dinner time reminder. Wind down and savor your dinner.',
        completion_message: 'Great job winding down your day with a satisfying meal.',
        priority: 'medium',
      },
      {
        title: 'Restful Sleep Wind-Down',
        description: 'Disconnect from screens, dim lights, and prepare for sleep.',
        category: 'Sleep',
        local_time: '22:00',
        timezone: tz,
        recurrence_type: 'daily',
        recurrence_days: [0, 1, 2, 3, 4, 5, 6],
        duration_minutes: 20,
        reminder_enabled: true,
        notification_message: 'Time to prepare for restful sleep. Dim the lights and relax.',
        completion_message: 'Peaceful rest ahead. You took great care of yourself today.',
        priority: 'high',
      },
    ];

    const inserted: any[] = [];
    for (const item of defaultRoutine) {
      if (isLiveSupabase) {
        const { data } = await supabaseAdmin.from('tasks').insert({ ...item, user_id: userId }).select().single();
        if (data) inserted.push(data);
      } else {
        const id = crypto.randomUUID();
        const t = { ...item, id, user_id: userId, enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        devStore.tasks.set(id, t);
        inserted.push(t);
      }
    }

    return res.status(201).json({ tasks: inserted, count: inserted.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to seed routine', details: err.message });
  }
});

export default router;
