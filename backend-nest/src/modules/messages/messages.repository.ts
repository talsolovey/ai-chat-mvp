import { Message } from './messages.entity';
import { TransactionContext } from '../../common/persistence/transaction-runner';

export abstract class MessagesRepository {
  abstract findPage(
    conversationId: string,
    options: { cursor?: string; limit: number },
  ): Promise<{ messages: Message[]; hasMore: boolean }>;
  abstract create(
    input: Omit<Message, 'id'>,
    tx?: TransactionContext,
  ): Promise<Message>;
}
