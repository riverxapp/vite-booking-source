import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "./api";
import type { AuthUser } from "./api";
import { AuthContext } from "./context";

// Only a component is exported here so React Fast Refresh can hot-swap it.
// The hook lives in ./use-auth, the context in ./context.
export function AuthProviderRoot({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .fetchSession()
      .then(setUser)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Every call that returns a user makes it the session user.
  const adopt = useCallback(
    <A extends unknown[]>(call: (...args: A) => Promise<AuthUser>) =>
      async (...args: A) => {
        const next = await call(...args);
        setUser(next);
        setError(null);
        return next;
      },
    [],
  );

  const signOut = useCallback(async () => {
    await authApi.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signIn: adopt(authApi.signIn),
      signUp: adopt(authApi.signUp),
      signUpAgent: adopt(authApi.signUpAgent),
      resetPassword: adopt(authApi.resetPassword),
      updateProfile: adopt(authApi.updateProfile),
      signOut,
    }),
    [user, loading, error, adopt, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
