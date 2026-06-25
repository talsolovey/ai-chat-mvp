import { Injectable } from '@nestjs/common';
import { ConversationsService } from '../../modules/conversations/conversations.service';
import { MessagesService } from '../../modules/messages/messages.service';
import { Message } from '../../modules/messages/messages.entity';
import { UserId } from '../../modules/users/user.entity';
import { TransactionRunner } from '../../common/persistence/transaction-runner';

@Injectable()
export class SendMessageUseCase {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly messages: MessagesService,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(
    conversationId: string,
    userId: UserId,
    content: string,
  ): Promise<Message> {
    await this.conversations.assertOwnedBy(conversationId, userId);

    return this.transactions.run(async (tx) => {
      const message = await this.messages.createUserMessage(
        conversationId,
        userId,
        content,
        tx,
      );

      await this.conversations.updateLastMessage(
        conversationId,
        content,
        message.sentAt,
        tx,
      );

      return message;
    });
  }
}
