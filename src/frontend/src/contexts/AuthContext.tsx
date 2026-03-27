import { createContext, useContext, useEffect, useState } from "react";

const ADMIN_EMAIL = "vikaskharb00007@gmail.com";
const ADMIN_PASSWORD = "Vikas00007@admin";
const STORAGE_KEY = "vn_auth";

export interface AuthState {
  username: string;
  sectionLevel: number;
  isAdmin: boolean;
}

interface AuthContextValue {
  auth: AuthState | null;
  login: (username: string, sectionLevel: number) => void;
  loginAdmin: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  sectionLevel: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  function login(username: string, sectionLevel: number) {
    setAuth({ username, sectionLevel, isAdmin: false });
  }

  function loginAdmin(email: string, password: string): boolean {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setAuth({ username: "Admin", sectionLevel: 3, isAdmin: true });
      return true;
    }
    return false;
  }

  function logout() {
    setAuth(null);
  }

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        loginAdmin,
        logout,
        isAdmin: auth?.isAdmin ?? false,
        sectionLevel: auth?.sectionLevel ?? 0,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
