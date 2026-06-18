import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import fetchJson, {
  ApiError,
  NETWORK_ERROR_MESSAGE,
  SERVER_ERROR_MESSAGE,
} from "./fetchJson";
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

describe("fetchJson friendly errors", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reports a friendly network error when the server is unreachable", async () => {
    server.use(http.post("/api/auth/signup", () => HttpResponse.error()));

    await expect(
      fetchJson("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: "A", email: "a@b.com", password: "x" }),
      }),
    ).rejects.toMatchObject({ message: NETWORK_ERROR_MESSAGE, status: 0 });
  });

  it("reports a friendly message for a non-JSON 502 (e.g. dev proxy)", async () => {
    server.use(
      http.post(
        "/api/auth/signup",
        () => new HttpResponse("<html>502 Bad Gateway</html>", { status: 502 }),
      ),
    );

    await expect(
      fetchJson("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: "A", email: "a@b.com", password: "x" }),
      }),
    ).rejects.toMatchObject({ message: SERVER_ERROR_MESSAGE, status: 502 });
  });

  it("preserves the backend message for client errors", async () => {
    server.use(
      http.post("/api/auth/signup", () =>
        HttpResponse.json(
          { error: { code: "CONFLICT", message: "Email already in use" } },
          { status: 409 },
        ),
      ),
    );

    await expect(
      fetchJson("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: "A", email: "a@b.com", password: "x" }),
      }),
    ).rejects.toThrow("Email already in use");
  });

  it("throws an ApiError carrying the HTTP status", async () => {
    server.use(
      http.get("/api/conversations", () =>
        HttpResponse.json(
          { error: { code: "INTERNAL", message: "boom" } },
          { status: 500 },
        ),
      ),
    );

    await expect(
      fetchJson("/api/conversations", { method: "GET" }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
