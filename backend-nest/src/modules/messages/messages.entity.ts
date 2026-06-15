import { UserId } from '../users/user.entity';

export type SenderId = UserId;

export type Message = {
  id: string;
  conversationId: string;
  senderId: SenderId;
  sentAt: string;
  content: string;
};
