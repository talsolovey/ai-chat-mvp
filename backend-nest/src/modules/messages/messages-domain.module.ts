import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { MongoMessagesRepository } from './persistence/mongo-messages.repository';
import { MessageSchema } from './persistence/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
  ],
  providers: [
    MessagesService,
    { provide: MessagesRepository, useClass: MongoMessagesRepository },
  ],
  exports: [MessagesService],
})
export class MessagesDomainModule {}
