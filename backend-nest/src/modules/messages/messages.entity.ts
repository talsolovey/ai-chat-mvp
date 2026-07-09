import { UserId } from '../users/user.entity';
import { Citation } from '../knowledge/knowledge.entity';

export type SenderId = UserId;

export type MessageRole = 'user' | 'assistant';

export type Message = {
  id: string;
  conversationId: string;
  role: MessageRole;
  senderId: SenderId | null;
  sentAt: string;
  content: string;
  citations?: Citation[];
};
