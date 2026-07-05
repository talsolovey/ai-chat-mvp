import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { validate } from './config/env.validation';
import jwtConfig from './config/jwt.config';
import llmConfig from './config/llm.config';
import { MongooseModule } from '@nestjs/mongoose';
import { LlmModule } from './modules/llm/llm.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    CommonModule,
    ConversationsModule,
    MessagesModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [jwtConfig, llmConfig],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    AuthModule,
    LlmModule,
    KnowledgeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
