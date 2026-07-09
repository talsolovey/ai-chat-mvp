import { Module } from '@nestjs/common';
import { ConversationsModule } from '../../modules/conversations/conversations.module';
import { MessagesDomainModule } from '../../modules/messages/messages-domain.module';
import { LlmModule } from '../../modules/llm/llm.module';
import { KnowledgeModule } from '../../modules/knowledge/knowledge.module';
import { StreamReplyUseCase } from './stream-reply.use-case';

@Module({
  imports: [
    ConversationsModule,
    MessagesDomainModule,
    LlmModule,
    KnowledgeModule,
  ],
  providers: [StreamReplyUseCase],
  exports: [StreamReplyUseCase],
})
export class StreamReplyModule {}
