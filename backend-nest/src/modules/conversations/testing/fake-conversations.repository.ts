import { Conversation } from '../conversations.entity';
import { ConversationsRepository } from '../conversations.repository';
import { UserId } from '../../users/user.entity';
import { TransactionContext } from '../../../common/persistence/transaction-runner';

export class FakeConversationsRepository extends ConversationsRepository {
  private conversations: Conversation[] = [];
  private nextId = 1;

  findById(id: string): Promise<Conversation | undefined> {
    return Promise.resolve(this.conversations.find((c) => c.id === id));
  }

  findByUser(userId: UserId): Promise<Conversation[]> {
    return Promise.resolve(
      this.conversations
        .filter((c) => c.userId === userId)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
    );
  }

  create(input: Omit<Conversation, 'id'>): Promise<Conversation> {
    const conversation: Conversation = {
      id: `conv-${this.nextId++}`,
      ...input,
    };
    this.conversations.push(conversation);
    return Promise.resolve(conversation);
  }

  updateLastMessage(
    id: string,
    snippet: string,
    sentAt: string,
    _tx?: TransactionContext,
  ): Promise<void> {
    void _tx;
    const conversation = this.conversations.find((c) => c.id === id);
    if (conversation) {
      conversation.lastMessageSnippet = snippet;
      conversation.lastMessageAt = sentAt;
    }
    return Promise.resolve();
  }
}
