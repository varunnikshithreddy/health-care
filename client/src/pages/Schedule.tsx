import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  CalendarClock,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Clock,
  Bell,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Power,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Droplets,
  Utensils,
  Dumbbell,
  BookOpen,
  Heart,
  Activity,
  LayoutList,
  Table as TableIcon,
  Grid,
  ChevronRight,
  Check,
  Calendar,
  Timer,
  AlertCircle,
  Target,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Wake up', label: 'Wake up', icon: Sunrise, color: 'amber' },
  { id: 'Drink water', label: 'Drink water', icon: Droplets, color: 'blue' },
  { id: 'Breakfast', label: 'Breakfast', icon: Coffee, color: 'amber' },
  { id: 'Lunch', label: 'Lunch', icon: Utensils, color: 'green' },
  { id: 'Dinner', label: 'Dinner', icon: Utensils, color: 'purple' },
  { id: 'Exercise', label: 'Exercise', icon: Dumbbell, color: 'rose' },
  { id: 'Stretching', label: 'Stretching', icon: Activity, color: 'green' },
  { id: 'Study', label: 'Study', icon: BookOpen, color: 'blue' },
  { id: 'Relaxation', label: 'Relaxation', icon: Sun, color: 'blue' },
  { id: 'Sleep', label: 'Sleep', icon: Moon, color: 'purple' },
  { id: 'Personal care', label: 'Personal care', icon: Heart, color: 'rose' },
  { id: 'Custom activity', label: 'Custom activity', icon: Sparkles, color: 'slate' },
];

const WEEKDAYS = [
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
];

const TIME_PERIODS = [
  {
    id: 'early_morning',
    label: 'Early Morning',
    range: '05:00 – 08:00 AM',
    startHour: 5,
    endHour: 8,
    icon: Sunrise,
    badgeVariant: 'amber' as const,
    bgClass: 'from-amber-500/10 to-transparent',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-600 dark:text-amber-400',
    defaultTime: '06:30',
  },
  {
    id: 'morning',
    label: 'Morning & Midday',
    range: '08:00 AM – 12:00 PM',
    startHour: 8,
    endHour: 12,
    icon: Sun,
    badgeVariant: 'green' as const,
    bgClass: 'from-emerald-500/10 to-transparent',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    defaultTime: '08:30',
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    range: '12:00 – 05:00 PM',
    startHour: 12,
    endHour: 17,
    icon: Sun,
    badgeVariant: 'blue' as const,
    bgClass: 'from-sky-500/10 to-transparent',
    borderClass: 'border-sky-500/30',
    textClass: 'text-sky-600 dark:text-sky-400',
    defaultTime: '13:00',
  },
  {
    id: 'evening',
    label: 'Evening',
    range: '05:00 – 09:00 PM',
    startHour: 17,
    endHour: 21,
    icon: Sunset,
    badgeVariant: 'purple' as const,
    bgClass: 'from-indigo-500/10 to-transparent',
    borderClass: 'border-indigo-500/30',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    defaultTime: '18:00',
  },
  {
    id: 'night',
    label: 'Night & Rest',
    range: '09:00 PM – 05:00 AM',
    startHour: 21,
    endHour: 29,
    icon: Moon,
    badgeVariant: 'purple' as const,
    bgClass: 'from-purple-500/10 to-transparent',
    borderClass: 'border-purple-500/30',
    textClass: 'text-purple-600 dark:text-purple-400',
    defaultTime: '22:00',
  },
];

const QUICK_TIME_PRESETS = [
  { label: 'Wake up', time: '07:00', period: '7:00 AM', icon: Sunrise },
  { label: 'Breakfast', time: '08:30', period: '8:30 AM', icon: Coffee },
  { label: 'Water Break', time: '11:00', period: '11:00 AM', icon: Droplets },
  { label: 'Lunch', time: '13:00', period: '1:00 PM', icon: Utensils },
  { label: 'Movement', time: '16:30', period: '4:30 PM', icon: Dumbbell },
  { label: 'Dinner', time: '19:30', period: '7:30 PM', icon: Utensils },
  { label: 'Wind-Down', time: '22:00', period: '10:00 PM', icon: Moon },
];

const DURATION_PRESETS = [5, 15, 30, 45, 60, 90];

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

