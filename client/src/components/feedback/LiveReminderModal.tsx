import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Bell, Clock, CheckCircle2, Timer, X, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

function format12Hour(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr || '--:--';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m < 10 ? '0' : ''}${m} ${period}`;
}

export const LiveReminderModal: React.FC = () => {
  const { activeReminder, closeReminder, snoozeReminder, showEncouragement, showToast } =
    useNotification();
  const { profile } = useAuth();

  if (!activeReminder) return null;

  const { task } = activeReminder;
  const today = new Date().toISOString().substring(0, 10);

  const handleComplete = async () => {
    try {
      const res = await api.completeTask(task.id, {
        occurrence_date: today,
        status: 'completed',
      });
      closeReminder();
      showEncouragement(
        res.encouragement_message || task.completion_message || 'Great job! Keep going.',
        task.title,
        profile?.encouragement_display_mode || 'toast'
      );
    } catch (err: any) {
      showToast(err.message || 'Recorded completion locally', 'success');
      closeReminder();
      showEncouragement(
        task.completion_message || 'Great job! Keep going.',
        task.title,
        profile?.encouragement_display_mode || 'toast'
      );
    }
  };

  const handleSnooze = () => {
    snoozeReminder(5);
    showToast(`"${task.title}" snoozed for 5 minutes`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={closeReminder}
      />

      {/* On-Screen Reminder Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-brand-500/80 dark:border-brand-500/70 p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Glowing Top Pill */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800 text-xs font-extrabold uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping" />
            <span>Scheduled Routine Reminder</span>
          </div>

          <button
            onClick={closeReminder}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Alert Body */}
        <div className="my-5 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/30 animate-bounce">
            <Bell className="w-8 h-8" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>It is {format12Hour(task.local_time)}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {task.category || 'Routine'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {task.title}
            </h2>

            {task.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-medium">
                {task.description}
              </p>
            )}

            {/* Custom Notification Message */}
            <div className="mt-3.5 p-3 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-900/40 text-xs">
              <span className="text-brand-800 dark:text-brand-200 font-semibold block">
                {task.notification_message ||
                  `It's ${format12Hour(task.local_time)}. Time for "${task.title}"!`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={closeReminder}
            className="w-full sm:w-auto text-xs text-slate-500 order-3 sm:order-1"
          >
            Dismiss
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSnooze}
            leftIcon={<Timer className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto text-xs order-2"
          >
            Snooze 5 Min
          </Button>

          <Button
            size="sm"
            onClick={handleComplete}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs font-bold order-1 sm:order-3 shadow-md shadow-brand-500/25"
          >
            Mark as Done ✓
          </Button>
        </div>
      </div>
    </div>
  );
};
