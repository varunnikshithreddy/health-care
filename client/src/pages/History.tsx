import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Droplets,
  Flame,
  TrendingUp,
} from 'lucide-react';

export const History: React.FC = () => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory(days);
      setAnalytics(res.analytics || []);
      setSummary(res.summary || {});
    } catch (err: any) {
      showToast(err.message || 'Failed to load historical analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [days]);

  const formattedChartData = analytics.map((item) => {
    const d = new Date(item.date);
    const label = d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
    return {
      ...item,
      label,
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Progress & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            History & Trends
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review your consistency over time without judgment.
          </p>
        </div>

        {/* Days Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-center">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                days === d
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Past {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold block">
              Completions
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {summary.total_tasks_completed || 0} tasks
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Across chosen timeframe</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center font-bold">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold block">
              Hydration Logged
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {(summary.total_water_logged_ml || 0).toLocaleString()} mL
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Total recorded volume</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold block">
              Meals Logged
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {summary.total_meals_recorded || 0} meals
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Nutrition journal entries</span>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Chart 1: Task Completion % */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-600" /> Routine Completion Rate (%)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Percentage of scheduled activities completed per day
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completion_percentage"
                    name="Completed %"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#completionGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Water Intake (mL) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-500" /> Daily Water Intake (mL)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total milliliters of water recorded each day
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar
                    dataKey="water_ml"
                    name="Water (mL)"
                    fill="#0ea5e9"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Daily Table Breakdown */}
          <Card className="p-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              Historical Log Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Tasks</th>
                    <th className="pb-3">Completion %</th>
                    <th className="pb-3">Water</th>
                    <th className="pb-3">Meals</th>
                    <th className="pb-3">Est. Calories</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {analytics.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {row.date}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {row.completed_tasks} / {row.total_tasks}
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {row.completion_percentage}%
                        </span>
                      </td>
                      <td className="py-3 text-sky-600 dark:text-sky-400 font-medium">
                        {row.water_ml} mL
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {row.meals_count}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        ~{row.calories_kcal} kcal
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
