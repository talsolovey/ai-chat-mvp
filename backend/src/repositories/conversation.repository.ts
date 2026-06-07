import type { Conversation } from "../domain/models";
import { conversations } from "../data/inMemoryStore";

export const conversationRepository = {
  findAllConversations(): Conversation[] {
    return Array.from(conversations.values());
  },

  findConversationById(id: string): Conversation | undefined {
    return conversations.get(id);
  },

  saveConversation(conversation: Conversation): void {
    conversations.set(conversation.id, conversation);
  },
};
