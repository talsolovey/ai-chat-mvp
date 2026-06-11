import { useCallback, useEffect, useReducer } from "react";
import type { Conversation } from "../types";
import { chat as chatApi } from "../../../lib/apiClient";

export type UseConversationsResult = {
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: Error | null;
  createConversation: (title: string) => Promise<Conversation | null>;
  updateConversationPreview: (
    conversationId: string,
    snippet: string,
    lastMessageAt: string,
  ) => void;
};

type ConversationsState = {
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: Error | null;
};

type Action =
  | { type: "load/start" }
  | { type: "load/success"; payload: Conversation[] }
  | { type: "load/error"; payload: Error }
  | { type: "create/success"; payload: Conversation }
  | {
      type: "preview/update";
      payload: {
        conversationId: string;
        snippet: string;
        lastMessageAt: string;
      };
    };

const initialState: ConversationsState = {
  conversations: [],
  conversationsLoading: true,
  conversationsError: null,
};

function sortByLastMessageDesc(items: Conversation[]): Conversation[] {
  return [...items].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

function reducer(
  state: ConversationsState,
  action: Action,
): ConversationsState {
  switch (action.type) {
    case "load/start":
      return { ...initialState, conversationsLoading: true };
    case "load/success":
      return {
        conversations: action.payload,
        conversationsLoading: false,
        conversationsError: null,
      };
    case "load/error":
      return {
        conversations: [],
        conversationsLoading: false,
        conversationsError: action.payload,
      };
    case "create/success":
      return {
        ...state,
        conversations: sortByLastMessageDesc([
          action.payload,
          ...state.conversations,
        ]),
      };
    case "preview/update":
      return {
        ...state,
        conversations: sortByLastMessageDesc(
          state.conversations.map((c) =>
            c.id === action.payload.conversationId
              ? {
                  ...c,
                  lastMessageSnippet: action.payload.snippet,
                  lastMessageAt: action.payload.lastMessageAt,
                }
              : c,
          ),
        ),
      };
  }
}

export function useConversations(): UseConversationsResult {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "load/start" });

    chatApi
      .getConversations()
      .then((conversations) => {
        dispatch({
          type: "load/success",
          payload: sortByLastMessageDesc(conversations),
        });
      })
      .catch((err: unknown) => {
        dispatch({
          type: "load/error",
          payload: err instanceof Error ? err : new Error(String(err)),
        });
      });
  }, []);

  const createConversation = useCallback(
    async (title: string): Promise<Conversation | null> => {
      const trimmed = title.trim();
      if (!trimmed) {
        return null;
      }

      const conversation = await chatApi.createConversation({
        title: trimmed,
      });
      dispatch({ type: "create/success", payload: conversation });
      return conversation;
    },
    [],
  );

  const updateConversationPreview = useCallback(
    (conversationId: string, snippet: string, lastMessageAt: string): void => {
      dispatch({
        type: "preview/update",
        payload: { conversationId, snippet, lastMessageAt },
      });
    },
    [],
  );

  return { ...state, createConversation, updateConversationPreview };
}
