import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Conversation } from '../conversations.entity';
import { ConversationsRepository } from '../conversations.repository';
import { UserId } from '../../users/user.entity';
import { TransactionContext } from '../../../common/persistence/transaction-runner';
import { ConversationDocument } from './conversation.schema';

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
    const conversationDoc = await this.conversationModel
      .findById(id)
      .lean()
      .exec();
    return conversationDoc
      ? this.toConversationEntity(conversationDoc)
      : undefined;
  }

  async findByUser(userId: UserId): Promise<Conversation[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }
    const docs = await this.conversationModel
      .find({ userId })
      .sort({ lastMessageAt: -1 })
      .lean()
      .exec();
    return docs.map((conversationDoc) =>
      this.toConversationEntity(conversationDoc),
    );
  }

  create(input: Omit<Conversation, 'id'>): Promise<Conversation> {
    return this.conversationModel
      .create({
        title: input.title,
        lastMessageSnippet: input.lastMessageSnippet,
        lastMessageAt: new Date(input.lastMessageAt),
        userId: input.userId,
      })
      .then((conversationDoc) => this.toConversationEntity(conversationDoc));
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

  private toConversationEntity(
    conversationDoc: ConversationDocument & { _id: Types.ObjectId },
  ): Conversation {
    return {
      id: String(conversationDoc._id),
      title: conversationDoc.title,
      lastMessageSnippet: conversationDoc.lastMessageSnippet,
      lastMessageAt: conversationDoc.lastMessageAt.toISOString(),
      userId: conversationDoc.userId.toString(),
    };
  }
}
