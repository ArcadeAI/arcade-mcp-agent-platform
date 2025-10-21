import {
  AuthProvider,
  AuthCredentials,
  AuthError,
  Session,
  User,
  AuthStateChangeCallback,
} from "./types";

export class MockAuthProvider implements AuthProvider {
  private mockUser: User = {
    id: "mock-user-id",
    email: "test@example.com",
    displayName: "Test User",
    firstName: "Test",
    lastName: "User",
  };

  private mockSession: Session = {
    user: this.mockUser,
    accessToken: "mock-token",
  };

  async signUp(_credentials: AuthCredentials) {
    return {
      user: this.mockUser,
      session: this.mockSession,
      error: null,
    };
  }

  async signIn(_credentials: AuthCredentials) {
    return {
      user: this.mockUser,
      session: this.mockSession,
      error: null,
    };
  }

  async signInWithGoogle() {
    return {
      user: this.mockUser,
      session: this.mockSession,
      error: null,
    };
  }

  async signOut() {
    return { error: null };
  }

  async getSession() {
    return this.mockSession;
  }

  async refreshSession() {
    return this.mockSession;
  }

  async getCurrentUser() {
    return this.mockUser;
  }

  async updateUser(_attributes: Partial<User>) {
    return {
      user: this.mockUser,
      error: null,
    };
  }

  async resetPassword(_email: string) {
    return { error: null };
  }

  async updatePassword(_newPassword: string) {
    return { error: null };
  }

  onAuthStateChange(_callback: AuthStateChangeCallback) {
    return {
      unsubscribe: () => {},
    };
  }
}

