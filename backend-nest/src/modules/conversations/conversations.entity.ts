import { UserId } from '../users/user.entity';

export type ConversationType = 'chat' | 'assistant' | 'tutor';

export type Conversation = {
  id: string;
  title: string;
  type: ConversationType;
  lastMessageSnippet: string;
  lastMessageAt: string;
  userId: UserId;
};
