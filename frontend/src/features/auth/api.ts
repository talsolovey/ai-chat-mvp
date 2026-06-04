import fetchJson from "../../lib/fetchJson";
import type { LoginRequest, LoginResponse } from "./types";

export function login(request: LoginRequest): Promise<LoginResponse> {
  return fetchJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
