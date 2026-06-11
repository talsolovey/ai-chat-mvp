import { Injectable } from '@nestjs/common';
import { Message } from './messages.entity';
import { ConversationsService } from '../conversations/conversations.service';
import { IdGeneratorService } from '../common/id-generator.service';
import { UserId } from '../users/user.entity';
import { DEFAULT_PAGE_SIZE } from './dto/get-messages-query.dto';

export type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};

@Injectable()
export class MessagesService {
  private messages: Message[] = [];

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  getMessagesForConversation(
    conversationId: string,
    userId: UserId,
    cursor: string | undefined,
    limit: number | undefined,
  ): MessagesPage {
    this.conversationsService.getConversationOwnedBy(conversationId, userId);

    const sorted = this.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));

    return this.paginate(sorted, cursor, limit ?? DEFAULT_PAGE_SIZE);
  }

  createMessage(
    conversationId: string,
    userId: UserId,
    content: string,
  ): Message {
    const conversation = this.conversationsService.getConversationOwnedBy(
      conversationId,
      userId,
    );

    const message: Message = {
      id: `m-${this.idGenerator.generateId()}`,
      conversationId,
      senderId: userId,
      sentAt: new Date().toISOString(),
      content,
    };
    this.messages.push(message);

    conversation.lastMessageSnippet = content;
    conversation.lastMessageAt = message.sentAt;

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
