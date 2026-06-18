import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsRepository } from './conversations.repository';
import { MongoConversationsRepository } from './persistence/mongo-conversations.repository';
import { ConversationSchema } from './persistence/conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Conversation', schema: ConversationSchema },
    ]),
  ],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    {
      provide: ConversationsRepository,
      useClass: MongoConversationsRepository,
    },
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
