import cron from 'node-cron';
import { supabaseAdmin, isLiveSupabase } from '../config/supabase.js';
import { PushService } from './pushService.js';
import { config } from '../config/env.js';

export class ReminderScheduler {
  private isRunning = false;

  public start(): void {
    console.log(`⏰ Starting LifeCare AI Reminder Scheduler [${config.schedulerCron}]`);
    cron.schedule(config.schedulerCron, async () => {
      if (this.isRunning) return;
      this.isRunning = true;
      try {
        await this.checkAndDispatchReminders();
      } catch (err: any) {
        console.error('Error in reminder scheduler cycle:', err.message);
      } finally {
        this.isRunning = false;
      }
    });
  }

  public async checkAndDispatchReminders(): Promise<number> {
    if (!isLiveSupabase) {
      // In local dev mode without live Supabase DB, scheduler cycles gracefully
      return 0;
    }

    let dispatchedCount = 0;

    try {
      // 1. Fetch all enabled tasks with reminders
      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('enabled', true)
        .eq('reminder_enabled', true);

      if (tasksError || !tasks || tasks.length === 0) {
        return 0;
      }

      for (const task of tasks) {
        const tz = task.timezone || 'UTC';
        
        // Calculate user's local date, time, and day of week
        let localTimeStr = '';
        let localDateStr = '';
        let localDayOfWeek = 0; // 0=Sun..6=Sat

        try {
          const now = new Date();
          const timeFormatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          localTimeStr = timeFormatter.format(now);

          const dateFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          localDateStr = dateFormatter.format(now); // YYYY-MM-DD

          const dayFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            weekday: 'narrow',
          });
          // Or compute weekday index:
          const localDateObj = new Date(now.toLocaleString('en-US', { timeZone: tz }));
          localDayOfWeek = localDateObj.getDay();
        } catch (e) {
          // Fallback to UTC if invalid timezone string
          const now = new Date();
          localTimeStr = now.toISOString().substring(11, 16);
          localDateStr = now.toISOString().substring(0, 10);
          localDayOfWeek = now.getUTCDay();
        }

        // Check if task's scheduled time matches current local minute
        if (task.local_time !== localTimeStr) {
          continue;
        }

        // Check recurrence eligibility
        if (task.recurrence_type === 'weekdays' && (localDayOfWeek === 0 || localDayOfWeek === 6)) {
          continue;
        }
        if (task.recurrence_type === 'weekends' && localDayOfWeek !== 0 && localDayOfWeek !== 6) {
          continue;
        }
        if (task.recurrence_type === 'selected_days' && Array.isArray(task.recurrence_days)) {
          if (!task.recurrence_days.includes(localDayOfWeek)) {
            continue;
          }
        }

        // Check suppression: Is task already completed today?
        const { data: completion } = await supabaseAdmin
          .from('task_completions')
          .select('id, status')
          .eq('task_id', task.id)
          .eq('occurrence_date', localDateStr)
          .maybeSingle();

        if (completion && completion.status === 'completed') {
          // Suppress notification if already finished
          continue;
        }

        // Check duplicate prevention: Has notification already been dispatched today?
        const { data: existingLog } = await supabaseAdmin
          .from('notification_delivery_logs')
          .select('id')
          .eq('task_id', task.id)
          .eq('occurrence_date', localDateStr)
          .maybeSingle();

        if (existingLog) {
          // Already sent today
          continue;
        }

        // Get user's push subscriptions
        const { data: subscriptions } = await supabaseAdmin
          .from('notification_subscriptions')
          .select('*')
          .eq('user_id', task.user_id);

        const notificationTitle = `LifeCare AI — ${task.category || 'Reminder'}`;
        const notificationBody = task.notification_message || `It's ${task.local_time}. Time for "${task.title}"!`;

        let deliveryStatus: 'sent' | 'suppressed' | 'failed' = 'sent';
        let errorMessage: string | null = null;

        if (subscriptions && subscriptions.length > 0) {
          for (const sub of subscriptions) {
            try {
              const res = await PushService.sendToSubscription(
                sub.subscription_data,
                {
                  title: notificationTitle,
                  body: notificationBody,
                  url: '/dashboard',
                  taskId: task.id,
                  category: task.category,
                }
              );

              if (!res.success) {
                if (res.statusCode === 410 || res.statusCode === 404) {
                  // Expired subscription, remove from DB
                  await supabaseAdmin
                    .from('notification_subscriptions')
                    .delete()
                    .eq('id', sub.id);
                }
                deliveryStatus = 'failed';
                errorMessage = res.error || 'Push failed';
              }
            } catch (err: any) {
              deliveryStatus = 'failed';
              errorMessage = err.message;
            }
          }
        }

        // Record delivery log to ensure idempotency and prevent duplicates
        await supabaseAdmin
          .from('notification_delivery_logs')
          .insert({
            user_id: task.user_id,
            task_id: task.id,
            scheduled_for: new Date().toISOString(),
            occurrence_date: localDateStr,
            delivery_status: deliveryStatus,
            error_message: errorMessage,
          });

        dispatchedCount++;
      }
    } catch (err: any) {
      console.error('Error during reminder check dispatch:', err.message);
    }

    return dispatchedCount;
  }
}

export const reminderScheduler = new ReminderScheduler();
