import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthPayload, LoginInput, PublicUser, RegisterInput } from '@gvhax/shared';
import { api, auth as tokenStore } from '@/lib/api';

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [hasToken, setHasToken] = useState(() => Boolean(tokenStore.token));

  // Only fetched when a token exists, so anonymous visitors make no request.
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<PublicUser>('/auth/me').then((r) => r.data),
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const accept = useCallback(
    (payload: AuthPayload) => {
      tokenStore.set(payload.token);
      setHasToken(true);
      qc.setQueryData(['me'], payload.user);
    },
    [qc],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      loading: hasToken && isLoading,
      login: async (input) => accept((await api.post<AuthPayload>('/auth/login', input)).data),
      register: async (input) => accept((await api.post<AuthPayload>('/auth/register', input)).data),
      logout: () => {
        tokenStore.clear();
        setHasToken(false);
        qc.clear();
      },
    }),
    [data, hasToken, isLoading, accept, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
