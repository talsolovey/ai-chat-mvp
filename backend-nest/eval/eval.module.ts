import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import llmConfig from '../src/config/llm.config';
import { LlmModule } from '../src/modules/llm/llm.module';
import { MessagesService } from '../src/modules/messages/messages.service';
import { MessagesRepository } from '../src/modules/messages/messages.repository';
import { FakeMessagesRepository } from '../src/modules/messages/testing/fake-messages.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [llmConfig] }),
    LlmModule,
  ],
  providers: [
    MessagesService,
    { provide: MessagesRepository, useClass: FakeMessagesRepository },
  ],
})
export class EvalModule {}
