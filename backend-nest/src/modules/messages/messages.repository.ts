import { Injectable } from '@nestjs/common';
import { Message } from './messages.entity';

@Injectable()
export class MessagesRepository {
  private messages: Message[] = [];

  findByConversation(conversationId: string): Promise<Message[]> {
    return Promise.resolve(
      this.messages.filter((m) => m.conversationId === conversationId),
    );
  }

  save(message: Message): Promise<void> {
    this.messages.push(message);
    return Promise.resolve();
  }
}
