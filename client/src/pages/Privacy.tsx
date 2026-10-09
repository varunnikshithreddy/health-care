import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Shield, Lock, Eye, Trash2 } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbfaf8] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Last updated: October 2026 • Your data is yours alone
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-600" /> 1. Commitment to Data Dignity
            </h2>
            <p>
              LifeCare AI is engineered around the principle of self-directed wellness. We do not sell your personal routine data, water intake logs, meal records, or dietary preferences to advertisers, insurance brokers, or data brokers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-600" /> 2. Information We Store
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li><strong>Account Credentials:</strong> Email address and your chosen preferred nickname.</li>
              <li><strong>Routine Timetables:</strong> Scheduled activities, reminder times, and your personalized encouragement affirmations.</li>
              <li><strong>Wellness Logs:</strong> Water consumption amounts (mL) and logged food items with calorie estimates.</li>
              <li><strong>Food Photographs:</strong> Images you submit to the AI food scanner are processed strictly for nutritional estimation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-600" /> 3. Row Level Security Protection
            </h2>
            <p>
              All user records reside in PostgreSQL databases secured with Row Level Security (RLS). Every query is verified against your authenticated token at the database level.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-brand-600" /> 4. Deletion & Data Rights
            </h2>
            <p>
              You maintain the absolute right to delete any logged meal, water entry, task, or your entire account at any time through the Settings panel.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
