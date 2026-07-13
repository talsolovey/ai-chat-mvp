import { Module } from '@nestjs/common';
import { ConversationsModule } from '../../modules/conversations/conversations.module';
import { MessagesDomainModule } from '../../modules/messages/messages-domain.module';
import { AgentModule } from '../../modules/agent/agent.module';
import { StreamReplyUseCase } from './stream-reply.use-case';

@Module({
  imports: [ConversationsModule, MessagesDomainModule, AgentModule],
  providers: [StreamReplyUseCase],
  exports: [StreamReplyUseCase],
})
export class StreamReplyModule {}
