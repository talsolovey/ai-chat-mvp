import { Message } from './messages.entity';
import { UserId } from '../users/user.entity';
import { TransactionContext } from '../../common/persistence/transaction-runner';

export abstract class MessagesRepository {
  abstract findPage(
    conversationId: string,
    options: { cursor?: string; limit: number },
  ): Promise<{ messages: Message[]; hasMore: boolean }>;
  abstract findRecentChronological(
    conversationId: string,
    limit: number,
  ): Promise<Message[]>;
  abstract findRecentByUser(userId: UserId, limit: number): Promise<Message[]>;
  abstract create(
    input: Omit<Message, 'id'>,
    tx?: TransactionContext,
  ): Promise<Message>;
}
