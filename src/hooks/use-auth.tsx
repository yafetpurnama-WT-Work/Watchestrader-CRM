"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { auth, removeAuthToken } from "@/lib/api";

interface Permission {
  id: string;
  slug: string;
  module: string;
  action: string;
}

interface RoleRelation {
  id: string;
  name: string;
  slug: string;
  level: number;
  permissions: Permission[];
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string | null;
  role_relation?: RoleRelation | null;
  company?: { id: string; name: string } | null;
  outlet?: { id: string; name: string } | null;
}

interface AuthContextValue {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider — wraps the dashboard layout.
 * Fetches user profile from Laravel API via Sanctum token.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await auth.me();
      if (res.success && res.data?.user) {
        const u = res.data.user;
        const profileData: Profile = {
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          avatar_url: u.avatar_url,
          role: u.role,
          role_relation: u.role_relation ?? null,
          company: u.company ?? null,
          outlet: u.outlet ?? null,
        };
        setUser(profileData);
        setProfile(profileData);
      }
    } catch (err) {
      // Token invalid or expired — clear state
      removeAuthToken();
      setUser(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    const init = async () => {
      try {
        await fetchProfile();
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    init();

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await auth.logout();
    } catch {
      // ignore logout API error
    }
    removeAuthToken();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — read the shared auth state from context.
 * Must be used inside an <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      profile: null,
      loading: false,
      signOut: async () => {
        removeAuthToken();
        window.location.href = "/login";
      },
      refreshProfile: async () => {},
    };
  }
  return ctx;
}
