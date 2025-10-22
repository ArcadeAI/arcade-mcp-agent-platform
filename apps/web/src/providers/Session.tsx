"use client";

import React, { createContext, useContext } from "react";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut, getProviders } from "next-auth/react";
import { Session, User } from "@/lib/auth/types";

interface SessionContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (providerId?: string) => Promise<void>;
  signOut: () => Promise<{ error: null }>;
  availableProviders: string[];
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined,
);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: nextAuthSession, status } = useSession();
  const [availableProviders, setAvailableProviders] = React.useState<string[]>([]);

  // Get available providers on mount
  React.useEffect(() => {
    getProviders().then((providers) => {
      if (providers) {
        setAvailableProviders(Object.keys(providers));
      }
    });
  }, []);

  // Convert NextAuth session to our Session type
  const session: Session | null = nextAuthSession
    ? {
        user: {
          id: nextAuthSession.user?.id || "",
          email: nextAuthSession.user?.email || null,
          displayName: nextAuthSession.user?.name || null,
          avatarUrl: nextAuthSession.user?.image || null,
        },
        accessToken: (nextAuthSession as any).accessToken || null,
        refreshToken: (nextAuthSession as any).refreshToken || null,
      }
    : null;

  const user: User | null = session?.user || null;

  const handleSignIn = async (providerId?: string) => {
    // If no provider specified, use the first available one
    const provider = providerId || availableProviders[0];
    if (!provider) {
      console.error("No authentication provider configured");
      return;
    }
    await nextAuthSignIn(provider);
  };

  const handleSignOut = async () => {
    await nextAuthSignOut();
    return { error: null };
  };

  const value = {
    session,
    user,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
    signIn: handleSignIn,
    signOut: handleSignOut,
    availableProviders,
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

