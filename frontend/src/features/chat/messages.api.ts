import fetchJson from "../../lib/fetchJson";
import type {
  GetMessagesResponse,
  SendMessageResponse,
  SendMessageRequest,
} from "./types";

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
