import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Message, SendMessageRequest } from "../types";
import {
  messageThreadReducer,
  initialMessageThreadState,
  type MessageThreadState,
} from "./messageThreadReducer";
import { messages as messagesApi } from "../../../lib/apiClient";

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
      dispatch({
        type: "load/success",
        payload: { messages: [], nextCursor: null },
      });
      return;
    }

    dispatch({ type: "load/start" });
    const abortController = new AbortController();

    messagesApi
      .getMessages(conversationId, undefined, abortController.signal)
      .then((firstPage) => {
        dispatch({
          type: "load/success",
          payload: {
            messages: firstPage.messages,
            nextCursor: firstPage.nextCursor,
          },
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

      const trimmedContent = content.trim();
      const nowIso = new Date().toISOString();

      const userMessageTempId = `temp-${crypto.randomUUID()}`;
      const optimisticUserMessage: Message = {
        id: userMessageTempId,
        conversationId,
        senderId: currentUserId,
        sentAt: nowIso,
        content: trimmedContent,
      };
      dispatch({ type: "send/optimistic", payload: optimisticUserMessage });

      const assistantMessageTempId = `assistant-temp-${crypto.randomUUID()}`;
      const assistantPlaceholderMessage: Message = {
        id: assistantMessageTempId,
        conversationId,
        senderId: null,
        sentAt: nowIso,
        content: "",
      };

      const sendMessageRequest: SendMessageRequest = {
        content: trimmedContent,
      };
      let streamFailed = false;
      let assistantBubbleStarted = false;

      await messagesApi.streamAssistantMessage(
        conversationId,
        sendMessageRequest,
        {
          onToken: (tokenText) => {
            if (activeConversationIdRef.current !== conversationId) {
              return;
            }
            if (!assistantBubbleStarted) {
              assistantBubbleStarted = true;
              dispatch({
                type: "assistant/start",
                payload: {
                  ...assistantPlaceholderMessage,
                  content: tokenText,
                },
              });
              return;
            }
            dispatch({
              type: "assistant/token",
              payload: { id: assistantMessageTempId, text: tokenText },
            });
          },
          onDone: (completedMessage) => {
            if (activeConversationIdRef.current !== conversationId) {
              return;
            }
            dispatch({
              type: "assistant/done",
              tempId: assistantMessageTempId,
              payload: completedMessage,
            });
          },
          onError: (errorMessage) => {
            streamFailed = true;
            if (activeConversationIdRef.current !== conversationId) {
              return;
            }
            dispatch({
              type: "assistant/error",
              payload: new Error(errorMessage),
              userTempId: userMessageTempId,
              assistantTempId: assistantMessageTempId,
            });
          },
        },
      );

      return !streamFailed;
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

    messagesApi
      .getMessages(convId, cursor)
      .then((olderPage) => {
        if (activeConversationIdRef.current !== convId) {
          return;
        }
        dispatch({
          type: "older/success",
          payload: {
            messages: olderPage.messages,
            nextCursor: olderPage.nextCursor,
          },
        });
      })
      .catch(() => {
        if (activeConversationIdRef.current !== convId) {
          return;
        }
        dispatch({ type: "older/error" });
      });
  }, [conversationId]);

  const dismissSendError = useCallback((): void => {
    dispatch({ type: "sendError/clear" });
  }, []);

  return { thread, sendMessage, loadOlder, dismissSendError };
}
