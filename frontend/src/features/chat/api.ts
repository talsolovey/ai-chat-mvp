import fetchJson from "../../lib/fetchJson";
import type {
  GetConversationsResponse,
  GetMessagesResponse,
  SendMessageResponse,
  SendMessageRequest,
  CreateConversationRequest,
  CreateConversationResponse,
} from "./types";

export function getConversations(
  userId: string,
): Promise<GetConversationsResponse> {
  return fetchJson<GetConversationsResponse>("/api/conversations", {
    method: "GET",
    headers: {
      "x-user-id": userId,
    },
  });
}

export function createConversation(
  userId: string,
  request: CreateConversationRequest,
): Promise<CreateConversationResponse> {
  return fetchJson<CreateConversationResponse>("/api/conversations", {
    method: "POST",
    headers: {
      "x-user-id": userId,
    },
    body: JSON.stringify(request),
  });
}

export function getMessages(
  userId: string,
  conversationId: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<GetMessagesResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const init: RequestInit = {
    method: "GET",
    headers: {
      "x-user-id": userId,
    },
  };
  if (signal) {
    init.signal = signal;
  }
  return fetchJson<GetMessagesResponse>(
    `/api/conversations/${conversationId}/messages${query}`,
    init,
  );
}

export function sendMessage(
  userId: string,
  conversationId: string,
  request: SendMessageRequest,
): Promise<SendMessageResponse> {
  return fetchJson<SendMessageResponse>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
      body: JSON.stringify(request),
    },
  );
}
