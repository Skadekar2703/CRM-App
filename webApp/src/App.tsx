import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { WebLoginScreen } from './components/Auth/WebLoginScreen';
import { WebDashboard } from './components/Dashboard/WebDashboard';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('crm_theme');
    const isDark = saved ? saved === 'dark' : true;
    const themeStr = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeStr);
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, []);

  const syncProfile = async (authUser: User) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile?.username) {
        setUsername(profile.username);
      } else {
        const fallbackName = authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user';
        setUsername(fallbackName);
        await supabase.from('profiles').upsert([
          {
            id: authUser.id,
            username: fallbackName,
            email: authUser.email || '',
            role: 'user',
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'id' });
      }
    } catch (e) {
      console.log('Profile sync error:', e);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        syncProfile(session.user).finally(() => setIsLoading(false));
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUser(session.user);
          await syncProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUsername(undefined);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername(undefined);
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div style={{ color: 'var(--text-primary, #ffffff)', fontSize: '16px', fontWeight: 600 }}>
          Loading CRM...
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <WebDashboard
        userEmail={user.email || ''}
        username={username || user.user_metadata?.username}
        onLogout={handleLogout}
      />
    );
  }

  return <WebLoginScreen />;
};
