import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const AUTH_TIMEOUT_MS = 4500;

function withTimeout<T>(promise: Promise<T>, timeoutMs = AUTH_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Auth request timeout')), timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

async function getValidSession(session: Session | null) {
  if (!session) return null;

  const { error } = await withTimeout(supabase.auth.getUser());
  if (error) {
    await withTimeout(supabase.auth.signOut()).catch(() => null);
    return null;
  }

  return session;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    withTimeout(supabase.auth.getSession())
      .then(async ({ data: { session } }) => {
        const validSession = await getValidSession(session);
        if (mounted) setSession(validSession);
      })
      .catch(() => {
        if (mounted) setSession(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      getValidSession(session)
        .then((validSession) => {
          if (mounted) setSession(validSession);
        })
        .catch(() => {
          if (mounted) setSession(null);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, userId: session?.user.id ?? null };
}
