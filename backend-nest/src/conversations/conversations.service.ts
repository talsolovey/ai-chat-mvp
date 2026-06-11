import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Conversation } from './conversations.entity';
import { UserId } from '../users/user.entity';
import { IdGeneratorService } from '../common/id-generator.service';

@Injectable()
export class ConversationsService {
  private conversations: Conversation[] = [];

  constructor(private readonly idGenerator: IdGeneratorService) {}

  getConversationsForUser(userId: UserId): Conversation[] {
    return this.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }

  createConversationForUser(userId: UserId, title: string): Conversation {
    const conversation: Conversation = {
      id: `c-${this.idGenerator.generateId()}`,
      title,
      lastMessageSnippet: '',
      lastMessageAt: new Date().toISOString(),
      userId,
    };
    this.conversations.push(conversation);
    return conversation;
  }

  getConversationOwnedBy(conversationId: string, userId: UserId): Conversation {
    const conversation = this.conversations.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new ForbiddenException('Not a participant in this conversation');
    }
    return conversation;
  }
}
