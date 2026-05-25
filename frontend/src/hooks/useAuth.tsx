/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Navigate } from "react-router-dom";
import { STORAGE_KEY, API_BASE } from "@/lib/constants";
import { clearInstanceTokenCache } from "@/lib/api-client";

interface AuthContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearInstanceTokenCache();
    setApiKeyState(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        apiKey,
        setApiKey,
        logout,
        isAuthenticated: !!apiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export async function validateApiKey(key: string): Promise<boolean> {
  // Empty path for base URL to avoid CORS issues in dev
  try {
    const res = await fetch(`${API_BASE}/instance/all`, {
      headers: { apikey: key },
    });
    return res.ok;
  } catch {
    return false;
  }
}
