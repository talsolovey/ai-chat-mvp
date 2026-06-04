import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useMessages, type UseMessagesResult } from "./useMessages";
import { server } from "../../../mocks/server";

async function renderAndLoad(
  conversationId: string,
  userId = "me",
): Promise<{ current: UseMessagesResult }> {
  const { result } = renderHook(() => useMessages(conversationId, userId));
  await waitFor(() => {
    expect(result.current.thread.isLoading).toBe(false);
  });
  return result;
}

describe("useMessages", () => {
  it("returns an empty thread synchronously when conversationId is null", () => {
    const { result } = renderHook(() => useMessages(null, "me"));

    expect(result.current.thread.messages).toEqual([]);
    expect(result.current.thread.isLoading).toBe(false);
    expect(result.current.thread.error).toBeNull();
    expect(result.current.thread.sendError).toBeNull();
  });

  it("loads the newest page of messages for a real conversationId", async () => {
    const { result } = renderHook(() => useMessages("c1", "me"));

    expect(result.current.thread.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.thread.isLoading).toBe(false);
    });

    expect(result.current.thread.messages.map((m) => m.id)).toEqual([
      "m6",
      "m7",
      "m8",
    ]);
    expect(result.current.thread.error).toBeNull();
  });

  it("captures load errors in thread.error and leaves messages empty", async () => {
    server.use(
      http.get("/api/conversations/:id/messages", () => {
        return HttpResponse.json(
          { error: { code: "INTERNAL", message: "load failed" } },
          { status: 500 },
        );
      }),
    );

    const result = await renderAndLoad("c1");

    expect(result.current.thread.error).toBeInstanceOf(Error);
    expect(result.current.thread.error?.message).toBe("load failed");
    expect(result.current.thread.messages).toEqual([]);
  });

  it("optimistically appends a temp message and replaces it with the server response on success", async () => {
    const result = await renderAndLoad("c1");
    const initialCount = result.current.thread.messages.length;

    let sendPromise!: Promise<void>;
    await act(async () => {
      sendPromise = result.current.sendMessage("hello world");
    });

    expect(result.current.thread.messages).toHaveLength(initialCount + 1);
    const tempMessage = result.current.thread.messages.at(-1)!;
    expect(tempMessage.content).toBe("hello world");
    expect(tempMessage.id).toMatch(/^temp-/);
    expect(result.current.thread.isSending).toBe(true);

    await act(async () => {
      await sendPromise;
    });

    expect(result.current.thread.isSending).toBe(false);
    expect(result.current.thread.messages).toHaveLength(initialCount + 1);
    const finalMessage = result.current.thread.messages.at(-1)!;
    expect(finalMessage.content).toBe("hello world");
    expect(finalMessage.id).not.toMatch(/^temp-/);
    expect(result.current.thread.sendError).toBeNull();
  });

  it("rolls back the optimistic message and sets sendError when the server returns an error", async () => {
    const result = await renderAndLoad("c1");
    const initialCount = result.current.thread.messages.length;

    let sendPromise!: Promise<void>;
    await act(async () => {
      sendPromise = result.current.sendMessage("/fail please");
    });

    expect(result.current.thread.messages).toHaveLength(initialCount + 1);

    await act(async () => {
      await sendPromise;
    });

    expect(result.current.thread.messages).toHaveLength(initialCount);
    expect(result.current.thread.isSending).toBe(false);
    expect(result.current.thread.sendError).toBeInstanceOf(Error);
    expect(result.current.thread.sendError?.message).toMatch(
      /Simulated send failure/,
    );
  });

  it("dismissSendError clears thread.sendError", async () => {
    const result = await renderAndLoad("c1");

    await act(async () => {
      await result.current.sendMessage("/fail");
    });

    expect(result.current.thread.sendError).not.toBeNull();

    act(() => {
      result.current.dismissSendError();
    });

    expect(result.current.thread.sendError).toBeNull();
  });

  it("ignores empty / whitespace-only sendMessage calls", async () => {
    const result = await renderAndLoad("c1");
    const initialCount = result.current.thread.messages.length;

    await act(async () => {
      await result.current.sendMessage("   ");
    });

    expect(result.current.thread.messages).toHaveLength(initialCount);
    expect(result.current.thread.isSending).toBe(false);
    expect(result.current.thread.sendError).toBeNull();
  });
});
