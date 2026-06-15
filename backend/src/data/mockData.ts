import type { User, Conversation, Message } from "../domain/models";

export const mockUsers: User[] = [{ id: "me", name: "Me" }];

const seedConversations: ReadonlyArray<Conversation> = [
  {
    id: "c1",
    title: "Frontend Support",
    lastMessageSnippet: "There it is. Stabilize that and you're good.",
    lastMessageAt: "2026-05-26T10:00:00.000Z",
    userId: "me",
  },
];

export const mockConversations: Conversation[] = [...seedConversations];

const seedMessages: ReadonlyArray<Message> = [
  {
    id: "m1",
    conversationId: "c1",
    senderId: "me",
    sentAt: "2026-05-26T09:40:00.000Z",
    content: "Hey, I need help with a React bug.",
  },
  {
    id: "m2",
    conversationId: "c1",
    senderId: "system",
    sentAt: "2026-05-26T09:42:00.000Z",
    content: "Sure — what's happening?",
  },
  {
    id: "m3",
    conversationId: "c1",
    senderId: "me",
    sentAt: "2026-05-26T09:45:00.000Z",
    content: "A useEffect keeps re-firing in a loop.",
  },
  {
    id: "m4",
    conversationId: "c1",
    senderId: "system",
    sentAt: "2026-05-26T09:48:00.000Z",
    content: "What's in the dependency array?",
  },
  {
    id: "m5",
    conversationId: "c1",
    senderId: "me",
    sentAt: "2026-05-26T09:50:00.000Z",
    content: "An object I build inside the component.",
  },
  {
    id: "m6",
    conversationId: "c1",
    senderId: "system",
    sentAt: "2026-05-26T09:53:00.000Z",
    content: "Are the deps in the useEffect stable?",
  },
  {
    id: "m7",
    conversationId: "c1",
    senderId: "me",
    sentAt: "2026-05-26T09:57:00.000Z",
    content: "Good point, the object is a new ref each render.",
  },
  {
    id: "m8",
    conversationId: "c1",
    senderId: "system",
    sentAt: "2026-05-26T10:00:00.000Z",
    content: "There it is. Stabilize that and you're good.",
  },
];

export const mockMessages: Message[] = [...seedMessages];
