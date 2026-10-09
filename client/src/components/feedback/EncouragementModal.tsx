import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Sparkles, Heart } from 'lucide-react';
import { Button } from '../ui/Button';

export const EncouragementModal: React.FC = () => {
  const { encouragementData, closeEncouragement } = useNotification();

  if (!encouragementData || !encouragementData.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={closeEncouragement}
      />

      {/* Celebration Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-brand-200 dark:border-brand-900/60 p-7 text-center z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-brand-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
          <Sparkles className="w-8 h-8" />
        </div>

        <span className="text-xs font-semibold tracking-wider uppercase text-brand-600 dark:text-brand-400">
          Activity Completed
        </span>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-4">
          {encouragementData.taskTitle}
        </h3>

        <div className="p-4 bg-brand-50/80 dark:bg-brand-950/40 rounded-2xl border border-brand-200/50 dark:border-brand-900/40 mb-6">
          <div className="flex items-center justify-center gap-1.5 text-xs text-brand-700 dark:text-brand-300 font-medium mb-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Your Personal Words</span>
          </div>
          <p className="text-base text-slate-800 dark:text-slate-100 font-medium italic">
            "{encouragementData.message}"
          </p>
        </div>

        <Button onClick={closeEncouragement} className="w-full">
          Continue My Day
        </Button>
      </div>
    </div>
  );
};
