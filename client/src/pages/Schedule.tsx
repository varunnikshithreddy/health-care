import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

const CATEGORIES = [
  'Wake up',
  'Drink water',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Exercise',
  'Stretching',
  'Study',
  'Relaxation',
  'Sleep',
  'Personal care',
  'Custom activity',
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

export const Schedule: React.FC = () => {
  const { showToast } = useNotification();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom activity');
  const [localTime, setLocalTime] = useState('08:00');
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [completionMessage, setCompletionMessage] = useState(
    'Great job! Every small step counts towards your wellbeing.'
  );
  const [priority, setPriority] = useState('medium');

  const loadTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const resetForm = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('Custom activity');
    setLocalTime('08:00');
    setRecurrenceType('daily');
    setRecurrenceDays([0, 1, 2, 3, 4, 5, 6]);
    setDurationMinutes(15);
    setReminderEnabled(true);
    setNotificationMessage('');
    setCompletionMessage('Great job! Every small step counts towards your wellbeing.');
    setPriority('medium');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category || 'Custom activity');
    setLocalTime(task.local_time || '08:00');
    setRecurrenceType(task.recurrence_type || 'daily');
    setRecurrenceDays(task.recurrence_days || [0, 1, 2, 3, 4, 5, 6]);
    setDurationMinutes(task.duration_minutes || 15);
    setReminderEnabled(task.reminder_enabled !== false);
    setNotificationMessage(task.notification_message || '');
    setCompletionMessage(task.completion_message || 'Great job! Every small step counts towards your wellbeing.');
    setPriority(task.priority || 'medium');
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
      setTasks((prev) => [...prev, res.task].sort((a, b) => a.local_time.localeCompare(b.local_time)));
      showToast('Task duplicated successfully', 'success');
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
      showToast(updatedEnabled ? 'Task routine activated' : 'Task routine paused', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update task state', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      showToast('Task removed from schedule', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
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
      showToast('Please enter a task title', 'error');
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
      duration_minutes: Number(durationMinutes),
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
        showToast('Schedule task updated!', 'success');
      } else {
        const res = await api.createTask(taskPayload);
        setTasks((prev) =>
          [...prev, res.task].sort((a, b) => a.local_time.localeCompare(b.local_time))
        );
        showToast('New activity added to your timetable!', 'success');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Failed to save task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const res = await api.seedDefaultRoutine(
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      );
      showToast(`Added ${res.count} routine starter templates!`, 'success');
      loadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to seed templates', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Personal Timetable Builder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Daily Schedule & Routines
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            You set the hours, notification messages, and words of encouragement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDefaults}
            leftIcon={<RefreshCw className="w-4 h-4 text-brand-600" />}
          >
            Load Starter Routine
          </Button>
          <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Add Custom Task
          </Button>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-8 h-8" />}
          title="Your timetable is blank"
          description="Create your first custom reminder, or load our starter wellness routine to customize it to your rhythm."
          actionText="Create Activity"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className={`p-5 transition-all duration-200 ${
                !task.enabled ? 'opacity-60 bg-slate-50/80 dark:bg-slate-900/40' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex flex-col items-center justify-center shrink-0 border border-brand-200/50 dark:border-brand-800/40">
                    <Clock className="w-4 h-4 mb-0.5" />
                    <span className="text-xs font-bold">{task.local_time}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {task.title}
                      </h3>
                      <Badge variant="green" size="sm">
                        {task.category}
                      </Badge>
                      <Badge variant={task.priority === 'high' ? 'rose' : task.priority === 'low' ? 'slate' : 'amber'} size="sm">
                        {task.priority}
                      </Badge>
                      {!task.enabled && (
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          (Paused)
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {task.recurrence_type === 'daily'
                          ? 'Every day'
                          : task.recurrence_type === 'weekdays'
                          ? 'Mon - Fri'
                          : task.recurrence_type === 'weekends'
                          ? 'Weekends'
                          : 'Selected days'}
                      </span>
                      {task.reminder_enabled ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Bell className="w-3.5 h-3.5" /> Reminders on
                        </span>
                      ) : (
                        <span className="text-slate-400">Reminders off</span>
                      )}
                      <span>{task.duration_minutes} min duration</span>
                    </div>

                    {/* Completion message quote */}
                    <div className="mt-3 p-2.5 rounded-xl bg-sand-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300 italic">
                        "{task.completion_message}"
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
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

              {/* Inline Delete Confirmation */}
              {deleteConfirmId === task.id && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-xs">
                  <span className="text-rose-800 dark:text-rose-200 font-medium">
                    Are you sure you want to remove this activity from your schedule?
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteTask(task.id)}>
                      Confirm Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Task Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Scheduled Activity' : 'Add Activity to Timetable'}
        description="Configure your timing, reminder alert text, and personalized celebration message."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Activity Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midday Hydration, Morning Walk, Reading"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Scheduled Time (24h) *
              </label>
              <input
                type="time"
                required
                value={localTime}
                onChange={(e) => setLocalTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Recurrence Schedule
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'daily', label: 'Daily' },
                { id: 'weekdays', label: 'Weekdays' },
                { id: 'weekends', label: 'Weekends' },
                { id: 'selected_days', label: 'Custom Days' },
              ].map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setRecurrenceType(rec.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                    recurrenceType === rec.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {rec.label}
                </button>
              ))}
            </div>
          </div>

          {recurrenceType === 'selected_days' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-2">
                Active Weekdays:
              </span>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((w) => {
                  const isSelected = recurrenceDays.includes(w.day);
                  return (
                    <button
                      key={w.day}
                      type="button"
                      onClick={() => toggleDay(w.day)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Custom Notification Message (Optional)
            </label>
            <input
              type="text"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="e.g. LifeCare AI — Time for your water break. Take a moment for yourself."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-900/40">
            <label className="block text-xs font-bold text-brand-900 dark:text-brand-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Personalized Encouragement Words *
            </label>
            <textarea
              required
              rows={2}
              value={completionMessage}
              onChange={(e) => setCompletionMessage(e.target.value)}
              placeholder="e.g. Well done! I am staying consistent with my goals."
              className="w-full px-3.5 py-2 rounded-xl border border-brand-300 dark:border-brand-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <p className="text-[11px] text-brand-700 dark:text-brand-300 mt-1">
              This exact message will appear when you mark this task complete.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="reminder_toggle"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 accent-brand-600"
            />
            <label htmlFor="reminder_toggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Enable browser reminder at scheduled time
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              {editingTask ? 'Save Changes' : 'Create Activity'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
