import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Conversation, ConversationType } from './conversations.entity';
import { UserId } from '../users/user.entity';
import { ConversationsRepository } from './conversations.repository';
import { TransactionContext } from '../../common/persistence/transaction-runner';

@Injectable()
export class ConversationsService {
  constructor(private readonly repo: ConversationsRepository) {}

  async getConversationsForUser(userId: UserId): Promise<Conversation[]> {
    return this.repo.findByUser(userId);
  }

  async createConversationForUser(
    userId: UserId,
    title: string,
    type: ConversationType = 'chat',
  ): Promise<Conversation> {
    return this.repo.create({
      title,
      type,
      lastMessageSnippet: '',
      lastMessageAt: new Date().toISOString(),
      userId,
    });
  }

  async getConversationOwnedBy(
    conversationId: string,
    userId: UserId,
  ): Promise<Conversation> {
    const conversation = await this.repo.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new ForbiddenException('Not the owner of this conversation');
    }
    return conversation;
  }

  async assertOwnedBy(conversationId: string, userId: UserId): Promise<void> {
    await this.getConversationOwnedBy(conversationId, userId);
  }

  async updateLastMessage(
    conversationId: string,
    snippet: string,
    sentAt: string,
    tx?: TransactionContext,
  ): Promise<void> {
    await this.repo.updateLastMessage(conversationId, snippet, sentAt, tx);
  }
}
