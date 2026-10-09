import React from 'react';
import { useNotification, ToastItem } from '../../context/NotificationContext';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItemCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItemCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const isEncouragement = toast.type === 'encouragement';

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
    encouragement: <Sparkles className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />,
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-900 bg-white/95 dark:bg-slate-900/95',
    error: 'border-rose-200 dark:border-rose-900 bg-white/95 dark:bg-slate-900/95',
    info: 'border-sky-200 dark:border-sky-900 bg-white/95 dark:bg-slate-900/95',
    encouragement: 'border-brand-300 dark:border-brand-700 bg-gradient-to-r from-brand-50/95 to-amber-50/95 dark:from-slate-900/95 dark:to-brand-950/95 shadow-soft-lg',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
        borders[toast.type]
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {isEncouragement && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 block mb-0.5">
            Personal Reflection & Encouragement
          </span>
        )}
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
