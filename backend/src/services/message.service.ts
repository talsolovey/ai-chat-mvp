import type {
  Message,
  GetMessagesResponse,
  SendMessageResponse,
} from "../domain/models";
import { idGenerator } from "../data/inMemoryStore";
import { messageRepository } from "../repositories/message.repository";
import { conversationRepository } from "../repositories/conversation.repository";
import { assertConversationOwnedBy } from "./conversation.service";
import { DEFAULT_PAGE_SIZE } from "../validation/schemas";

export function getMessagesForConversation(
  conversationId: string,
  userId: string,
  cursor: string | undefined,
  limit: number | undefined,
): GetMessagesResponse {
  assertConversationOwnedBy(conversationId, userId);

  const pageSize = limit ?? DEFAULT_PAGE_SIZE;

  const sortedMessages = messageRepository
    .findAllMessages()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  return paginateMessages(sortedMessages, cursor, pageSize);
}

function paginateMessages(
  sortedMessages: Message[],
  cursor: string | undefined,
  pageSize: number,
): GetMessagesResponse {
  const cursorIndex = cursor
    ? sortedMessages.findIndex((m) => m.id === cursor)
    : -1;
  const startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;

  const page = sortedMessages.slice(startIndex, startIndex + pageSize);
  const reachedEnd = startIndex + pageSize >= sortedMessages.length;
  const lastMessageInPage = page[page.length - 1];
  const nextCursor =
    reachedEnd || !lastMessageInPage ? null : lastMessageInPage.id;

  return { messages: page, nextCursor };
}

export function createMessage(
  conversationId: string,
  userId: string,
  content: string,
): SendMessageResponse {
  assertConversationOwnedBy(conversationId, userId);

  const now = new Date().toISOString();
  const id = `m-${idGenerator.generateId()}`;

  const message: Message = {
    id,
    conversationId,
    senderId: userId,
    sentAt: now,
    content,
  };
  messageRepository.saveMessage(message);

  addMessageToConversation(conversationId, message);

  return message;
}

function addMessageToConversation(
  conversationId: string,
  message: Message,
): void {
  const conversation =
    conversationRepository.findConversationById(conversationId);
  if (!conversation) {
    return;
  }
  conversation.lastMessageSnippet = message.content;
  conversation.lastMessageAt = message.sentAt;
  conversationRepository.saveConversation(conversation);
}
