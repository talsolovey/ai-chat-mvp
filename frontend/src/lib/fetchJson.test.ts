import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import fetchJson from "./fetchJson";
import { getToken, setToken } from "./tokenStorage";
import { onUnauthorized } from "./authEvents";

describe("fetchJson 401 handling", () => {
  let unsubscribe: () => void = () => {};

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    unsubscribe();
    unsubscribe = () => {};
  });

  it("clears the token and notifies on a 401 when a token was sent", async () => {
    setToken("dead-token");
    const onUnauth = vi.fn();
    unsubscribe = onUnauthorized(onUnauth);

    server.use(
      http.get("/api/conversations", () =>
        HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "expired" } },
          { status: 401 },
        ),
      ),
    );

    await expect(
      fetchJson("/api/conversations", { method: "GET" }),
    ).rejects.toThrow();

    expect(getToken()).toBeNull();
    expect(onUnauth).toHaveBeenCalledTimes(1);
  });

  it("does not clear or notify on a 401 with no token (e.g. failed login)", async () => {
    const onUnauth = vi.fn();
    unsubscribe = onUnauthorized(onUnauth);

    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
          { status: 401 },
        ),
      ),
    );

    await expect(
      fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", password: "nope" }),
      }),
    ).rejects.toThrow();

    expect(onUnauth).not.toHaveBeenCalled();
  });

  it("passes a successful response through without clearing the token", async () => {
    setToken("good-token");
    const onUnauth = vi.fn();
    unsubscribe = onUnauthorized(onUnauth);

    server.use(
      http.get("/api/conversations", () => HttpResponse.json([])),
    );

    await expect(
      fetchJson("/api/conversations", { method: "GET" }),
    ).resolves.toEqual([]);

    expect(getToken()).toBe("good-token");
    expect(onUnauth).not.toHaveBeenCalled();
  });
});
