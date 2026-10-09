import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { PushService } from '../services/pushService.js';
import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
import { devStore } from '../store/devStore.js';
import { config } from '../config/env.js';
import crypto from 'crypto';

const router = Router();

const SubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  user_agent: z.string().optional(),
});

// GET /api/notifications/settings
router.get('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let subscriptionCount = 0;

    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin
        .from('notification_subscriptions')
        .select('id')
        .eq('user_id', userId);

      subscriptionCount = data ? data.length : 0;
    } else {
      const list = devStore.subscriptions.get(userId) || [];
      subscriptionCount = list.length;
    }

    return res.json({
      vapid_public_key: config.vapid.publicKey,
      is_push_supported: Boolean(config.vapid.publicKey && config.vapid.privateKey),
      active_subscriptions: subscriptionCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve notification settings', details: err.message });
  }
});

// POST /api/notifications/subscribe
router.post(
  '/subscribe',
  requireAuth,
  validateBody(SubscribeSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { subscription, user_agent } = req.body;

      if (isLiveSupabase) {
        const { error } = await supabaseAdmin
          .from('notification_subscriptions')
          .upsert(
            {
              user_id: userId,
              endpoint: subscription.endpoint,
              subscription_data: subscription,
              user_agent: user_agent || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'endpoint' }
          );

        if (error) {
          return res.status(500).json({ error: error.message });
        }
      } else {
        const list = devStore.subscriptions.get(userId) || [];
        const filtered = list.filter((s) => s.endpoint !== subscription.endpoint);
        filtered.push({
          id: crypto.randomUUID(),
          user_id: userId,
          endpoint: subscription.endpoint,
          subscription_data: subscription,
          user_agent: user_agent || null,
        });
        devStore.subscriptions.set(userId, filtered);
      }

      return res.status(201).json({ success: true, message: 'Web Push subscription registered' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save subscription', details: err.message });
    }
  }
);

// DELETE /api/notifications/subscribe
router.delete('/subscribe', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const endpoint = req.query.endpoint as string;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter required' });
    }

    if (isLiveSupabase) {
      await supabaseAdmin
        .from('notification_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);
    } else {
      const list = devStore.subscriptions.get(userId) || [];
      devStore.subscriptions.set(
        userId,
        list.filter((s) => s.endpoint !== endpoint)
      );
    }

    return res.json({ success: true, message: 'Subscription removed' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete subscription', details: err.message });
  }
});

// POST /api/notifications/test
router.post('/test', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let subscriptions: any[] = [];

    if (isLiveSupabase) {
      const { data } = await supabaseAdmin
        .from('notification_subscriptions')
        .select('*')
        .eq('user_id', userId);
      subscriptions = data || [];
    } else {
      subscriptions = devStore.subscriptions.get(userId) || [];
    }

    if (subscriptions.length === 0) {
      return res.json({
        success: false,
        message: 'No active push subscriptions found on this device. Please allow notifications first.',
      });
    }

    let sent = 0;
    for (const sub of subscriptions) {
      const result = await PushService.sendToSubscription(sub.subscription_data, {
        title: 'LifeCare AI — Test Notification',
        body: '✨ Success! Your personalized wellness reminders will arrive right on time.',
        url: '/dashboard',
      });
      if (result.success) sent++;
    }

    return res.json({
      success: sent > 0,
      sent_count: sent,
      message: `Sent test notification to ${sent} registered browser session(s).`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send test notification', details: err.message });
  }
});

export default router;
