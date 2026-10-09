import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Droplets,
  Plus,
  Trash2,
  Settings2,
  Clock,
  Sparkles,
  Calendar,
  Check,
} from 'lucide-react';

export const Water: React.FC = () => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(2000);
  const [servingSize, setServingSize] = useState(250);
  const [totalMl, setTotalMl] = useState(0);
  const [entries, setEntries] = useState<any[]>([]);
  const [customMl, setCustomMl] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState(2000);
  const [newServingInput, setNewServingInput] = useState(250);

  const today = new Date().toISOString().substring(0, 10);

  const loadWaterData = async () => {
    try {
      const [goalRes, entriesRes] = await Promise.all([
        api.getWaterGoal(),
        api.getWaterEntries(today),
      ]);
      if (goalRes.goal) {
        setGoal(goalRes.goal.daily_goal_ml || 2000);
        setServingSize(goalRes.goal.preferred_serving_ml || 250);
        setNewGoalInput(goalRes.goal.daily_goal_ml || 2000);
        setNewServingInput(goalRes.goal.preferred_serving_ml || 250);
      }
      setTotalMl(entriesRes.total_ml || 0);
      setEntries(entriesRes.entries || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load hydration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaterData();
  }, []);

  const handleQuickAdd = async (amount: number) => {
    try {
      const res = await api.addWaterEntry({ quantity_ml: amount, local_date: today });
      setEntries((prev) => [...prev, res.entry]);
      setTotalMl((prev) => prev + amount);
      showToast(`+${amount} mL recorded! Consistent hydration supports natural vitality.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to log water', 'error');
    }
  };

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(customMl, 10);
    if (!qty || qty <= 0) {
      showToast('Please enter a valid amount in mL', 'error');
      return;
    }

    try {
      const res = await api.addWaterEntry({
        quantity_ml: qty,
        local_date: today,
        note: customNote.trim() || undefined,
      });
      setEntries((prev) => [...prev, res.entry]);
      setTotalMl((prev) => prev + qty);
      setCustomMl('');
      setCustomNote('');
      showToast(`+${qty} mL logged!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to log water', 'error');
    }
  };

  const handleDeleteEntry = async (id: string, qty: number) => {
    try {
      await api.deleteWaterEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotalMl((prev) => Math.max(0, prev - qty));
      showToast('Entry removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove entry', 'error');
    }
  };

  const handleSaveGoal = async () => {
    try {
      const res = await api.updateWaterGoal({
        daily_goal_ml: newGoalInput,
        preferred_serving_ml: newServingInput,
      });
      setGoal(res.goal.daily_goal_ml);
      setServingSize(res.goal.preferred_serving_ml);
      setIsEditingGoal(false);
      showToast('Hydration preferences updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update goal', 'error');
    }
  };

  const percentage = Math.min(100, Math.round((totalMl / goal) * 100));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <Droplets className="w-3.5 h-3.5" />
            <span>Hydration Companion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Water Intake Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track at your own comfort. Hydration needs vary with climate, diet, and activity.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditingGoal(!isEditingGoal)}
          leftIcon={<Settings2 className="w-4 h-4" />}
        >
          {isEditingGoal ? 'Close Preferences' : 'Adjust Goal'}
        </Button>
      </div>

      {/* Adjust Goal Panel */}
      {isEditingGoal && (
        <Card className="p-6 bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40 animate-in fade-in duration-150">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            Hydration Target & Serving Preferences
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Daily Goal (mL)
              </label>
              <input
                type="number"
                min="500"
                max="8000"
                step="100"
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Standard Cup / Serving Size (mL)
              </label>
              <input
                type="number"
                min="50"
                max="1000"
                step="50"
                value={newServingInput}
                onChange={(e) => setNewServingInput(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsEditingGoal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveGoal}>
              Save Target
            </Button>
          </div>
        </Card>
      )}

      {/* Main Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-8 text-center">
          <ProgressRing
            percentage={percentage}
            size={160}
            strokeWidth={14}
            color="#0ea5e9"
            label={`${totalMl} mL`}
            sublabel={`Goal: ${goal} mL`}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
            {percentage >= 100
              ? '🌟 You reached your personal water goal!'
              : `${Math.max(0, goal - totalMl)} mL remaining today`}
          </p>
        </Card>

        {/* Quick Log Action & Custom Add */}
        <Card className="md:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              One-Click Quick Log
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tap a preset serving to immediately log water.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { ml: servingSize, label: 'Cup' },
                { ml: 500, label: 'Bottle' },
                { ml: 150, label: 'Glass' },
              ].map((preset) => (
                <button
                  key={preset.ml}
                  onClick={() => handleQuickAdd(preset.ml)}
                  className="p-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border border-sky-200/60 dark:border-sky-800/40 text-sky-900 dark:text-sky-200 transition-all text-center group active:scale-95"
                >
                  <Droplets className="w-5 h-5 mx-auto mb-1 text-sky-500 group-hover:scale-110 transition-transform" />
                  <span className="block font-bold text-base">+{preset.ml} mL</span>
                  <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Entry Form */}
            <form onSubmit={handleCustomAdd} className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Custom Quantity
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="10"
                  max="3000"
                  value={customMl}
                  onChange={(e) => setCustomMl(e.target.value)}
                  placeholder="Quantity in mL (e.g. 350)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Optional note"
                  className="hidden sm:block flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Button type="submit" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Log
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      {/* History Log */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Today's Water Entries ({entries.length})
        </h2>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Droplets className="w-8 h-8 text-sky-500" />}
            title="No hydration logged today"
            description="Use the buttons above to log your first cup of water."
          />
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry) => {
              const time = new Date(entry.logged_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center font-bold">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        +{entry.quantity_ml} mL
                      </span>
                      {entry.note && (
                        <span className="text-xs text-slate-500 ml-2 italic">
                          ({entry.note})
                        </span>
                      )}
                      <span className="text-xs text-slate-400 block">{time}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteEntry(entry.id, entry.quantity_ml)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
