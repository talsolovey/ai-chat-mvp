import { Conversation } from './conversations.entity';
import { UserId } from '../users/user.entity';
import { TransactionContext } from '../../common/persistence/transaction-runner';

export abstract class ConversationsRepository {
  abstract findById(id: string): Promise<Conversation | undefined>;
  abstract findByUser(userId: UserId): Promise<Conversation[]>;
  abstract create(input: Omit<Conversation, 'id'>): Promise<Conversation>;
  abstract updateLastMessage(
    id: string,
    snippet: string,
    sentAt: string,
    tx?: TransactionContext,
  ): Promise<void>;
}
