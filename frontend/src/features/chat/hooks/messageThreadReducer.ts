import type { Citation, Message } from "../types";

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
  | { type: "assistant/start"; payload: Message }
  | { type: "assistant/token"; payload: { id: string; text: string } }
  | {
      type: "assistant/citations";
      payload: { id: string; citations: Citation[] };
    }
  | {
      type: "assistant/done";
      tempId: string;
      payload: { messageId: string; sentAt: string };
    }
  | {
      type: "assistant/error";
      payload: Error;
      userTempId: string;
      assistantTempId: string;
    }
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

    case "assistant/start":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case "assistant/token":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload.id
            ? { ...message, content: message.content + action.payload.text }
            : message,
        ),
      };

    case "assistant/citations":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload.id
            ? { ...message, citations: action.payload.citations }
            : message,
        ),
      };

    case "assistant/done":
      return {
        ...state,
        isSending: false,
        messages: state.messages.map((message) =>
          message.id === action.tempId
            ? {
                ...message,
                id: action.payload.messageId,
                sentAt: action.payload.sentAt,
              }
            : message,
        ),
      };

    case "assistant/error":
      return {
        ...state,
        isSending: false,
        sendError: action.payload,
        messages: state.messages.filter(
          (message) =>
            message.id !== action.userTempId &&
            message.id !== action.assistantTempId,
        ),
      };

    case "sendError/clear":
      return { ...state, sendError: null };
  }
}
