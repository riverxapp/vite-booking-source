import { createContext } from "react";
import type { AuthUser, ProfileInput, SignUpInput } from "./api";

export type AuthContextValue = {
  user: AuthUser | null;
  /** True until the first session check finishes. */
  loading: boolean;
  /** Set when the auth API itself is unreachable or misconfigured. */
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: SignUpInput) => Promise<AuthUser>;
  resetPassword: (token: string, password: string) => Promise<AuthUser>;
  updateProfile: (input: ProfileInput) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
