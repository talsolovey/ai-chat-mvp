import { Message } from '../messages.entity';
import { UserId } from '../../users/user.entity';
import { MessagesRepository } from '../messages.repository';
import { TransactionContext } from '../../../common/persistence/transaction-runner';

export class FakeMessagesRepository extends MessagesRepository {
  private messages: Message[] = [];
  private nextId = 1;

  findPage(
    conversationId: string,
    options: { cursor?: string; limit: number },
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const sorted = this.messages
      .filter((m) => m.conversationId === conversationId)
      .reverse();

    const start = options.cursor
      ? sorted.findIndex((m) => m.id === options.cursor) + 1
      : 0;

    const slice = sorted.slice(start, start + options.limit + 1);
    const hasMore = slice.length > options.limit;
    const page = hasMore ? slice.slice(0, options.limit) : slice;
    return Promise.resolve({ messages: page, hasMore });
  }

  findRecentChronological(
    conversationId: string,
    limit: number,
  ): Promise<Message[]> {
    const history = this.messages.filter(
      (m) => m.conversationId === conversationId,
    );
    return Promise.resolve(history.slice(-limit));
  }

  findRecentByUser(userId: UserId, limit: number): Promise<Message[]> {
    const authored = this.messages.filter((m) => m.senderId === userId);
    return Promise.resolve(authored.slice(-limit));
  }

  create(
    input: Omit<Message, 'id'>,
    _tx?: TransactionContext,
  ): Promise<Message> {
    void _tx;
    const message: Message = { id: `msg-${this.nextId++}`, ...input };
    this.messages.push(message);
    return Promise.resolve(message);
  }
}
