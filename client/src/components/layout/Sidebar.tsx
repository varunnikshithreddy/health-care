import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  CheckSquare,
  Droplets,
  Utensils,
  ScanLine,
  BarChart3,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/schedule', label: 'Schedule Builder', icon: CalendarClock },
  { to: '/tasks', label: 'Tasks & Habits', icon: CheckSquare },
  { to: '/water', label: 'Water Tracker', icon: Droplets },
  { to: '/meals', label: 'Meal Logging', icon: Utensils },
  { to: '/food-scanner', label: 'AI Food Scanner', icon: ScanLine },
  { to: '/history', label: 'History & Trends', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Personal Routine
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold shadow-xs border border-brand-200/40 dark:border-brand-800/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/80 px-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-50 to-sage-50 dark:from-brand-950/40 dark:to-slate-800/50 border border-brand-200/40 dark:border-brand-900/40">
          <p className="text-xs font-semibold text-brand-900 dark:text-brand-200">
            Gentle Reminder
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            You set the routine. LifeCare AI is here to encourage every step.
          </p>
        </div>
      </div>
    </aside>
  );
};
