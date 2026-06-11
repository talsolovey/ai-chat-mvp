import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    CommonModule,
    ConversationsModule,
    MessagesModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
