export type Conversation = {
  id: string;
  title: string;
  lastMessageSnippet: string;
  lastMessageAt: string;
  userId: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  sentAt: string;
  content: string;
};

export type GetConversationsResponse = Conversation[];

export type CreateConversationRequest = {
  title: string;
};

export type CreateConversationResponse = Conversation;

export type GetMessagesResponse = {
  messages: Message[];
  nextCursor: string | null;
};

export type SendMessageRequest = {
  content: string;
};

export type SendMessageResponse = Message;
