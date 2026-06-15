import { Module } from '@nestjs/common';
import { ConversationsModule } from '../../modules/conversations/conversations.module';
import { MessagesDomainModule } from '../../modules/messages/messages-domain.module';
import { SendMessageUseCase } from './send-message.use-case';

@Module({
  imports: [ConversationsModule, MessagesDomainModule],
  providers: [SendMessageUseCase],
  exports: [SendMessageUseCase],
})
export class SendMessageModule {}
