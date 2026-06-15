import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useConversations } from "./useConversations";
import { server } from "../../../mocks/server";

beforeEach(() => {
  localStorage.setItem("auth.token", "mock-token-me");
});

describe("useConversations", () => {
  it("starts in a loading state and resolves with the current user's conversations sorted by lastMessageAt desc", async () => {
    const { result } = renderHook(() => useConversations());

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

  it("filters out conversations the current user does not own", async () => {
    localStorage.setItem("auth.token", "mock-token-lurker");
    const { result } = renderHook(() => useConversations());

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

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.conversationsLoading).toBe(false);
    });

    expect(result.current.conversationsError).toBeInstanceOf(Error);
    expect(result.current.conversationsError?.message).toBe("boom");
    expect(result.current.conversations).toEqual([]);
  });

  it("prepends a newly created conversation to the list", async () => {
    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.conversationsLoading).toBe(false);
    });
    expect(result.current.conversations).toHaveLength(2);

    const created = await act(() =>
      result.current.createConversation("Design sync"),
    );

    expect(created?.title).toBe("Design sync");
    expect(created?.userId).toBe("me");
    expect(result.current.conversations).toHaveLength(3);
    expect(result.current.conversations[0].title).toBe("Design sync");
  });

  it("updates a conversation's snippet/timestamp and re-sorts it to the top", async () => {
    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.conversationsLoading).toBe(false);
    });
    expect(result.current.conversations[0].id).toBe("c1");

    act(() => {
      result.current.updateConversationPreview(
        "c2",
        "Latest reply in project chat",
        "2026-05-27T12:00:00.000Z",
      );
    });

    expect(result.current.conversations[0].id).toBe("c2");
    expect(result.current.conversations[0].lastMessageSnippet).toBe(
      "Latest reply in project chat",
    );
  });
});
