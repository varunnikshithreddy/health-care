import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressRing } from '../components/ui/ProgressRing';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import {
  CheckCircle2,
  Clock,
  Droplets,
  Utensils,
  Plus,
  ScanLine,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Bell,
  Heart,
  ChevronRight,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showEncouragement, showToast, permission, requestPermission } = useNotification();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [waterTotal, setWaterTotal] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [servingSize, setServingSize] = useState(250);
  const [meals, setMeals] = useState<any[]>([]);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const today = new Date().toISOString().substring(0, 10);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const loadDashboardData = async () => {
    try {
      const [tRes, cRes, wGoalRes, wEntriesRes, mRes] = await Promise.all([
        api.getTasks(),
        api.getCompletions(today),
        api.getWaterGoal(),
        api.getWaterEntries(today),
        api.getMeals(today),
      ]);

      setTasks(tRes.tasks || []);
      setCompletions(cRes.completions || []);
      if (wGoalRes.goal) {
        setWaterGoal(wGoalRes.goal.daily_goal_ml || 2000);
        setServingSize(wGoalRes.goal.preferred_serving_ml || 250);
      }
      setWaterTotal(wEntriesRes.total_ml || 0);
      setMeals(mRes.meals || []);
    } catch (err: any) {
      console.warn('Dashboard load warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    try {
      const res = await api.completeTask(taskId, {
        occurrence_date: today,
        status: 'completed',
      });

      if (res.success) {
        // Update local completions state
        setCompletions((prev) => {
          const filtered = prev.filter((c) => c.task_id !== taskId);
          return [...filtered, res.completion];
        });

        // Trigger user's personalized encouragement message
        showEncouragement(
          res.encouragement_message,
          res.task_title,
          profile?.encouragement_display_mode || 'toast'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to complete task', 'error');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleRevertTask = async (taskId: string) => {
    try {
      await api.revertCompletion(taskId, today);
      setCompletions((prev) => prev.filter((c) => c.task_id !== taskId));
      showToast('Task marked incomplete', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to revert task', 'error');
    }
  };

  const handleQuickWater = async () => {
    try {
      await api.addWaterEntry({ quantity_ml: servingSize, local_date: today });
      setWaterTotal((prev) => prev + servingSize);
      showToast(`+${servingSize} mL water recorded! Keep staying hydrated.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to log water', 'error');
    }
  };

  // Metrics
  const activeTasks = tasks.filter((t) => t.enabled);
  const completedTaskIds = new Set(
    completions.filter((c) => c.status === 'completed').map((c) => c.task_id)
  );
  const completedCount = activeTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const totalTasksCount = activeTasks.length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;
  const waterPercentage = Math.min(100, Math.round((waterTotal / waterGoal) * 100));

  const greetingName = profile?.display_name || 'Friend';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Greeting & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Welcome back, {greetingName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            You're leading your daily rhythm with mindfulness and intention.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleQuickWater}
            leftIcon={<Droplets className="w-4 h-4 text-sky-500" />}
          >
            +{servingSize} mL Water
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/food-scanner')}
            leftIcon={<ScanLine className="w-4 h-4 text-emerald-500" />}
          >
            Scan Food
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/schedule')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Notification Banner if permission is not yet granted */}
      {permission !== 'granted' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Gentle Routine Notifications are Disabled
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Allow browser notifications so your scheduled water and meal reminders arrive right on time.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => requestPermission()}>
            Enable Reminders
          </Button>
        </div>
      )}

      {/* Daily Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Routine Ring Card */}
        <Card className="flex items-center justify-between p-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Routine Progress
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {completedCount} <span className="text-sm font-medium text-slate-400">/ {totalTasksCount} tasks</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {completionPercentage >= 100
                ? '🌟 All activities completed today!'
                : `${totalTasksCount - completedCount} activities remaining`}
            </p>
          </div>
          <ProgressRing percentage={completionPercentage} size={90} strokeWidth={9} />
        </Card>

        {/* Water Ring Card */}
        <Card className="flex items-center justify-between p-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Hydration Intake
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {waterTotal} <span className="text-sm font-medium text-slate-400">/ {waterGoal} mL</span>
            </div>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mt-2">
              {waterPercentage}% of today's hydration target
            </p>
          </div>
          <ProgressRing
            percentage={waterPercentage}
            size={90}
            strokeWidth={9}
            color="#0ea5e9"
          />
        </Card>

        {/* Nutrition Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Meals Logged
              </span>
              <Utensils className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {meals.length} <span className="text-sm font-medium text-slate-400">entries</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
              <span>
                🔥{' '}
                {Math.round(
                  meals.reduce((sum, m) => sum + (Number(m.estimated_calories_kcal) || 0), 0)
                )}{' '}
                kcal est.
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">AI Food Scanner</span>
            <button
              onClick={() => navigate('/meals')}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline inline-flex items-center"
            >
              View Meals <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* Today's Schedule Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Today's Schedule & Habits
            </h2>
            <p className="text-xs text-slate-500">
              Mark tasks completed as you proceed. Your custom encouragement will appear instantly.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/schedule')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Manage Timetable
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : activeTasks.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-7 h-7" />}
            title="No activities on your timetable yet"
            description="You haven't added any activities yet. Create your first reminder to begin your personalized routine."
            actionText="Create Schedule Now"
            onAction={() => navigate('/schedule')}
          />
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => {
              const isCompleted = completedTaskIds.has(task.id);
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200/50 dark:border-brand-900/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-soft-lg'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() =>
                        isCompleted ? handleRevertTask(task.id) : handleCompleteTask(task.id)
                      }
                      disabled={completingTaskId === task.id}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        isCompleted
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'border-2 border-slate-300 dark:border-slate-700 hover:border-brand-500 text-transparent'
                      }`}
                      aria-label={isCompleted ? 'Mark incomplete' : 'Complete task'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {task.local_time}
                        </span>
                        <Badge variant="green" size="sm">
                          {task.category}
                        </Badge>
                        {isCompleted && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Completed ✓
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-sm font-semibold mt-1 ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      {/* Display user's configured encouragement if completed */}
                      {isCompleted && task.completion_message && (
                        <div className="mt-2 text-xs italic text-brand-700 dark:text-brand-300 bg-brand-50/80 dark:bg-brand-950/60 px-3 py-1.5 rounded-xl border border-brand-200/40 dark:border-brand-900/40 inline-flex items-center gap-1.5">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                          <span>"{task.completion_message}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isCompleted ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevertTask(task.id)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Undo
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(task.id)}
                        isLoading={completingTaskId === task.id}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
