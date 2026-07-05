import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Conversation } from '../conversations.entity';
import { ConversationsRepository } from '../conversations.repository';
import { UserId } from '../../users/user.entity';
import { TransactionContext } from '../../../common/persistence/transaction-runner';
import {
  ConversationDocument,
  ConversationHydratedDocument,
} from './conversation.schema';

@Injectable()
export class MongoConversationsRepository extends ConversationsRepository {
  constructor(
    @InjectModel('Conversation')
    private readonly conversationModel: Model<ConversationDocument>,
  ) {
    super();
  }

  async findById(id: string): Promise<Conversation | undefined> {
    if (!Types.ObjectId.isValid(id)) {
      return undefined;
    }
    const doc = await this.conversationModel.findById(id).exec();
    return doc ? this.toEntity(doc) : undefined;
  }

  async findByUser(userId: UserId): Promise<Conversation[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }
    const docs = await this.conversationModel
      .find({ userId })
      .sort({ lastMessageAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async create(input: Omit<Conversation, 'id'>): Promise<Conversation> {
    const doc = await this.conversationModel.create({
      title: input.title,
      type: input.type,
      lastMessageSnippet: input.lastMessageSnippet,
      lastMessageAt: new Date(input.lastMessageAt),
      userId: input.userId,
    });
    return this.toEntity(doc);
  }

  async updateLastMessage(
    id: string,
    snippet: string,
    sentAt: string,
    tx?: TransactionContext,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      return;
    }
    const session = tx as ClientSession | undefined;
    await this.conversationModel
      .updateOne(
        { _id: id },
        { lastMessageSnippet: snippet, lastMessageAt: new Date(sentAt) },
        { session },
      )
      .exec();
  }

  private toEntity(doc: ConversationHydratedDocument): Conversation {
    return {
      id: String(doc._id),
      title: doc.title,
      type: doc.type,
      lastMessageSnippet: doc.lastMessageSnippet,
      lastMessageAt: doc.lastMessageAt.toISOString(),
      userId: doc.userId.toString(),
    };
  }
}
