import { Module } from '@nestjs/common';
import { ConversationsModule } from '../../modules/conversations/conversations.module';
import { MessagesDomainModule } from '../../modules/messages/messages-domain.module';
import { ListMessagesUseCase } from './list-messages.use-case';

@Module({
  imports: [ConversationsModule, MessagesDomainModule],
  providers: [ListMessagesUseCase],
  exports: [ListMessagesUseCase],
})
export class ListMessagesModule {}
