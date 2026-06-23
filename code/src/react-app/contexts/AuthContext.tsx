import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  is_active: number;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const sessionToken = localStorage.getItem("sessionToken");
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: sessionToken ? { "X-Session-Token": sessionToken } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include"
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Falha no login");
    }

    const data = await response.json();
    // Store session token in localStorage for Vite dev server compatibility
    if (data.sessionToken) {
      localStorage.setItem("sessionToken", data.sessionToken);
    }
    setUser(data.user);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { 
      method: "POST",
      credentials: "include"
    });
    localStorage.removeItem("sessionToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
