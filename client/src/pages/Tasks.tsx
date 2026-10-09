import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Heart,
  FastForward,
  Filter,
} from 'lucide-react';

export const Tasks: React.FC = () => {
  const { profile } = useAuth();
  const { showEncouragement, showToast } = useNotification();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'skipped'>('all');
  const [completingId, setCompletingId] = useState<string | null>(null);

  const today = new Date().toISOString().substring(0, 10);

  const loadData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        api.getTasks(),
        api.getCompletions(today),
      ]);
      setTasks(tRes.tasks || []);
      setCompletions(cRes.completions || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load task records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleComplete = async (task: any) => {
    setCompletingId(task.id);
    try {
      const res = await api.completeTask(task.id, {
        occurrence_date: today,
        status: 'completed',
      });
      if (res.success) {
        setCompletions((prev) => {
          const filtered = prev.filter((c) => c.task_id !== task.id);
          return [...filtered, res.completion];
        });
        showEncouragement(
          res.encouragement_message,
          task.title,
          profile?.encouragement_display_mode || 'toast'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to record completion', 'error');
    } finally {
      setCompletingId(null);
    }
  };

  const handleSkip = async (task: any) => {
    try {
      const res = await api.completeTask(task.id, {
        occurrence_date: today,
        status: 'skipped',
        notes: 'Skipped for today',
      });
      setCompletions((prev) => {
        const filtered = prev.filter((c) => c.task_id !== task.id);
        return [...filtered, res.completion];
      });
      showToast(`"${task.title}" skipped for today. Wellness is about listening to your needs.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleRevert = async (taskId: string) => {
    try {
      await api.revertCompletion(taskId, today);
      setCompletions((prev) => prev.filter((c) => c.task_id !== taskId));
      showToast('Status reverted to pending', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to revert status', 'error');
    }
  };

  const completionMap = new Map(completions.map((c) => [c.task_id, c]));

  const filteredTasks = tasks.filter((task) => {
    if (!task.enabled) return false;
    const c = completionMap.get(task.id);
    const status = c?.status || 'pending';

    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return status === 'completed';
    if (filterStatus === 'skipped') return status === 'skipped';
    if (filterStatus === 'pending') return status === 'pending';
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Habit & Activity Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Today's Activities
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Complete, skip, or postpone at your own pace without pressure.
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-center">
          {(['all', 'pending', 'completed', 'skipped'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filterStatus === st
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8" />}
          title={`No ${filterStatus !== 'all' ? filterStatus : ''} activities found`}
          description="Everything is balanced. Check your Schedule Builder to adjust recurring tasks."
        />
      ) : (
        <div className="space-y-3.5">
          {filteredTasks.map((task) => {
            const completion = completionMap.get(task.id);
            const status = completion?.status || 'pending';

            return (
              <Card
                key={task.id}
                className={`p-5 transition-all duration-200 ${
                  status === 'completed'
                    ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200/60 dark:border-brand-900/40'
                    : status === 'skipped'
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                    : 'bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex flex-col items-center justify-center shrink-0 border border-brand-200/40">
                      <Clock className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-xs font-bold">{task.local_time}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`font-bold text-base ${status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {task.title}
                        </h3>
                        <Badge variant="green" size="sm">
                          {task.category}
                        </Badge>
                        {status === 'completed' && (
                          <Badge variant="green" size="sm">
                            Completed ✓
                          </Badge>
                        )}
                        {status === 'skipped' && (
                          <Badge variant="slate" size="sm">
                            Skipped
                          </Badge>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          {task.description}
                        </p>
                      )}

                      {/* Display configured encouragement message */}
                      {status === 'completed' && task.completion_message && (
                        <div className="mt-2 p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200/50 dark:border-brand-800/40 inline-flex items-center gap-2 text-xs">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
                          <span className="text-brand-800 dark:text-brand-200 italic font-medium">
                            "{task.completion_message}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {status === 'completed' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevert(task.id)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Reopen
                      </Button>
                    ) : status === 'skipped' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevert(task.id)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Undo Skip
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSkip(task)}
                          leftIcon={<FastForward className="w-3.5 h-3.5" />}
                          className="text-xs text-slate-500"
                        >
                          Skip
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleComplete(task)}
                          isLoading={completingId === task.id}
                          leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                          Mark Complete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
