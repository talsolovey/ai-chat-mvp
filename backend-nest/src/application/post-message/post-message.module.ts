import { Module } from '@nestjs/common';
import { ConversationsModule } from '../../modules/conversations/conversations.module';
import { SendMessageModule } from '../send-message/send-message.module';
import { StreamReplyModule } from '../stream-reply/stream-reply.module';
import { PostMessageUseCase } from './post-message.use-case';

@Module({
  imports: [ConversationsModule, SendMessageModule, StreamReplyModule],
  providers: [PostMessageUseCase],
  exports: [PostMessageUseCase],
})
export class PostMessageModule {}
