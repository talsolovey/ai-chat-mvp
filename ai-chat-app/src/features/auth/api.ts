import fetchJson from "../../lib/fetchJson";
import type { GetAvailableUsersResponse } from "./types";

export function getAvailableUsers(): Promise<GetAvailableUsersResponse> {
    return fetchJson<GetAvailableUsersResponse>("/api/auth/users", {
        method: "GET",
    });
}
