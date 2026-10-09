import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isConfiguredSupabase } from '../lib/supabase';
import { api } from '../lib/api';

export interface UserProfile {
  id: string;
  display_name: string;
  timezone: string;
  preferred_motivational_style: 'encouraging' | 'mindful' | 'energetic' | 'calm';
  wake_up_time: string;
  bed_time: string;
  theme_preference: 'light' | 'dark' | 'system';
  encouragement_display_mode: 'toast' | 'modal' | 'subtle';
  onboarding_completed: boolean;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  theme: 'light' | 'dark';
  setThemePreference: (theme: 'light' | 'dark' | 'system') => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileState: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load and apply theme
  const applyTheme = (pref: 'light' | 'dark' | 'system') => {
    let activeTheme: 'light' | 'dark' = 'light';
    if (pref === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      activeTheme = pref;
    }
    setTheme(activeTheme);
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setThemePreference = async (pref: 'light' | 'dark' | 'system') => {
    localStorage.setItem('lifecare_theme', pref);
    applyTheme(pref);
    if (user) {
      await api.updateProfile({ theme_preference: pref }).catch(() => {});
      if (profile) {
        setProfile({ ...profile, theme_preference: pref });
      }
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res.profile) {
        setProfile(res.profile);
        if (res.profile.theme_preference) {
          applyTheme(res.profile.theme_preference);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch profile:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // Check saved theme
      const savedTheme = (localStorage.getItem('lifecare_theme') as any) || 'system';
      applyTheme(savedTheme);

      if (isConfiguredSupabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await refreshProfile();
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (currentSession?.user) {
              setUser(currentSession.user);
              await refreshProfile();
            } else {
              setUser(null);
              setProfile(null);
            }
          }
        );

        setLoading(false);
        return () => subscription.unsubscribe();
      } else {
        // Dev / Demo mode check
        const demoAuth = localStorage.getItem('lifecare_demo_user');
        if (demoAuth) {
          const parsed = JSON.parse(demoAuth);
          setUser(parsed);
          await refreshProfile();
        }
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isConfiguredSupabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        setUser(data.user);
        await refreshProfile();
      }
      return { error };
    } else {
      // Demo fallback login
      const demoUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email,
        user_metadata: { display_name: email.split('@')[0] },
      };
      localStorage.setItem('lifecare_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('lifecare_auth_token', 'demo-token');
      setUser(demoUser);
      await refreshProfile();
      return { error: null };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (isConfiguredSupabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
        },
      });
      if (!error && data.user) {
        setUser(data.user);
        await refreshProfile();
      }
      return { error };
    } else {
      const demoUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email,
        user_metadata: { display_name: displayName || email.split('@')[0] },
      };
      localStorage.setItem('lifecare_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('lifecare_auth_token', 'demo-token');
      setUser(demoUser);
      await refreshProfile();
      return { error: null };
    }
  };

  const signInAsDemo = async () => {
    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'alex@lifecare.ai',
      user_metadata: { display_name: 'Alex Rivera' },
    };
    localStorage.setItem('lifecare_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('lifecare_auth_token', 'demo-token');
    setUser(demoUser);
    await refreshProfile();
  };

  const signOut = async () => {
    if (isConfiguredSupabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('lifecare_demo_user');
    localStorage.removeItem('lifecare_auth_token');
    setUser(null);
    setProfile(null);
  };

  const updateProfileState = async (updates: Partial<UserProfile>) => {
    const res = await api.updateProfile(updates);
    if (res.profile) {
      setProfile(res.profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        theme,
        setThemePreference,
        signIn,
        signUp,
        signOut,
        signInAsDemo,
        refreshProfile,
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
