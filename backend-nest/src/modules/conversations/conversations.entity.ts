import { UserId } from '../users/user.entity';

export type Conversation = {
  id: string;
  title: string;
  lastMessageSnippet: string;
  lastMessageAt: string;
  userId: UserId;
};
