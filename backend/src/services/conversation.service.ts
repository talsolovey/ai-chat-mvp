import type {
  Conversation,
  CreateConversationResponse,
  GetConversationsResponse,
} from "../domain/models";
import { idGenerator } from "../data/inMemoryStore";
import { conversationRepository } from "../repositories/conversation.repository";
import { AppError } from "../lib/AppError";

export function getConversationsForUser(
  userId: string,
): GetConversationsResponse {
  const allConversations = conversationRepository.findAllConversations();

  const userConversations = allConversations.filter((c) => c.userId === userId);

  userConversations.sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );

  return userConversations;
}

export function createConversationForUser(
  userId: string,
  title: string,
): CreateConversationResponse {
  const now = new Date().toISOString();
  const id = `c-${idGenerator.generateId()}`;

  const conversation: Conversation = {
    id,
    title,
    lastMessageSnippet: "",
    lastMessageAt: now,
    userId,
  };

  conversationRepository.saveConversation(conversation);
  return conversation;
}

export function assertConversationOwnedBy(
  conversationId: string,
  userId: string,
): void {
  const conversation =
    conversationRepository.findConversationById(conversationId);
  if (!conversation) {
    throw AppError.notFound("Conversation not found", { conversationId });
  }
  if (conversation.userId !== userId) {
    throw AppError.forbidden("You do not own this conversation");
  }
}
