export type ConversationType = "chat" | "assistant" | "tutor";

export type Conversation = {
  id: string;
  title: string;
  type: ConversationType;
  lastMessageSnippet: string;
  lastMessageAt: string;
  userId: string;
};

export type Citation = {
  chunkId: string;
  documentId: string;
  documentName: string;
  chunkText: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string | null;
  sentAt: string;
  content: string;
  citations?: Citation[];
};

export type GetConversationsResponse = Conversation[];

export type CreateConversationRequest = {
  title: string;
  type?: ConversationType;
};

export type AssistantStreamEvent =
  | { type: "token"; text: string }
  | { type: "tool_call"; name: string }
  | { type: "tool_result"; name: string }
  | { type: "citations"; citations: Citation[] }
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
