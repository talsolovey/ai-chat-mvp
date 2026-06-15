import { Injectable } from '@nestjs/common';
import { Message } from './messages.entity';
import { IdGeneratorService } from '../../common/id-generator.service';
import { UserId } from '../users/user.entity';
import { DEFAULT_PAGE_SIZE } from './dto/get-messages-query.dto';
import { MessagesRepository } from './messages.repository';

export type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly repo: MessagesRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async listForConversation(
    conversationId: string,
    cursor: string | undefined,
    limit: number | undefined,
  ): Promise<MessagesPage> {
    const messages = await this.repo.findByConversation(conversationId);
    const sorted = messages.sort((a, b) => b.sentAt.localeCompare(a.sentAt));

    return this.paginate(sorted, cursor, limit ?? DEFAULT_PAGE_SIZE);
  }

  async create(
    conversationId: string,
    userId: UserId,
    content: string,
  ): Promise<Message> {
    const message: Message = {
      id: `m-${this.idGenerator.generateId()}`,
      conversationId,
      senderId: userId,
      sentAt: new Date().toISOString(),
      content,
    };
    await this.repo.save(message);

    return message;
  }

  private paginate(
    sorted: Message[],
    cursor: string | undefined,
    pageSize: number,
  ): MessagesPage {
    const cursorIndex = cursor ? sorted.findIndex((m) => m.id === cursor) : -1;
    const startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;

    const page = sorted.slice(startIndex, startIndex + pageSize);
    const reachedEnd = startIndex + pageSize >= sorted.length;
    const last = page[page.length - 1];
    return { messages: page, nextCursor: reachedEnd || !last ? null : last.id };
  }
}
