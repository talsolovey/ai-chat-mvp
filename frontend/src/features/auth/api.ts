import fetchJson from "../../lib/fetchJson";
import type { AuthResponse, LoginRequest, SignupRequest, User } from "./types";

export function signup(request: SignupRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function login(request: LoginRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function getMe(): Promise<User> {
  return fetchJson<User>("/api/me", { method: "GET" });
}
