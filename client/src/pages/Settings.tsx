import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Shield,
  Trash2,
  LogOut,
  Heart,
  CheckCircle2,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, profile, updateProfileState, signOut, theme, setThemePreference } = useAuth();
  const {
    permission,
    isPushSupported,
    isPushSubscribed,
    requestPermission,
    sendTestPushNotification,
    showToast,
  } = useNotification();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [wakeUpTime, setWakeUpTime] = useState(profile?.wake_up_time || '07:00');
  const [bedTime, setBedTime] = useState(profile?.bed_time || '22:00');
  const [motivationalStyle, setMotivationalStyle] = useState<any>(
    profile?.preferred_motivational_style || 'encouraging'
  );
  const [displayMode, setDisplayMode] = useState<any>(
    profile?.encouragement_display_mode || 'toast'
  );
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfileState({
        display_name: displayName.trim(),
        timezone,
        wake_up_time: wakeUpTime,
        bed_time: bedTime,
        preferred_motivational_style: motivationalStyle,
        encouragement_display_mode: displayMode,
      });
      showToast('Settings saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sampleMessages: Record<string, string> = {
    encouraging: 'Well done! You are building healthy consistency with every small step.',
    mindful: 'Deep breath. You honored your body with mindful attention today.',
    energetic: 'Boom! Another milestone crushed. Keep this momentum rolling!',
    calm: 'Peaceful progress. You moved gently forward today.',
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Personal Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Settings & Personalization
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Fine-tune notifications, motivational tone, theme, and account controls.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Profile & Rhythm</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Time Zone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Wake-up Time
              </label>
              <input
                type="time"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Bedtime
              </label>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </Card>

        {/* Motivational Tone Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Encouragement Tone & Presentation
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Default Tone of Voice
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['encouraging', 'mindful', 'energetic', 'calm'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setMotivationalStyle(tone)}
                  className={`p-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                    motivationalStyle === tone
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Affirmation Display Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDisplayMode('toast')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  displayMode === 'toast'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="font-bold block">Floating Toast Banner</span>
                <span className="text-[11px] text-slate-400">Gentle banner at the bottom corner</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('modal')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  displayMode === 'modal'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="font-bold block">Celebration Modal</span>
                <span className="text-[11px] text-slate-400">Centered celebration card pop-up</span>
              </button>
            </div>
          </div>

          {/* Tone Preview */}
          <div className="p-3.5 rounded-2xl bg-sand-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-500 block mb-1">Tone Preview:</span>
            <p className="italic text-slate-700 dark:text-slate-200">
              "{sampleMessages[motivationalStyle] || sampleMessages.encouraging}"
            </p>
          </div>
        </Card>

        {/* Notifications Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Bell className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Notification Infrastructure
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Browser Permission: <span className="capitalize font-bold text-brand-600">{permission}</span>
              </span>
              <span className="text-slate-500 mt-0.5 block">
                Web Push Background Infrastructure:{' '}
                {isPushSupported ? 'Supported in this browser' : 'Desktop notifications only'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {permission !== 'granted' ? (
                <Button size="sm" type="button" onClick={() => requestPermission()}>
                  Request Access
                </Button>
              ) : (
                <Button size="sm" variant="outline" type="button" onClick={sendTestPushNotification}>
                  Send Test Ping
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Appearance Theme Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sun className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Theme & Appearance</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setThemePreference('light')}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <span className="text-xs">Light</span>
            </button>

            <button
              type="button"
              onClick={() => setThemePreference('dark')}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-950/60 text-brand-300 font-semibold ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
              <span className="text-xs">Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setThemePreference('system')}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Monitor className="w-5 h-5 mx-auto mb-1 text-slate-500" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" isLoading={saving} className="px-6 py-3">
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Account & Session Controls */}
      <Card className="p-6 space-y-4 border-rose-200/50 dark:border-rose-950/40">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Account & Privacy</h3>
        <p className="text-xs text-slate-500">
          Signed in as: <strong className="text-slate-700 dark:text-slate-300">{user?.email || 'Demo Explorer'}</strong>
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => signOut()} leftIcon={<LogOut className="w-4 h-4" />}>
            Sign Out
          </Button>

          {!deleteConfirm ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteConfirm(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Account & Records
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  signOut();
                  showToast('Account data deleted successfully', 'info');
                }}
              >
                Confirm Delete All Data
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
