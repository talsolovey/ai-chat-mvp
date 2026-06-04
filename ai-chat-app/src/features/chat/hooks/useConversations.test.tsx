import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useConversations } from "./useConversations";
import { server } from "../../../mocks/server";
import type { User } from "../../auth/types";

const me: User = { id: "me", name: "Me" };

describe("useConversations", () => {
  it("starts in a loading state and resolves with the current user's conversations sorted by lastMessageAt desc", async () => {
    const { result } = renderHook(() => useConversations(me));

    expect(result.current.conversationsLoading).toBe(true);
    expect(result.current.conversations).toEqual([]);
    expect(result.current.conversationsError).toBeNull();

    await waitFor(() => {
      expect(result.current.conversationsLoading).toBe(false);
    });

    expect(result.current.conversations).toHaveLength(2);
    expect(result.current.conversations[0].id).toBe("c1");
    expect(result.current.conversations[1].id).toBe("c2");
    expect(result.current.conversationsError).toBeNull();
  });

  it("filters out conversations the current user is not a participant in", async () => {
    const lurker: User = { id: "lurker", name: "Lurker" };
    const { result } = renderHook(() => useConversations(lurker));

    await waitFor(() => {
      expect(result.current.conversationsLoading).toBe(false);
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.conversationsError).toBeNull();
  });

  it("captures fetch errors in conversationsError and parses the {error.message} body", async () => {
    server.use(
      http.get("/api/conversations", () => {
        return HttpResponse.json(
          { error: { code: "INTERNAL", message: "boom" } },
          { status: 500 },
        );
      }),
    );

    const { result } = renderHook(() => useConversations(me));

    await waitFor(() => {
      expect(result.current.conversationsLoading).toBe(false);
    });

    expect(result.current.conversationsError).toBeInstanceOf(Error);
    expect(result.current.conversationsError?.message).toBe("boom");
    expect(result.current.conversations).toEqual([]);
  });
});
