import { useEffect, useReducer } from "react";
import type { Conversation } from "../types";
import type { User } from "../../auth/types";
import { chat as chatApi } from "../../../lib/apiClient";

export type UseConversationsResult = {
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: Error | null;
};

type Action =
  | { type: "load/start" }
  | { type: "load/success"; payload: Conversation[] }
  | { type: "load/error"; payload: Error };

const initialState: UseConversationsResult = {
  conversations: [],
  conversationsLoading: true,
  conversationsError: null,
};

function reducer(
  _state: UseConversationsResult,
  action: Action,
): UseConversationsResult {
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
  }
}

export function useConversations(currentUser: User): UseConversationsResult {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "load/start" });

    chatApi
      .getConversations(currentUser.id)
      .then((data) => {
        const sorted = [...data].sort((a, b) =>
          b.lastMessageAt.localeCompare(a.lastMessageAt),
        );

        dispatch({ type: "load/success", payload: sorted });
      })
      .catch((err: unknown) => {
        dispatch({
          type: "load/error",
          payload: err instanceof Error ? err : new Error(String(err)),
        });
      });
  }, [currentUser.id]);

  return state;
}
