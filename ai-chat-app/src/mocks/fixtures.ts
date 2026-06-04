import type { User } from "../features/auth/types";
import type { Conversation, Message } from "../features/chat/types";

export const users: User[] = [
  { id: "me", name: "Me" },
  { id: "support", name: "Support" },
  { id: "teammate", name: "Teammate" },
];

export const conversations: Conversation[] = [
  {
    id: "c1",
    title: "Frontend Support",
    lastMessageSnippet: "There it is. Stabilize that and you're good.",
    lastMessageAt: "2026-05-26T10:00:00.000Z",
    participantIds: ["me", "support"],
  },
  {
    id: "c2",
    title: "Project Chat",
    lastMessageSnippet: "Let's ship the MVP this week.",
    lastMessageAt: "2026-05-25T18:30:00.000Z",
    participantIds: ["me", "teammate"],
  },
];

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
    senderId: "support",
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
    senderId: "support",
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
    senderId: "support",
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
    senderId: "support",
    sentAt: "2026-05-26T10:00:00.000Z",
    content: "There it is. Stabilize that and you're good.",
  },
  {
    id: "m9",
    conversationId: "c2",
    senderId: "me",
    sentAt: "2026-05-25T18:00:00.000Z",
    content: "How are we doing on the chat MVP?",
  },
  {
    id: "m10",
    conversationId: "c2",
    senderId: "teammate",
    sentAt: "2026-05-25T18:30:00.000Z",
    content: "Let's ship the MVP this week.",
  },
];

export const messages: Message[] = [...seedMessages];

export function resetMessages(): void {
  messages.length = 0;
  messages.push(...seedMessages);
}

export const MESSAGES_PAGE_SIZE = 3;
