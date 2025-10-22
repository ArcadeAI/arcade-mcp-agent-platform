import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

// Extend NextAuth types to include our custom properties
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  }
  interface JWT {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  }
}

// Configure available identity providers based on environment variables
const getProviders = () => {
  const providers: any[] = [];

  // Okta configuration
  if (
    process.env.OKTA_CLIENT_ID &&
    process.env.OKTA_CLIENT_SECRET &&
    process.env.OKTA_ISSUER
  ) {
    providers.push({
      id: "okta",
      name: "Okta",
      type: "oidc",
      clientId: process.env.OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET,
      issuer: process.env.OKTA_ISSUER,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      checks: ["state", "pkce"],
      profile(profile: any) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
      },
    });
  }

  // Microsoft Entra ID (formerly Azure AD) configuration
  if (
    process.env.ENTRA_CLIENT_ID &&
    process.env.ENTRA_CLIENT_SECRET &&
    process.env.ENTRA_TENANT_ID
  ) {
    providers.push({
      id: "entra-id",
      name: "Microsoft Entra ID",
      type: "oidc",
      clientId: process.env.ENTRA_CLIENT_ID,
      clientSecret: process.env.ENTRA_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      checks: ["state", "pkce"],
      profile(profile: any) {
        return {
          id: profile.sub,
          email: profile.email || profile.preferred_username,
          name: profile.name,
          image: profile.picture,
        };
      },
    });
  }

  // PingID configuration
  if (
    process.env.PING_CLIENT_ID &&
    process.env.PING_CLIENT_SECRET &&
    process.env.PING_ISSUER
  ) {
    providers.push({
      id: "ping",
      name: "PingID",
      type: "oidc",
      clientId: process.env.PING_CLIENT_ID,
      clientSecret: process.env.PING_CLIENT_SECRET,
      issuer: process.env.PING_ISSUER,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      checks: ["state", "pkce"],
      profile(profile: any) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
          image: profile.picture,
        };
      },
    });
  }

  return providers;
};

export const authConfig: NextAuthConfig = {
  providers: getProviders(),
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === "/";
      
      // Allow access to all pages when logged in
      if (isLoggedIn) {
        return true;
      }
      
      // For development: allow access without login
      if (process.env.NODE_ENV === "development" && !isLoggedIn) {
        return true;
      }
      
      // Redirect to root for login
      return isOnRoot;
    },
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      // Pass tokens to the session
      if (token.accessToken && typeof token.accessToken === 'string') {
        session.accessToken = token.accessToken;
      }
      if (token.idToken && typeof token.idToken === 'string') {
        session.idToken = token.idToken;
      }
      if (token.refreshToken && typeof token.refreshToken === 'string') {
        session.refreshToken = token.refreshToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  useSecureCookies: false,
  debug: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

