import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { validate } from './config/env.validation';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    CommonModule,
    ConversationsModule,
    MessagesModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [jwtConfig],
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
