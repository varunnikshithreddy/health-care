import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { NotificationManager } from '../lib/notificationManager';
import { api } from '../lib/api';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'encouragement';
  taskTitle?: string;
  duration?: number;
}

export interface LiveReminder {
  id: string;
  task: any;
  timeStr: string;
}

interface NotificationContextType {
  permission: NotificationPermission;
  isPushSupported: boolean;
  isPushSubscribed: boolean;
  toasts: ToastItem[];
  encouragementData: { isOpen: boolean; message: string; taskTitle: string } | null;
  activeReminder: LiveReminder | null;
  requestPermission: () => Promise<boolean>;
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'encouragement',
    duration?: number
  ) => void;
  showEncouragement: (message: string, taskTitle: string, mode?: 'toast' | 'modal' | 'subtle') => void;
  dismissToast: (id: string) => void;
  closeEncouragement: () => void;
  closeReminder: () => void;
  snoozeReminder: (minutes?: number) => void;
  triggerLiveReminder: (task: any) => void;
  sendTestPushNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function playReminderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First bell tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second bell tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.18); // E5
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.75);
  } catch (e) {
    console.debug('Chime audio unable to play:', e);
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [encouragementData, setEncouragementData] = useState<{
    isOpen: boolean;
    message: string;
    taskTitle: string;
  } | null>(null);

  // Active On-Screen Scheduled Reminder
  const [activeReminder, setActiveReminder] = useState<LiveReminder | null>(null);
  const snoozeTimeouts = useRef<Record<string, number>>({});

  useEffect(() => {
    setPermission(NotificationManager.getPermission());
    setIsPushSupported(NotificationManager.isSupported());

    // Check existing push subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsPushSubscribed(Boolean(sub));
        });
      });
    }
  }, []);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'encouragement' = 'info',
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      dismissToast(id);
    }, duration);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showEncouragement = (
    message: string,
    taskTitle: string,
    mode: 'toast' | 'modal' | 'subtle' = 'toast'
  ) => {
    if (mode === 'modal') {
      setEncouragementData({ isOpen: true, message, taskTitle });
    } else {
      showToast(message, 'encouragement', 6000);
    }
  };

  const closeEncouragement = () => {
    setEncouragementData(null);
  };

  // Trigger On-Screen Reminder + Native OS Browser Notification + Sound Chime
  const triggerLiveReminder = (task: any) => {
    setActiveReminder({
      id: task.id,
      task,
      timeStr: task.local_time,
    });

    // Play subtle bell chime
    playReminderChime();

    // Show native OS browser notification if allowed
    const notificationBody =
      task.notification_message || `It's ${task.local_time}. Time for "${task.title}"!`;
    NotificationManager.showLocalNotification(`LifeCare AI — ${task.local_time}: ${task.title}`, {
      body: notificationBody,
      tag: `reminder-${task.id}`,
    });
  };

  const closeReminder = () => {
    setActiveReminder(null);
  };

  const snoozeReminder = (minutes: number = 5) => {
    if (!activeReminder) return;
    const task = activeReminder.task;
    closeReminder();

    const timeoutId = window.setTimeout(() => {
      triggerLiveReminder(task);
    }, minutes * 60 * 1000);

    snoozeTimeouts.current[task.id] = timeoutId;
  };

  const requestPermission = async (): Promise<boolean> => {
    const perm = await NotificationManager.requestPermission();
    setPermission(perm);
    if (perm === 'granted') {
      showToast('Notifications enabled! Reminders will arrive right on time.', 'success');
      return true;
    }
    return false;
  };

  const sendTestPushNotification = async () => {
    try {
      const res = await api.sendTestPush();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        NotificationManager.showLocalNotification('LifeCare AI — Water & Routine Reminder', {
          body: 'This is a test notification. Your routine is active and healthy!',
        });
        showToast('Local notification displayed.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Push test failed', 'error');
    }
  };

  // ============================================================================
  // CLIENT-SIDE REAL-TIME REMINDER ENGINE (TICKER)
  // Runs continuously in browser every 10 seconds to catch the exact minute
  // ============================================================================
  useEffect(() => {
    const checkScheduledReminders = async () => {
      try {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        const currentHHMM = `${h}:${m}`;
        const today = now.toISOString().substring(0, 10);
        const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Mon...

        // Read tasks
        const res = await api.getTasks();
        const tasks = res.tasks || [];
        if (tasks.length === 0) return;

        // Check if task is already completed today
        let completedTaskIds = new Set<string>();
        try {
          const compRes = await api.getCompletions(today);
          completedTaskIds = new Set(
            (compRes.completions || [])
              .filter((c: any) => c.status === 'completed')
              .map((c: any) => c.task_id)
          );
        } catch {}

        const firedKey = `lifecare_fired_${today}`;
        const firedList: string[] = JSON.parse(sessionStorage.getItem(firedKey) || '[]');
        const firedSet = new Set(firedList);

        for (const task of tasks) {
          if (!task.enabled || task.reminder_enabled === false) continue;
          if (completedTaskIds.has(task.id)) continue;

          // Check day recurrence
          let isDayActive = true;
          if (task.recurrence_type === 'weekdays') {
            isDayActive = dayOfWeek >= 1 && dayOfWeek <= 5;
          } else if (task.recurrence_type === 'weekends') {
            isDayActive = dayOfWeek === 0 || dayOfWeek === 6;
          } else if (
            task.recurrence_type === 'selected_days' &&
            Array.isArray(task.recurrence_days)
          ) {
            isDayActive = task.recurrence_days.includes(dayOfWeek);
          }

          if (!isDayActive) continue;

          // Check if current time matches scheduled local_time
          if (task.local_time === currentHHMM) {
            const uniqueKey = `${task.id}_${currentHHMM}`;
            if (!firedSet.has(uniqueKey)) {
              firedSet.add(uniqueKey);
              sessionStorage.setItem(firedKey, JSON.stringify(Array.from(firedSet)));

              // Trigger On-Screen Reminder!
              triggerLiveReminder(task);
              break;
            }
          }
        }
      } catch (err) {
        console.debug('Reminder ticker check notice:', err);
      }
    };

    // Run immediately and every 10 seconds
    checkScheduledReminders();
    const interval = setInterval(checkScheduledReminders, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        permission,
        isPushSupported,
        isPushSubscribed,
        toasts,
        encouragementData,
        activeReminder,
        requestPermission,
        showToast,
        showEncouragement,
        dismissToast,
        closeEncouragement,
        closeReminder,
        snoozeReminder,
        triggerLiveReminder,
        sendTestPushNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
