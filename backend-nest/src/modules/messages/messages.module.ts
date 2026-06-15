import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { SendMessageModule } from '../../application/send-message/send-message.module';
import { ListMessagesModule } from '../../application/list-messages/list-messages.module';

@Module({
  imports: [SendMessageModule, ListMessagesModule],
  controllers: [MessagesController],
})
export class MessagesModule {}
