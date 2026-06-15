import type { Message } from "../domain/models";
import { messages } from "../data/inMemoryStore";

export const messageRepository = {
  findAllMessages(): Message[] {
    return Array.from(messages.values());
  },

  saveMessage(message: Message): void {
    messages.set(message.id, message);
  },
};
