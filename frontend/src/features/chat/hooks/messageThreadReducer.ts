import type { Message } from "../types";

export type MessageThreadState = {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  isSending: boolean;
  sendError: Error | null;
  nextCursor: string | null;
  isLoadingOlder: boolean;
};

type Page = { messages: Message[]; nextCursor: string | null };

export type MessageThreadAction =
  | { type: "load/start" }
  | { type: "load/success"; payload: Page }
  | { type: "load/error"; payload: Error }
  | { type: "older/start" }
  | { type: "older/success"; payload: Page }
  | { type: "older/error" }
  | { type: "send/optimistic"; payload: Message }
  | { type: "send/success"; payload: Message; tempId: string }
  | { type: "send/error"; payload: Error; tempId: string }
  | { type: "sendError/clear" };

export const initialMessageThreadState: MessageThreadState = {
  messages: [],
  isLoading: false,
  error: null,
  isSending: false,
  sendError: null,
  nextCursor: null,
  isLoadingOlder: false,
};

export function messageThreadReducer(
  state: MessageThreadState,
  action: MessageThreadAction,
): MessageThreadState {
  switch (action.type) {
    case "load/start":
      return { ...initialMessageThreadState, isLoading: true };

    case "load/success":
      return {
        ...state,
        isLoading: false,
        error: null,
        messages: action.payload.messages,
        nextCursor: action.payload.nextCursor,
        isLoadingOlder: false,
      };

    case "load/error":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        messages: [],
        nextCursor: null,
        isLoadingOlder: false,
      };

    case "older/start":
      return { ...state, isLoadingOlder: true };

    case "older/success":
      return {
        ...state,
        isLoadingOlder: false,
        nextCursor: action.payload.nextCursor,
        messages: [...action.payload.messages, ...state.messages],
      };

    case "older/error":
      return { ...state, isLoadingOlder: false };

    case "send/optimistic":
      return {
        ...state,
        isSending: true,
        sendError: null,
        messages: [...state.messages, action.payload],
      };

    case "send/success":
      return {
        ...state,
        isSending: false,
        messages: [
          ...state.messages.filter((m) => m.id !== action.tempId),
          action.payload,
        ],
      };

    case "send/error":
      return {
        ...state,
        isSending: false,
        sendError: action.payload,
        messages: state.messages.filter((m) => m.id !== action.tempId),
      };

    case "sendError/clear":
      return { ...state, sendError: null };
  }
}
