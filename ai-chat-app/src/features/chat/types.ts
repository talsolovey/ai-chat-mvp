export type Conversation = {
  id: string;
  title: string;
  lastMessageSnippet: string;
  lastMessageAt: string;
  participantIds: string[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  sentAt: string;
  content: string;
};

export type GetConversationsResponse = Conversation[];

export type GetMessagesResponse = {
  messages: Message[];
  nextCursor: string | null;
};

export type SendMessageRequest = {
  content: string;
  senderId: string;
};

export type SendMessageResponse = Message;
