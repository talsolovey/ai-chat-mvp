import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { ListMessagesModule } from '../../application/list-messages/list-messages.module';
import { PostMessageModule } from '../../application/post-message/post-message.module';

@Module({
  imports: [ListMessagesModule, PostMessageModule],
  controllers: [MessagesController],
})
export class MessagesModule {}
