'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { RiGithubFill, RiLogoutBoxLine } from 'react-icons/ri';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const sbRef = useRef(createClient());

  useEffect(() => {
    const sb = sbRef.current;

    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn() {
    await sbRef.current.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  async function signOut() {
    await sbRef.current.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }

  if (loading) return <div className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] animate-pulse" />;

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)] transition-colors"
      >
        <RiGithubFill size={14} /> sign in
      </button>
    );
  }

  const avatar = user.user_metadata?.avatar_url;
  const username = user.user_metadata?.user_name ?? user.email;

  return (
    <div className="flex items-center gap-2">
      {avatar ? (
        <img src={avatar} alt={username} className="w-7 h-7 rounded-full border border-[var(--color-border)]" />
      ) : (
        <div className="w-7 h-7 rounded-full border border-[var(--color-neon-cyan)] bg-[var(--color-surface-2)] flex items-center justify-center text-[10px] text-[var(--color-neon-cyan)] font-bold">
          {username?.[0]?.toUpperCase()}
        </div>
      )}
      <button
        onClick={signOut}
        title={`Sign out (${username})`}
        className="p-1.5 text-[var(--color-text-dim)] hover:text-[var(--color-neon-red)] transition-colors rounded"
      >
        <RiLogoutBoxLine size={14} />
      </button>
    </div>
  );
}
