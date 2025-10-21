"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { MockAuthProvider } from "@/lib/auth/mock-provider";
import {
  AuthProvider as CustomAuthProvider,
  Session,
  User,
  AuthCredentials,
  AuthError,
} from "@/lib/auth/types";

interface SessionContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: AuthCredentials) => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;
  signUp: (credentials: AuthCredentials) => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;
  signInWithGoogle: () => Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateUser: (attributes: Partial<User>) => Promise<{
    user: User | null;
    error: AuthError | null;
  }>;
}

const mockProvider = new MockAuthProvider();

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined,
);

export function SessionProvider({
  children,
  customAuthProvider,
}: {
  children: React.ReactNode;
  customAuthProvider?: CustomAuthProvider;
}) {
  const provider = customAuthProvider || mockProvider;

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentSession = await provider.getSession();
        setSession(currentSession);

        if (currentSession?.user) {
          setUser(currentSession.user);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [provider]);

  useEffect(() => {
    const { unsubscribe } = provider.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    return () => {
      unsubscribe();
    };
  }, [provider]);

  const value = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session?.user,
    signIn: provider.signIn.bind(provider),
    signUp: provider.signUp.bind(provider),
    signInWithGoogle: provider.signInWithGoogle.bind(provider),
    signOut: provider.signOut.bind(provider),
    resetPassword: provider.resetPassword.bind(provider),
    updatePassword: provider.updatePassword.bind(provider),
    updateUser: provider.updateUser.bind(provider),
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }

  return context;
}

