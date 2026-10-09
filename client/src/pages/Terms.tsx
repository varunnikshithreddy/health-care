import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { FileText, AlertTriangle, CheckCircle, Scale } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbfaf8] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Transparent and human-first terms for using LifeCare AI
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> 1. Medical Disclaimer (Important)
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
              <strong>LifeCare AI is not a medical provider and does not provide clinical diagnoses.</strong> All routine templates, hydration reminders, and AI food analysis figures are educational approximations. Always consult qualified healthcare professionals before undertaking restrictive dietary regimens or strenuous physical exercises.
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-brand-600" /> 2. Estimation Limitations of AI Food Scanner
            </h2>
            <p>
              Food photographs submitted to the vision model are evaluated purely on optical characteristics. Visual inspection cannot reliably assess invisible fats, cooking techniques, hidden sauces, or exact sodium contents. All nutritional numbers must be viewed as broad approximations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-600" /> 3. Responsible Use
            </h2>
            <p>
              You agree to use LifeCare AI for supportive personal development. You agree not to upload abusive, copyrighted, or inappropriate imagery to the scanner.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
