export type UserId = string;

export type senderId = UserId | "system";

export type User = {
  id: UserId;
  name: string;
};

export type Conversation = {
  id: string;
  title: string;
  lastMessageSnippet: string;
  lastMessageAt: string;
  userId: UserId;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: senderId;
  sentAt: string;
  content: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type GetConversationsResponse = Conversation[];

export type GetMessagesResponse = {
  messages: Message[];
  nextCursor: string | null;
};

export type SendMessageResponse = Message;

export type CreateConversationResponse = Conversation;
