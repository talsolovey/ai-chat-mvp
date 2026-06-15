import { Injectable } from '@nestjs/common';
import { ConversationsService } from '../../modules/conversations/conversations.service';
import { MessagesService, MessagesPage } from '../../modules/messages/messages.service';
import { UserId } from '../../modules/users/user.entity';

@Injectable()
export class ListMessagesUseCase {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly messages: MessagesService,
  ) {}

  async execute(
    conversationId: string,
    userId: UserId,
    cursor: string | undefined,
    limit: number | undefined,
  ): Promise<MessagesPage> {
    await this.conversations.assertOwnedBy(conversationId, userId);

    return this.messages.listForConversation(conversationId, cursor, limit);
  }
}
