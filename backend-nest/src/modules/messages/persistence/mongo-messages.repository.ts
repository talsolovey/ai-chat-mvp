import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Message } from '../messages.entity';
import { UserId } from '../../users/user.entity';
import { MessagesRepository } from '../messages.repository';
import { TransactionContext } from '../../../common/persistence/transaction-runner';
import { MessageDocument, MessageHydratedDocument } from './message.schema';

@Injectable()
export class MongoMessagesRepository extends MessagesRepository {
  constructor(
    @InjectModel('Message')
    private readonly messageModel: Model<MessageDocument>,
  ) {
    super();
  }

  async findPage(
    conversationId: string,
    options: { cursor?: string; limit: number },
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    if (!Types.ObjectId.isValid(conversationId)) {
      return { messages: [], hasMore: false };
    }

    if (options.cursor && !Types.ObjectId.isValid(options.cursor)) {
      return { messages: [], hasMore: false };
    }

    const docs = await this.messageModel
      .find(
        options.cursor
          ? {
              conversationId,
              _id: { $lt: new Types.ObjectId(options.cursor) },
            }
          : { conversationId },
      )
      .sort({ _id: -1 })
      .limit(options.limit + 1)
      .exec();

    const hasMore = docs.length > options.limit;
    const page = hasMore ? docs.slice(0, options.limit) : docs;
    return { messages: page.map((doc) => this.toEntity(doc)), hasMore };
  }

  async findRecentChronological(
    conversationId: string,
    limit: number,
  ): Promise<Message[]> {
    if (!Types.ObjectId.isValid(conversationId)) {
      return [];
    }

    const docs = await this.messageModel
      .find({ conversationId })
      .sort({ _id: -1 })
      .limit(limit)
      .exec();

    return docs.reverse().map((doc) => this.toEntity(doc));
  }

  async findRecentByUser(userId: UserId, limit: number): Promise<Message[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }

    const docs = await this.messageModel
      .find({ senderId: new Types.ObjectId(userId) })
      .sort({ _id: -1 })
      .limit(limit)
      .exec();

    return docs.reverse().map((doc) => this.toEntity(doc));
  }

  async create(
    input: Omit<Message, 'id'>,
    tx?: TransactionContext,
  ): Promise<Message> {
    const session = tx as ClientSession | undefined;
    const [doc] = await this.messageModel.create(
      [
        {
          conversationId: input.conversationId,
          role: input.role,
          senderId: input.senderId,
          content: input.content,
          sentAt: new Date(input.sentAt),
        },
      ],
      { session },
    );
    return this.toEntity(doc);
  }

  private toEntity(doc: MessageHydratedDocument): Message {
    return {
      id: String(doc._id),
      conversationId: doc.conversationId.toString(),
      role: doc.role,
      senderId: doc.senderId ? doc.senderId.toString() : null,
      sentAt: doc.sentAt.toISOString(),
      content: doc.content,
    };
  }
}
