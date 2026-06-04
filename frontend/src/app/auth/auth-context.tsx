import React from "react";
import { loadAuth, saveAuth, type StoredAuth } from "../../shared/lib/storage";

type AuthState = StoredAuth | null;

type AuthContextValue = {
  auth: AuthState;
  setAuth: (next: AuthState) => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = React.useState<AuthState>(() => loadAuth());

  const setAuth = React.useCallback((next: AuthState) => {
    setAuthState(next);
    saveAuth(next);
  }, []);

  const logout = React.useCallback(() => setAuth(null), [setAuth]);

  const value = React.useMemo(() => ({ auth, setAuth, logout }), [auth, setAuth, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

