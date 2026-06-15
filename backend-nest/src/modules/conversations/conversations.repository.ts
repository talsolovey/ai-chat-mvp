import { Injectable } from '@nestjs/common';
import { Conversation } from './conversations.entity';
import { UserId } from '../users/user.entity';

@Injectable()
export class ConversationsRepository {
  private conversations: Conversation[] = [];

  findById(id: string): Promise<Conversation | undefined> {
    return Promise.resolve(this.conversations.find((c) => c.id === id));
  }

  findByUser(userId: UserId): Promise<Conversation[]> {
    return Promise.resolve(
      this.conversations.filter((c) => c.userId === userId),
    );
  }

  save(conversation: Conversation): Promise<void> {
    const index = this.conversations.findIndex(
      (c) => c.id === conversation.id,
    );
    if (index >= 0) {
      this.conversations[index] = conversation;
    } else {
      this.conversations.push(conversation);
    }
    return Promise.resolve();
  }
}
