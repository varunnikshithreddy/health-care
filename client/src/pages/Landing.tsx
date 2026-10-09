import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import {
  Clock,
  Sparkles,
  Droplets,
  ScanLine,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Heart,
  Calendar,
} from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, signInAsDemo } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleDemo = async () => {
    await signInAsDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfaf8] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 dark:opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse-subtle">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Personal Health & Routine Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Your Routine. Your Goals.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-500">
                Your Wellbeing.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              You decide when to wake up, hydrate, eat, move, and rest. LifeCare AI delivers custom
              reminders, celebrates your victories with your own words, and provides AI food nutrition estimates.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleStart} rightIcon={<ArrowRight className="w-5 h-5" />}>
                {user ? 'Go to Dashboard' : 'Create My Free Routine'}
              </Button>
              <Button size="lg" variant="outline" onClick={handleDemo}>
                Try Instant Interactive Demo
              </Button>
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              No medical prescriptions. No rigid schedules. You stay in full control.
            </p>
          </div>

          {/* Interactive Feature Hero Preview Card */}
          <div className="mt-16 max-w-4xl mx-auto rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-6 mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Today’s Mindful Journey
                  </h3>
                  <p className="text-xs text-slate-500">Self-Directed Routine with Encouragement</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 4 of 6 Completed (67%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                  <span>07:15 AM</span>
                  <span className="text-emerald-600 font-semibold">Done ✓</span>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Morning Hydration</h4>
                <p className="text-xs text-brand-700 dark:text-brand-300 mt-2 italic bg-white/70 dark:bg-slate-800/60 p-2 rounded-xl">
                  "Well done! Hydrating first thing powers your focus."
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                  <span>13:00 PM</span>
                  <span className="text-amber-600 font-semibold">Next Up</span>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Nourishing Lunch</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Reminder: "Step away and enjoy a balanced meal."
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                  <span>Hydration Target</span>
                  <span className="text-sky-600 font-semibold">1,250 / 2,000 mL</span>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Water Tracker</h4>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              The LifeCare AI Core Philosophy
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Wellness is deeply personal. We never force rigid schedules or calculate judgmental scores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-sand-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                User-Controlled Timetable
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Build your schedule from scratch. Choose when to rise, eat, hydrate, exercise, and sleep.
                Set unique schedules for weekdays and weekends.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-sand-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Personalized Encouragement
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every completed task displays your exact configured encouraging words. Never feel judged
                if you need to skip or postpone an activity.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-sand-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-5">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                AI Food Vision Estimates
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Snap or upload food photos to estimate calories and macros via Google Gemini Vision. Review
                and adjust values before confirming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Reliable & Private
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 mb-5">
              Built on Modern Architecture with Strict Data Protection
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Supabase PostgreSQL with Row Level Security
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Your routines, logs, and food entries are cryptographically isolated so only you have access.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Time-Zone Aware & Idempotent Reminders
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Server scheduling automatically suppresses alerts once a task is marked completed and prevents duplicate pings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Droplets className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Hydration & Food Logs on Your Terms
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Quick-add serving buttons and manual entry options let you track without friction.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button onClick={handleStart} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Begin Your Journey
              </Button>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-tr from-brand-50 to-emerald-100/40 dark:from-slate-900 dark:to-brand-950/40 border border-brand-200/50 dark:border-brand-900/40">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-soft">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Photo Food Scanner</span>
                  <span className="text-brand-600 font-semibold">Gemini Vision</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Mediterranean Quinoa Bowl
                </p>
                <div className="flex gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>🔥 ~420 kcal</span>
                  <span>🥩 18g Protein</span>
                  <span>🥑 14g Healthy Fats</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-soft">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Hydration Habit</span>
                  <span className="text-sky-600 font-semibold">+250 mL added</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Daily Goal: 2,000 mL
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  One-tap quick logging with customizable serving sizes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Section */}
      <section className="py-16 bg-brand-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <Heart className="w-10 h-10 mx-auto mb-4 text-white/80" />
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to design a routine that works for you?
          </h2>
          <p className="mt-3 text-brand-100 text-base max-w-xl mx-auto">
            Take a few moments to establish your personal timetable and begin receiving positive encouragement.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="bg-white text-brand-800 hover:bg-brand-50 border-transparent font-semibold"
              onClick={handleStart}
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
