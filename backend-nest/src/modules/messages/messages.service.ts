import { Injectable } from '@nestjs/common';
import { Message } from './messages.entity';
import { UserId } from '../users/user.entity';
import { DEFAULT_PAGE_SIZE } from './dto/get-messages-query.dto';
import { MessagesRepository } from './messages.repository';
import { TransactionContext } from '../../common/persistence/transaction-runner';

export type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};

@Injectable()
export class MessagesService {
  constructor(private readonly repo: MessagesRepository) {}

  async listForConversation(
    conversationId: string,
    cursor: string | undefined,
    limit: number | undefined,
  ): Promise<MessagesPage> {
    const pageSize = limit ?? DEFAULT_PAGE_SIZE;
    const { messages, hasMore } = await this.repo.findPage(conversationId, {
      cursor,
      limit: pageSize,
    });
    const nextCursor = hasMore ? messages[messages.length - 1].id : null;
    return { messages, nextCursor };
  }

  async createUserMessage(
    conversationId: string,
    userId: UserId,
    content: string,
    tx?: TransactionContext,
  ): Promise<Message> {
    return this.repo.create(
      {
        conversationId,
        role: 'user',
        senderId: userId,
        sentAt: new Date().toISOString(),
        content,
      },
      tx,
    );
  }

  async createAssistantMessage(
    conversationId: string,
    content: string,
    tx?: TransactionContext,
  ): Promise<Message> {
    return this.repo.create(
      {
        conversationId,
        role: 'assistant',
        senderId: null,
        sentAt: new Date().toISOString(),
        content,
      },
      tx,
    );
  }

  async getRecentHistory(
    conversationId: string,
    limit: number,
  ): Promise<Message[]> {
    return this.repo.findRecentChronological(conversationId, limit);
  }

  async getRecentByUser(userId: UserId, limit: number): Promise<Message[]> {
    return this.repo.findRecentByUser(userId, limit);
  }
}
