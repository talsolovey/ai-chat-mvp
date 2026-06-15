import fetchJson from "../../lib/fetchJson";
import type {
  GetConversationsResponse,
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
