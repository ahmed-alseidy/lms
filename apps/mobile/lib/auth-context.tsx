import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "./api-client";
import {
  signIn as authSignIn,
  signOut as authSignOut,
  getStoredToken,
} from "./auth";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  // Add other user fields as needed
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string,
    role: "student" | "teacher"
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const token = await getStoredToken();
        if (token) {
          const res = await apiClient.get("/users/session");
          if (res.data?.user) {
            setUser(res.data.user);
          }
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const signIn = async (
    email: string,
    password: string,
    role: "student" | "teacher"
  ) => {
    await authSignIn(email, password, role);
    const res = await apiClient.get("/users/session");
    if (res.data?.user) {
      setUser(res.data.user);
    }
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
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
