import { Injectable } from '@nestjs/common';
import { ConversationsService } from '../../modules/conversations/conversations.service';
import { Message } from '../../modules/messages/messages.entity';
import { UserId } from '../../modules/users/user.entity';
import { SendMessageUseCase } from '../send-message/send-message.use-case';
import {
  StreamReplyEvent,
  StreamReplyUseCase,
} from '../stream-reply/stream-reply.use-case';

export type PostMessageResult =
  | { type: 'chat'; message: Message }
  | { type: 'assistant'; stream: AsyncGenerator<StreamReplyEvent> };

@Injectable()
export class PostMessageUseCase {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly streamReplyUseCase: StreamReplyUseCase,
  ) {}

  async execute(
    conversationId: string,
    authenticatedUserId: UserId,
    content: string,
  ): Promise<PostMessageResult> {
    const ownedConversation =
      await this.conversationsService.getConversationOwnedBy(
        conversationId,
        authenticatedUserId,
      );

    const persistedUserMessage = await this.sendMessageUseCase.execute(
      conversationId,
      authenticatedUserId,
      content,
    );

    if (ownedConversation.type !== 'assistant') {
      return { type: 'chat', message: persistedUserMessage };
    }

    return {
      type: 'assistant',
      stream: this.streamReplyUseCase.execute(
        conversationId,
        authenticatedUserId,
      ),
    };
  }
}
