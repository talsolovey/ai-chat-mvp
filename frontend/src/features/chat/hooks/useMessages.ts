import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Message, SendMessageRequest } from "../types";
import {
  messageThreadReducer,
  initialMessageThreadState,
  type MessageThreadState,
} from "./messageThreadReducer";
import { chat as chatApi } from "../../../lib/apiClient";

export type UseMessagesResult = {
  thread: MessageThreadState;
  sendMessage: (content: string) => Promise<boolean>;
  loadOlder: () => void;
  dismissSendError: () => void;
};

export function useMessages(
  conversationId: string | null,
  currentUserId: string,
): UseMessagesResult {
  const [thread, dispatch] = useReducer(
    messageThreadReducer,
    initialMessageThreadState,
  );

  const activeConversationIdRef = useRef(conversationId);
  useEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  const nextCursorRef = useRef(thread.nextCursor);
  const isLoadingOlderRef = useRef(thread.isLoadingOlder);
  useEffect(() => {
    nextCursorRef.current = thread.nextCursor;
  }, [thread.nextCursor]);
  useEffect(() => {
    isLoadingOlderRef.current = thread.isLoadingOlder;
  }, [thread.isLoadingOlder]);

  useEffect(() => {
    if (!conversationId) {
      dispatch({ type: "load/success", payload: { messages: [], nextCursor: null } });
      return;
    }

    dispatch({ type: "load/start" });
    const abortController = new AbortController();

    chatApi
      .getMessages(currentUserId, conversationId, undefined, abortController.signal)
      .then((data) => {
        dispatch({
          type: "load/success",
          payload: { messages: data.messages, nextCursor: data.nextCursor },
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        dispatch({
          type: "load/error",
          payload: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return (): void => {
      abortController.abort();
    };
  }, [conversationId, currentUserId]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!conversationId || !content.trim()) {
        return false;
      }

      const trimmed = content.trim();

      const request: SendMessageRequest = {
        content: trimmed,
      };

      const tempMessage: Message = {
        id: `temp-${crypto.randomUUID()}`,
        conversationId,
        senderId: currentUserId,
        sentAt: new Date().toISOString(),
        content: trimmed,
      };

      dispatch({ type: "send/optimistic", payload: tempMessage });

      try {
        const serverMessage = await chatApi.sendMessage(
          currentUserId,
          conversationId,
          request,
        );
        if (activeConversationIdRef.current !== conversationId) {
          return true;
        }
        dispatch({
          type: "send/success",
          payload: serverMessage,
          tempId: tempMessage.id,
        });
        return true;
      } catch (err: unknown) {
        if (activeConversationIdRef.current !== conversationId) {
          return false;
        }
        dispatch({
          type: "send/error",
          payload: err instanceof Error ? err : new Error(String(err)),
          tempId: tempMessage.id,
        });
        return false;
      }
    },
    [conversationId, currentUserId],
  );

  const loadOlder = useCallback((): void => {
    const convId = conversationId;
    const cursor = nextCursorRef.current;
    if (!convId || !cursor || isLoadingOlderRef.current) {
      return;
    }

    dispatch({ type: "older/start" });
    isLoadingOlderRef.current = true;

    chatApi
      .getMessages(currentUserId, convId, cursor)
      .then((data) => {
        if (activeConversationIdRef.current !== convId) {
          return;
        }
        dispatch({
          type: "older/success",
          payload: { messages: data.messages, nextCursor: data.nextCursor },
        });
      })
      .catch(() => {
        if (activeConversationIdRef.current !== convId) {
          return;
        }
        dispatch({ type: "older/error" });
      });
  }, [conversationId, currentUserId]);

  const dismissSendError = useCallback((): void => {
    dispatch({ type: "sendError/clear" });
  }, []);

  return { thread, sendMessage, loadOlder, dismissSendError };
}