function getEndTime(timeStr: string, durationMinutes: number): string {
  if (!timeStr || !timeStr.includes(':')) return '--:--';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return '--:--';
  const startMinutes = h * 60 + m;
  const endMinutes = (startMinutes + (durationMinutes || 15)) % (24 * 60);
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const period = endH >= 12 ? 'PM' : 'AM';
  const h12 = endH % 12 === 0 ? 12 : endH % 12;
  return `${h12}:${endM < 10 ? '0' : ''}${endM} ${period}`;
}

function getPeriodForTime(timeStr: string) {
  if (!timeStr || !timeStr.includes(':')) return TIME_PERIODS[1];
  const h = parseInt(timeStr.split(':')[0], 10);
  if (h >= 5 && h < 8) return TIME_PERIODS[0];
  if (h >= 8 && h < 12) return TIME_PERIODS[1];
  if (h >= 12 && h < 17) return TIME_PERIODS[2];
  if (h >= 17 && h < 21) return TIME_PERIODS[3];
  return TIME_PERIODS[4];
}

export const Schedule: React.FC = () => {
  const { showToast, triggerLiveReminder, permission, requestPermission } = useNotification();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'timeline' | 'table' | 'hourly'>('timeline');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');

  // Form Fields - Divided into 2 distinct columns:
  // COLUMN 1: TIME FIELDS
  const [localTime, setLocalTime] = useState('08:00');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // COLUMN 2: ACTIVITY AT THIS TIME FIELDS
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom activity');
  const [priority, setPriority] = useState('medium');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [completionMessage, setCompletionMessage] = useState(
    'Great job! Every small step counts towards your wellbeing.'
  );

  const loadTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const resetForm = (presetTime?: string) => {
    setEditingTask(null);
    setLocalTime(presetTime || '08:00');
    setDurationMinutes(15);
    setRecurrenceType('daily');
    setRecurrenceDays([0, 1, 2, 3, 4, 5, 6]);

    setTitle('');
    setDescription('');
    setCategory('Custom activity');
    setPriority('medium');
    setReminderEnabled(true);
    setNotificationMessage('');
    setCompletionMessage('Great job! Every small step counts towards your wellbeing.');
  };

  const openCreateModal = (presetTime?: string) => {
    resetForm(presetTime);
    setIsModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setLocalTime(task.local_time || '08:00');
    setDurationMinutes(task.duration_minutes || 15);
    setRecurrenceType(task.recurrence_type || 'daily');
    setRecurrenceDays(task.recurrence_days || [0, 1, 2, 3, 4, 5, 6]);

    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category || 'Custom activity');
    setPriority(task.priority || 'medium');
    setReminderEnabled(task.reminder_enabled !== false);
    setNotificationMessage(task.notification_message || '');
    setCompletionMessage(
      task.completion_message || 'Great job! Every small step counts towards your wellbeing.'
    );
    setIsModalOpen(true);
  };

  const handleDuplicateTask = async (task: any) => {
    try {
      const dupData = {
        title: `${task.title} (Copy)`,
        description: task.description,
        category: task.category,
        local_time: task.local_time,
        timezone: task.timezone,
        recurrence_type: task.recurrence_type,
        recurrence_days: task.recurrence_days,
        duration_minutes: task.duration_minutes,
        reminder_enabled: task.reminder_enabled,
        notification_message: task.notification_message,
        completion_message: task.completion_message,
        priority: task.priority,
        enabled: task.enabled,
      };
      const res = await api.createTask(dupData);
      setTasks((prev) =>
        [...prev, res.task].sort((a, b) => a.local_time.localeCompare(b.local_time))
      );
      showToast('Scheduled task duplicated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate task', 'error');
    }
  };

  const handleToggleEnabled = async (task: any) => {
    try {
      const updatedEnabled = !task.enabled;
      await api.updateTask(task.id, { enabled: updatedEnabled });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, enabled: updatedEnabled } : t))
      );
      showToast(updatedEnabled ? 'Scheduled routine enabled' : 'Scheduled routine paused', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update routine state', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      showToast('Activity removed from schedule', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete activity', 'error');
    }
  };

  const toggleDay = (day: number) => {
    if (recurrenceDays.includes(day)) {
      if (recurrenceDays.length > 1) {
        setRecurrenceDays(recurrenceDays.filter((d) => d !== day));
      }
    } else {
      setRecurrenceDays([...recurrenceDays, day].sort());
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter an activity title', 'error');
      return;
    }
    if (!localTime) {
      showToast('Please select a scheduled time', 'error');
      return;
    }

    setSubmitting(true);
    const taskPayload = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      local_time: localTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      recurrence_type: recurrenceType,
      recurrence_days: recurrenceDays,
      duration_minutes: Number(durationMinutes) || 15,
      reminder_enabled: reminderEnabled,
      notification_message: notificationMessage.trim() || null,
      completion_message: completionMessage.trim(),
      priority,
    };

    try {
      if (editingTask) {
        const res = await api.updateTask(editingTask.id, taskPayload);
        setTasks((prev) =>
          prev
            .map((t) => (t.id === editingTask.id ? res.task : t))
            .sort((a, b) => a.local_time.localeCompare(b.local_time))
        );
        showToast('Timetable schedule updated!', 'success');
      } else {
        const res = await api.createTask(taskPayload);
        setTasks((prev) =>
          [...prev, res.task].sort((a, b) => a.local_time.localeCompare(b.local_time))
        );
        showToast(`Scheduled "${res.task.title}" for ${format12Hour(localTime)}!`, 'success');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Failed to save timetable activity', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const res = await api.seedDefaultRoutine(
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      );
      showToast(`Loaded starter timetable with ${res.count} daily routines!`, 'success');
      loadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to seed starter routine', 'error');
    }
  };

  const tasksByPeriod = useMemo(() => {
    const map: Record<string, any[]> = {
      early_morning: [],
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };

    tasks.forEach((t) => {
      const period = getPeriodForTime(t.local_time);
      map[period.id].push(t);
    });

    return map;
  }, [tasks]);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const formattedCurrentTime = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const upcomingActivity = useMemo(() => {
    if (tasks.length === 0) return null;

    for (const t of tasks) {
      if (!t.enabled) continue;
      const [hStr, mStr] = t.local_time.split(':');
      const start = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
      const end = start + (t.duration_minutes || 15);
      if (currentMinutes >= start && currentMinutes <= end) {
        return { type: 'active', task: t };
      }
    }

    for (const t of tasks) {
      if (!t.enabled) continue;
      const [hStr, mStr] = t.local_time.split(':');
      const start = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
      if (start > currentMinutes) {
        return { type: 'next', task: t };
      }
    }

    const firstActive = tasks.find((t) => t.enabled);
    if (firstActive) {
      return { type: 'tomorrow', task: firstActive };
    }
    return null;
  }, [tasks, currentMinutes]);

  const hourlySlots = useMemo(() => {
    const slots = [];
    for (let h = 5; h <= 23; h++) {
      const hourStr = h.toString().padStart(2, '0');
      const timeSlotKey = `${hourStr}:00`;
      const matchingTasks = tasks.filter((t) => {
        const taskHour = parseInt(t.local_time.split(':')[0], 10);
        return taskHour === h;
      });
      slots.push({
        hour: h,
        timeStr: timeSlotKey,
        label: format12Hour(timeSlotKey),
        tasks: matchingTasks,
      });
    }
    return slots;
  }, [tasks]);

  const filteredPeriods =
    selectedPeriodFilter === 'all'
      ? TIME_PERIODS
      : TIME_PERIODS.filter((p) => p.id === selectedPeriodFilter);

  const getCategoryMeta = (catId: string) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
  };

  const handleTestReminder = () => {
    const activeOrFirst = tasks.find((t) => t.enabled) || tasks[0];
    const testTask = activeOrFirst || {
      id: 'demo-reminder',
      title: 'Water & Mindful Breathing Break',
      category: 'Drink water',
      local_time: formattedCurrentTime,
      duration_minutes: 5,
      notification_message: 'Time for a wellness break! Drink water and take 5 deep breaths.',
      completion_message: 'Wonderful! You just recharged your body and mind.',
      reminder_enabled: true,
      enabled: true,
    };
    triggerLiveReminder(testTask);
    showToast(`Showing live reminder dialog for "${testTask.title}"`, 'info');
  };

  const currentPeriod = getPeriodForTime(localTime);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <CalendarClock className="w-4 h-4" />
            <span>Time-Centric Timetable Builder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Daily Schedule by Time
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Structured strictly by time: see exactly what routine is scheduled for every hour and part of your day.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestReminder}
            leftIcon={<Bell className="w-4 h-4 text-amber-500 animate-pulse" />}
            className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
            title="Preview how on-screen reminders look and chime"
          >
            Test Screen Reminder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDefaults}
            leftIcon={<RefreshCw className="w-4 h-4 text-brand-600" />}
          >
            Load Starter Routine
          </Button>
          <Button
            size="sm"
            onClick={() => openCreateModal()}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Activity to Timetable
          </Button>
        </div>
      </div>

      {/* Screen Reminder & Notification Permission Alert */}
      {permission !== 'granted' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                Get reminders on your screen at the scheduled time
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                Keep LifeCare open in your browser. Reminders will pop up on your screen with an audio chime the moment each activity is due.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={requestPermission}
            className="text-xs shrink-0 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
          >
            Enable Browser Alerts
          </Button>
        </div>
      )}

      {/* Real-time Time & "Next Up" Live Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent border border-brand-500/20 dark:border-brand-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex flex-col items-center justify-center shrink-0 shadow-soft">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current Time
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold">
                {format12Hour(formattedCurrentTime)} ({formattedCurrentTime})
              </span>
            </div>
            {upcomingActivity ? (
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {upcomingActivity.type === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Happening Now:
                    </span>
                  ) : upcomingActivity.type === 'next' ? (
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Next Scheduled:
                    </span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Tomorrow's First:
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                  {format12Hour(upcomingActivity.task.local_time)}
                </span>
                <span className="text-sm text-slate-800 dark:text-slate-200 font-semibold">
                  — {upcomingActivity.task.title}
                </span>
                <span className="text-xs text-slate-400">
                  ({upcomingActivity.task.duration_minutes} min)
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">No activities scheduled yet</p>
            )}
          </div>
        </div>

        {/* Quick Stats summary */}
        <div className="flex items-center gap-3 text-xs self-start md:self-center">
          <div className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Total:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">{tasks.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {tasks.filter((t) => t.enabled).length}
            </span>
          </div>
        </div>
      </div>

      {/* Format Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        {/* Format Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 self-start">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'timeline'
                ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-soft'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Time-Slot Timeline</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-soft'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Timetable Grid</span>
          </button>
          <button
            onClick={() => setViewMode('hourly')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'hourly'
                ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-soft'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>24-Hour Day Planner</span>
          </button>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedPeriodFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedPeriodFilter === 'all'
                ? 'bg-brand-600 text-white shadow-xs font-semibold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            All Periods ({tasks.length})
          </button>
          {TIME_PERIODS.map((period) => {
            const count = tasksByPeriod[period.id]?.length || 0;
            return (
              <button
                key={period.id}
                onClick={() => setSelectedPeriodFilter(period.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedPeriodFilter === period.id
                    ? 'bg-brand-600 text-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <period.icon className="w-3 h-3" />
                <span>{period.label.split(' ')[0]}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-10 h-10 text-brand-500" />}
          title="Your daily timetable is empty"
          description="Build your structured daily schedule. Set what routine takes place at each time of the day, or load our starter wellness routine."
          actionText="Add First Scheduled Activity"
          onAction={() => openCreateModal('07:00')}
        />
      ) : (
        <>
          {/* FORMAT 1: TIMELINE */}
          {viewMode === 'timeline' && (
            <div className="space-y-8">
              {filteredPeriods.map((period) => {
                const periodTasks = tasksByPeriod[period.id] || [];

                return (
                  <div key={period.id} className="space-y-3.5">
                    {/* Period Header Banner */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-soft">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-950/60 ${period.textClass} border border-brand-200/50 dark:border-brand-800/40`}
                        >
                          <period.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                              {period.label}
                            </h2>
                            <Badge variant={period.badgeVariant} size="sm">
                              {period.range}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {periodTasks.length === 1
                              ? '1 activity scheduled'
                              : `${periodTasks.length} activities scheduled`}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openCreateModal(period.defaultTime)}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                      >
                        + Schedule in {period.label.split(' ')[0]}
                      </Button>
                    </div>

                    {periodTasks.length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <span>No routines scheduled for {period.label.toLowerCase()} ({period.range}).</span>
                        <button
                          onClick={() => openCreateModal(period.defaultTime)}
                          className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                        >
                          Schedule one now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 relative before:absolute before:inset-y-3 before:left-[4.5rem] sm:before:left-[5.5rem] before:w-0.5 before:bg-brand-200/60 dark:before:bg-brand-900/40 before:hidden sm:before:block">
                        {periodTasks.map((task) => {
                          const catMeta = getCategoryMeta(task.category);
                          const CatIcon = catMeta.icon;
                          const endTime = getEndTime(task.local_time, task.duration_minutes);
                          const formattedStart = format12Hour(task.local_time);

                          return (
                            <Card
                              key={task.id}
                              className={`p-4 sm:p-5 transition-all duration-200 hover:shadow-soft-lg ${
                                !task.enabled
                                  ? 'opacity-60 bg-slate-50/80 dark:bg-slate-900/40'
                                  : 'bg-white dark:bg-slate-900'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  {/* Prominent Time Slot Block */}
                                  <div className="w-24 sm:w-28 rounded-2xl bg-gradient-to-b from-brand-50 to-brand-100/50 dark:from-brand-950/60 dark:to-brand-900/30 text-brand-800 dark:text-brand-200 p-2.5 flex flex-col items-center justify-center shrink-0 border border-brand-200/60 dark:border-brand-800/40 shadow-xs">
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                                      <Clock className="w-3 h-3" />
                                      <span>Time Slot</span>
                                    </div>
                                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                                      {formattedStart}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                      to {endTime}
                                    </span>
                                    <div className="mt-1 px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                      {task.duration_minutes} mins
                                    </div>
                                  </div>

                                  {/* Scheduled Activity Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                                        {task.title}
                                      </h3>

                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                                        <CatIcon className="w-3 h-3" />
                                        {task.category}
                                      </span>

                                      <Badge
                                        variant={
                                          task.priority === 'high'
                                            ? 'rose'
                                            : task.priority === 'low'
                                            ? 'slate'
                                            : 'amber'
                                        }
                                        size="sm"
                                      >
                                        {task.priority}
                                      </Badge>

                                      {!task.enabled && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                                          Paused
                                        </span>
                                      )}
                                    </div>

                                    {task.description && (
                                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                        {task.description}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap mt-1">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        {task.recurrence_type === 'daily'
                                          ? 'Daily schedule'
                                          : task.recurrence_type === 'weekdays'
                                          ? 'Weekdays (Mon–Fri)'
                                          : task.recurrence_type === 'weekends'
                                          ? 'Weekends (Sat–Sun)'
                                          : 'Selected days'}
                                      </span>

                                      {task.reminder_enabled ? (
                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                          <Bell className="w-3.5 h-3.5" /> Reminder set for {formattedStart}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 flex items-center gap-1">
                                          <Bell className="w-3.5 h-3.5" /> No alert
                                        </span>
                                      )}
                                    </div>

                                    {task.completion_message && (
                                      <div className="mt-2.5 p-2.5 rounded-xl bg-sand-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2 text-xs">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span className="text-slate-600 dark:text-slate-300 italic font-medium">
                                          "{task.completion_message}"
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 self-end md:self-center shrink-0">
                                  <button
                                    onClick={() => {
                                      triggerLiveReminder(task);
                                      showToast(`Triggered test alert for "${task.title}"`, 'info');
                                    }}
                                    className="p-2 text-slate-400 hover:text-amber-500 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                                    title="Test On-Screen Reminder for this Routine"
                                  >
                                    <Bell className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleEnabled(task)}
                                    className={`p-2 rounded-xl transition-colors ${
                                      task.enabled
                                        ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                    title={task.enabled ? 'Pause Routine' : 'Activate Routine'}
                                  >
                                    <Power className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateTask(task)}
                                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Duplicate Task"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openEditModal(task)}
                                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Edit Task"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(task.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {deleteConfirmId === task.id && (
                                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                                  <span className="text-rose-800 dark:text-rose-200 font-medium">
                                    Are you sure you want to remove "{task.title}" at {formattedStart} from your schedule?
                                  </span>
                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeleteConfirmId(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      onClick={() => handleDeleteTask(task.id)}
                                    >
                                      Delete Activity
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* FORMAT 2: TABLE */}
          {viewMode === 'table' && (
            <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 w-44">Time Slot</th>
                      <th className="py-3.5 px-4">Scheduled Activity</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Frequency</th>
                      <th className="py-3.5 px-4">Alert & Encouragement</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tasks.map((task) => {
                      const catMeta = getCategoryMeta(task.category);
                      const CatIcon = catMeta.icon;
                      const formattedStart = format12Hour(task.local_time);
                      const endTime = getEndTime(task.local_time, task.duration_minutes);

                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            !task.enabled ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {formattedStart}
                              </span>
                              <span className="text-slate-400 text-xs">➔</span>
                              <span className="text-xs text-slate-500">{endTime}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {task.local_time} (24h)
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                              <CatIcon className="w-3 h-3" />
                              {task.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                            {task.duration_minutes} mins
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {task.recurrence_type === 'daily'
                              ? 'Daily'
                              : task.recurrence_type === 'weekdays'
                              ? 'Mon – Fri'
                              : task.recurrence_type === 'weekends'
                              ? 'Sat – Sun'
                              : 'Custom Days'}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              {task.reminder_enabled ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <Bell className="w-3 h-3" /> Enabled
                                </span>
                              ) : (
                                <span className="text-slate-400">Off</span>
                              )}
                            </div>
                            {task.completion_message && (
                              <div className="text-[11px] text-slate-400 italic truncate mt-0.5">
                                "{task.completion_message}"
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  triggerLiveReminder(task);
                                  showToast(`Triggered test alert for "${task.title}"`, 'info');
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                title="Test Reminder"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleEnabled(task)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  task.enabled
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title={task.enabled ? 'Pause' : 'Activate'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* FORMAT 3: 24-HOUR PLANNER */}
          {viewMode === 'hourly' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-medium px-1">
                Hour-by-hour daily timetable grid. Click any time slot to schedule an activity at that hour.
              </div>

              <div className="space-y-2.5">
                {hourlySlots.map((slot) => {
                  const hasTasks = slot.tasks.length > 0;

                  return (
                    <div
                      key={slot.hour}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        hasTasks
                          ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-soft'
                          : 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-400'
                      }`}
                    >
                      <div className="w-28 flex items-center gap-2.5 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-brand-500" />
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                            {slot.label}
                          </span>
                          <span className="text-[10px] text-slate-400">{slot.timeStr} (24h)</span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-wrap gap-2.5 items-center">
                        {hasTasks ? (
                          slot.tasks.map((task) => {
                            const catMeta = getCategoryMeta(task.category);
                            const CatIcon = catMeta.icon;
                            return (
                              <div
                                key={task.id}
                                className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                                  task.enabled
                                    ? 'bg-brand-50/60 dark:bg-brand-950/40 border-brand-200/60 dark:border-brand-800/40 text-slate-900 dark:text-white'
                                    : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500'
                                }`}
                              >
                                <CatIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                                <span className="font-bold">{task.title}</span>
                                <span className="text-[11px] text-slate-400">
                                  ({format12Hour(task.local_time)} • {task.duration_minutes}m)
                                </span>
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            No activities scheduled for this hour
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openCreateModal(slot.timeStr)}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-brand-600 self-end md:self-center"
                      >
                        + Schedule at {slot.label}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* 2-COLUMN STRUCTURE FOR ASKING SCHEDULE                   */}
      {/* COLUMN 1: TIME  |  COLUMN 2: ACTIVITY AT THIS TIME       */}
      {/* ======================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Scheduled Activity' : 'Add Activity to Timetable'}
        description="Divided into two columns: Set the scheduled time on the left, and describe the activity at that time on the right."
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveTask} className="space-y-6">
          {/* Top Live Sync Pill Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-brand-500/10 via-emerald-500/5 to-transparent border border-brand-500/20 dark:border-brand-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Scheduled Slot:
              </span>
              <span className="font-extrabold text-brand-700 dark:text-brand-300">
                {format12Hour(localTime)} – {getEndTime(localTime, durationMinutes)}
              </span>
              <span className="text-slate-400">({durationMinutes} min • {currentPeriod.label})</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Activity:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {title.trim() ? title.trim() : '(Enter title in Column 2)'}
              </span>
            </div>
          </div>

          {/* TWO EQUAL COLUMNS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* =================================================== */}
            {/* COLUMN 1: TIME (FOR WHAT TIME?)                     */}
            {/* =================================================== */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 space-y-4">
              {/* Column 1 Title */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 flex items-center justify-center font-extrabold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-600" />
                      <span>COLUMN 1: TIME</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      For what time is this routine scheduled?
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                  {format12Hour(localTime)}
                </span>
              </div>

              {/* Exact Time Input & 12h Display */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Start Time *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    required
                    value={localTime}
                    onChange={(e) => setLocalTime(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-extrabold focus:ring-2 focus:ring-brand-500 outline-none shadow-xs"
                  />
                  <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-brand-700 dark:text-brand-300 shrink-0">
                    {format12Hour(localTime)}
                  </div>
                </div>
              </div>

              {/* Quick Time Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Quick Time Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {QUICK_TIME_PRESETS.map((preset) => {
                    const PresetIcon = preset.icon;
                    const isSelected = localTime === preset.time;
                    return (
                      <button
                        key={preset.time}
                        type="button"
                        onClick={() => setLocalTime(preset.time)}
                        className={`p-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <PresetIcon className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="truncate">{preset.label}</span>
                        <span className="text-[10px] opacity-70 ml-auto">{preset.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration in Minutes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Duration:
                  </label>
                  <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">
                    {durationMinutes} minutes
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {DURATION_PRESETS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        durationMinutes === mins
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 15)}
                    className="w-16 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="Custom"
                  />
                </div>
              </div>

              {/* Recurrence Schedule */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  When Does It Repeat?
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'daily', label: 'Every Day' },
                    { id: 'weekdays', label: 'Weekdays (Mon–Fri)' },
                    { id: 'weekends', label: 'Weekends (Sat–Sun)' },
                    { id: 'selected_days', label: 'Custom Days' },
                  ].map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setRecurrenceType(rec.id)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        recurrenceType === rec.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>

                {recurrenceType === 'selected_days' && (
                  <div className="mt-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-1 justify-between">
                    {WEEKDAYS.map((w) => {
                      const isSelected = recurrenceDays.includes(w.day);
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleDay(w.day)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* =================================================== */}
            {/* COLUMN 2: ACTIVITY AT THIS TIME                     */}
            {/* =================================================== */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 space-y-4">
              {/* Column 2 Title */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-extrabold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span>COLUMN 2: ACTIVITY AT THIS TIME</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      What is the activity scheduled at {format12Hour(localTime)}?
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {category}
                </span>
              </div>

              {/* Activity Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midday Hydration, Morning Walk, Reading"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none shadow-xs"
                />
              </div>

              {/* Category Selection Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Activity Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2 rounded-xl text-xs font-medium border text-left flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Goal / Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 500ml water or 15 pushups"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none shadow-xs"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              {/* Reminders & Notification Alert */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reminder_toggle_2col"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 accent-brand-600"
                  />
                  <label
                    htmlFor="reminder_toggle_2col"
                    className="text-xs text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Send browser reminder alert at {format12Hour(localTime)}
                  </label>
                </div>

                {reminderEnabled && (
                  <input
                    type="text"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder={`e.g. LifeCare AI — Time for ${title || 'your scheduled activity'} at ${format12Hour(localTime)}!`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                )}
              </div>

              {/* Personalized Encouragement Words */}
              <div className="p-3 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/70 dark:border-brand-900/40">
                <label className="block text-xs font-bold text-brand-900 dark:text-brand-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Encouragement Words *
                </label>
                <textarea
                  required
                  rows={2}
                  value={completionMessage}
                  onChange={(e) => setCompletionMessage(e.target.value)}
                  placeholder="e.g. Great job! Every small step counts towards your wellbeing."
                  className="w-full px-3 py-1.5 rounded-xl border border-brand-300 dark:border-brand-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 hidden sm:block">
              {title ? (
                <span>
                  Ready to schedule <strong className="text-slate-900 dark:text-white">{title}</strong> for <strong className="text-brand-600 dark:text-brand-400">{format12Hour(localTime)}</strong>.
                </span>
              ) : (
                <span>Set time in Column 1 and activity title in Column 2.</span>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                {editingTask ? 'Save Timetable Changes' : 'Schedule Activity'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
