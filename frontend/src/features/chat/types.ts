export type ConversationType = "chat" | "assistant";

export type Conversation = {
  id: string;
  title: string;
  type: ConversationType;
  lastMessageSnippet: string;
  lastMessageAt: string;
  userId: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string | null;
  sentAt: string;
  content: string;
};

export type GetConversationsResponse = Conversation[];

export type CreateConversationRequest = {
  title: string;
  type?: ConversationType;
};

export type AssistantStreamEvent =
  | { type: "token"; text: string }
  | { type: "done"; messageId: string; sentAt: string }
  | { type: "error"; message: string };

export type CreateConversationResponse = Conversation;

export type GetMessagesResponse = {
  messages: Message[];
  nextCursor: string | null;
};

export type SendMessageRequest = {
  content: string;
};
