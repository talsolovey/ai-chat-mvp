import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Conversation } from './conversations.entity';
import { UserId } from '../users/user.entity';
import { IdGeneratorService } from '../../common/id-generator.service';
import { ConversationsRepository } from './conversations.repository';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly repo: ConversationsRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async getConversationsForUser(userId: UserId): Promise<Conversation[]> {
    const conversations = await this.repo.findByUser(userId);
    return conversations.sort((a, b) =>
      b.lastMessageAt.localeCompare(a.lastMessageAt),
    );
  }

  async createConversationForUser(
    userId: UserId,
    title: string,
  ): Promise<Conversation> {
    const conversation: Conversation = {
      id: `c-${this.idGenerator.generateId()}`,
      title,
      lastMessageSnippet: '',
      lastMessageAt: new Date().toISOString(),
      userId,
    };
    await this.repo.save(conversation);
    return conversation;
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
      throw new ForbiddenException('Not a participant in this conversation');
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
  ): Promise<void> {
    const conversation = await this.repo.findById(conversationId);
    if (!conversation) {
      return;
    }
    conversation.lastMessageSnippet = snippet;
    conversation.lastMessageAt = sentAt;
    await this.repo.save(conversation);
  }
}
