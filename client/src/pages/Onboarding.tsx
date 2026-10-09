import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import {
  Heart,
  Clock,
  Sparkles,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Droplets,
  Utensils,
  Footprints,
} from 'lucide-react';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfileState } = useAuth();
  const { requestPermission, showToast } = useNotification();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [wakeUpTime, setWakeUpTime] = useState(profile?.wake_up_time || '07:00');
  const [bedTime, setBedTime] = useState(profile?.bed_time || '22:00');
  const [motivationalStyle, setMotivationalStyle] = useState<'encouraging' | 'mindful' | 'energetic' | 'calm'>(
    profile?.preferred_motivational_style || 'encouraging'
  );
  const [includeStarterRoutine, setIncludeStarterRoutine] = useState(true);
  const [dailyWaterGoal, setDailyWaterGoal] = useState(2000);

  const handleNext = () => {
    setStep((s) => s + 1);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // 1. Update Profile
      await updateProfileState({
        display_name: displayName || profile?.display_name || 'Wellness Explorer',
        wake_up_time: wakeUpTime,
        bed_time: bedTime,
        preferred_motivational_style: motivationalStyle,
        onboarding_completed: true,
      });

      // 2. Set Water Goal
      await api.updateWaterGoal({
        daily_goal_ml: dailyWaterGoal,
        preferred_serving_ml: 250,
      }).catch(() => {});

      // 3. Seed Default Routine if user opted in
      if (includeStarterRoutine) {
        await api.seedDefaultRoutine(
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        ).catch(() => {});
      }

      showToast('🎉 Welcome to LifeCare AI! Your personal routine is ready.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Failed to complete setup.', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50/70 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md mx-auto mb-3">
            <Heart className="w-6 h-6 fill-white/20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome to LifeCare AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Let’s align LifeCare AI with your natural rhythm. You can change everything later.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === dot
                    ? 'w-8 bg-brand-600 dark:bg-brand-500'
                    : step > dot
                    ? 'w-2 bg-brand-300 dark:bg-brand-800'
                    : 'w-2 bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-600" /> 1. Your Daily Rhythm
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set your approximate waking and resting hours
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" /> Preferred Wake-up Time
                  </label>
                  <input
                    type="time"
                    value={wakeUpTime}
                    onChange={(e) => setWakeUpTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-400" /> Preferred Bedtime
                  </label>
                  <input
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Skip for now
                </button>
                <Button onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> 2. Motivational Tone
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose the tone of encouragement that resonates best with you
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'encouraging',
                    name: 'Encouraging & Warm',
                    desc: 'Supportive, uplifting, celebrates every small victory.',
                  },
                  {
                    id: 'mindful',
                    name: 'Mindful & Grounded',
                    desc: 'Calm, present, focuses on breath and inner balance.',
                  },
                  {
                    id: 'energetic',
                    name: 'Energetic & Driven',
                    desc: 'Dynamic, momentum-focused, keeps your energy high.',
                  },
                  {
                    id: 'calm',
                    name: 'Gentle & Quiet',
                    desc: 'Subtle, peaceful, non-intrusive reflections.',
                  },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setMotivationalStyle(style.id as any)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      motivationalStyle === style.id
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 shadow-xs ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                      {style.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      {style.desc}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-500" /> Daily Hydration Goal (mL)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1000"
                    max="4000"
                    step="100"
                    value={dailyWaterGoal}
                    onChange={(e) => setDailyWaterGoal(parseInt(e.target.value, 10))}
                    className="flex-1 accent-brand-600"
                  />
                  <span className="font-bold text-sm text-slate-900 dark:text-white w-20 text-right">
                    {dailyWaterGoal} mL
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-500" /> 3. Starter Routine & Reminders
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Optional starter template with gentle reminders
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/50 dark:border-brand-900/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStarterRoutine}
                    onChange={(e) => setIncludeStarterRoutine(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 accent-brand-600"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Seed Starter Routine Timetable
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                      Creates healthy baseline reminders (Hydration, Breakfast, Lunch, Movement break, and Evening wind-down). You can edit or delete each one anytime.
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Enable Browser Notifications
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Receive reminders even when the tab is quiet. You can toggle reminders on individual tasks at any time.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEnableNotifications}
                    leftIcon={<Bell className="w-3.5 h-3.5" />}
                  >
                    Allow
                  </Button>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  isLoading={loading}
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Enter My Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
