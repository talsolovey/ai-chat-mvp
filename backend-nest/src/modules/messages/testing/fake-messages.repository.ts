import { Message } from '../messages.entity';
import { MessagesRepository } from '../messages.repository';
import { decodeMessageCursor } from '../message-cursor';
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
      .sort((a, b) => {
        if (a.sentAt !== b.sentAt) {
          return a.sentAt < b.sentAt ? 1 : -1;
        }
        return a.id < b.id ? 1 : -1;
      });

    let start = 0;
    if (options.cursor) {
      const cursor = decodeMessageCursor(options.cursor);
      if (!cursor) {
        return Promise.resolve({ messages: [], hasMore: false });
      }
      const after = sorted.findIndex(
        (m) =>
          m.sentAt < cursor.sentAt ||
          (m.sentAt === cursor.sentAt && m.id < cursor.id),
      );
      start = after === -1 ? sorted.length : after;
    }

    const slice = sorted.slice(start, start + options.limit + 1);
    const hasMore = slice.length > options.limit;
    const page = hasMore ? slice.slice(0, options.limit) : slice;
    return Promise.resolve({ messages: page, hasMore });
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
