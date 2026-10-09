import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-brand-600 fill-brand-600/30" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">LifeCare AI</span>
          <span>— Your Routine. Your Goals. Your Wellbeing.</span>
        </div>

        <div className="flex items-center gap-6 text-xs font-medium">
          <Link to="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Terms of Service
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            Documentation
          </a>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} LifeCare AI. Built for mindful wellness.
        </p>
      </div>
    </footer>
  );
};
