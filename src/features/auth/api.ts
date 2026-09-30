import { apiRequest } from "@/lib/api";

/** Talks to the server auth API (server/auth.ts). The session is an httpOnly cookie. */

export type Role = "admin" | "agent" | "customer";

/** `profileId` is users.id for admins and agents, customers.id for customers. */
export type AuthUser = { id: number; role: Role; profileId: number; name: string; email: string; avatar: string | null };

export type SignUpInput = { name: string; email: string; password: string };
export type AgentSignUpInput = SignUpInput & { code?: string };
export type ProfileInput = { name: string; email: string; avatar: string };

type UserResponse = { user: AuthUser | null };

export const isStaff = (user: AuthUser | null) => user?.role === "admin" || user?.role === "agent";

/** Where each role lands after logging in. */
export const homeFor = (user: AuthUser) => (isStaff(user) ? "/app" : "/portal");

export async function fetchSession() {
  const { user } = await apiRequest<UserResponse>("auth/me");
  return user;
}

export async function signIn(email: string, password: string) {
  const { user } = await apiRequest<UserResponse>("auth/login", { method: "POST", body: { email, password } });
  return user!;
}

export async function signUp(input: SignUpInput) {
  const { user } = await apiRequest<UserResponse>("auth/signup", { method: "POST", body: input });
  return user!;
}

export async function signUpAgent(input: AgentSignUpInput) {
  const { user } = await apiRequest<UserResponse>("auth/agent-signup", { method: "POST", body: input });
  return user!;
}

export async function signOut() {
  await apiRequest("auth/logout", { method: "POST", body: {} });
}

/** Always resolves the same way for known and unknown emails. `devResetUrl` is only set outside production. */
export async function requestPasswordReset(email: string) {
  return apiRequest<{ ok: true; devResetUrl?: string }>("auth/forgot-password", { method: "POST", body: { email } });
}

export async function resetPassword(token: string, password: string) {
  const { user } = await apiRequest<UserResponse>("auth/reset-password", { method: "POST", body: { token, password } });
  return user!;
}

export async function updateProfile(input: ProfileInput) {
  const { user } = await apiRequest<UserResponse>("auth/profile", { method: "POST", body: input });
  return user!;
}
