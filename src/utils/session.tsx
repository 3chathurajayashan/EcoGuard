import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { errorMessage, http, setAuthToken, setUnauthorizedHandler } from './http';
import type { Role, SessionUser } from './roles';

const STORAGE_KEY = '@ecoguard_session_v1';

interface SessionValue {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { firstName?: string; lastName?: string; phoneNumber?: string }) => Promise<void>;
}

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: Role;
}

const SessionContext = createContext<SessionValue | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}

const normalize = (u: any): SessionUser => ({
  id: String(u.id ?? u._id),
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  phoneNumber: u.phoneNumber,
  role: u.role,
  profilePicture: u.profilePicture ?? null,
});

async function persist(token: string | null, user: SessionUser | null) {
  try {
    if (token && user) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable: the session just won't survive a restart
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clear = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await persist(null, null);
  }, []);

  // Restore a saved session, then confirm the token is still valid. If the server cannot be
  // reached the saved user is kept so the app still opens offline.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw) as { token: string; user: SessionUser };
        setAuthToken(saved.token);
        if (active) setUser(saved.user);
        try {
          const response = await http.get('/auth/me');
          const fresh = normalize(response.data.user);
          if (active) setUser(fresh);
          await persist(saved.token, fresh);
        } catch (error: any) {
          if (error?.response?.status === 401) await clear();
        }
      } catch {
        // unreadable storage: start signed out
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [clear]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear();
    });
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await http.post('/auth/signin', { email: email.trim(), password });
      const next = normalize(response.data.user);
      setAuthToken(response.data.token);
      setUser(next);
      await persist(response.data.token, next);
    } catch (error) {
      throw new Error(errorMessage(error));
    }
  }, []);

  const signUp = useCallback(
    async (input: SignUpInput) => {
      try {
        await http.post('/auth/signup', { ...input, email: input.email.trim() });
      } catch (error) {
        throw new Error(errorMessage(error));
      }
      await signIn(input.email, input.password);
    },
    [signIn],
  );

  const updateProfile = useCallback(async (patch: { firstName?: string; lastName?: string; phoneNumber?: string }) => {
    try {
      const response = await http.patch('/auth/me', patch);
      const next = normalize(response.data.user);
      setUser(next);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) await persist(JSON.parse(raw).token, next);
    } catch (error) {
      throw new Error(errorMessage(error));
    }
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ user, loading, signIn, signUp, signOut: clear, updateProfile }),
    [user, loading, signIn, signUp, clear, updateProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
