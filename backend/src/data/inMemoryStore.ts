import type { Conversation, Message, User } from "../domain/models";
import { mockUsers, mockConversations, mockMessages } from "./mockData";

let nextId = 100;
function generateId(): string {
  return String(nextId++);
}

export const users = new Map<string, User>();
export const conversations = new Map<string, Conversation>();
export const messages = new Map<string, Message>();

for (const user of mockUsers) {
  users.set(user.id, user);
}

for (const convo of mockConversations) {
  conversations.set(convo.id, convo);
}

for (const msg of mockMessages) {
  messages.set(msg.id, msg);
}

export const idGenerator = { generateId };
