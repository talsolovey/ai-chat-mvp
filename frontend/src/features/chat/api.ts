import fetchJson from "../../lib/fetchJson";
import type {
  GetConversationsResponse,
  GetMessagesResponse,
  SendMessageResponse,
  SendMessageRequest,
  CreateConversationRequest,
  CreateConversationResponse,
} from "./types";

export function getConversations(): Promise<GetConversationsResponse> {
  return fetchJson<GetConversationsResponse>("/api/conversations", {
    method: "GET",
  });
}

export function createConversation(
  request: CreateConversationRequest,
): Promise<CreateConversationResponse> {
  return fetchJson<CreateConversationResponse>("/api/conversations", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function getMessages(
  conversationId: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<GetMessagesResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const init: RequestInit = {
    method: "GET",
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
  conversationId: string,
  request: SendMessageRequest,
): Promise<SendMessageResponse> {
  return fetchJson<SendMessageResponse>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}
