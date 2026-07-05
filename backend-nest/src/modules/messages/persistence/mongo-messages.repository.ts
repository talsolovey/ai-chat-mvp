import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Message } from '../messages.entity';
import { MessagesRepository } from '../messages.repository';
import { TransactionContext } from '../../../common/persistence/transaction-runner';
import { decodeMessageCursor } from '../message-cursor';
import { MessageDocument } from './message.schema';

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

    let query = this.messageModel.find({ conversationId });

    if (options.cursor) {
      const cursor = decodeMessageCursor(options.cursor);
      if (!cursor || !Types.ObjectId.isValid(cursor.id)) {
        return { messages: [], hasMore: false };
      }
      const sentAt = new Date(cursor.sentAt);
      if (Number.isNaN(sentAt.getTime())) {
        return { messages: [], hasMore: false };
      }
      query = this.messageModel.find({
        conversationId,
        $or: [
          { sentAt: { $lt: sentAt } },
          { sentAt, _id: { $lt: new Types.ObjectId(cursor.id) } },
        ],
      });
    }

    const docs = await query
      .sort({ sentAt: -1, _id: -1 })
      .limit(options.limit + 1)
      .lean()
      .exec();

    const hasMore = docs.length > options.limit;
    const page = hasMore ? docs.slice(0, options.limit) : docs;
    return {
      messages: page.map((messageDoc) => this.toMessageEntity(messageDoc)),
      hasMore,
    };
  }

  create(input: Omit<Message, 'id'>, tx?: TransactionContext): Promise<Message> {
    const session = tx as ClientSession | undefined;
    return this.messageModel
      .create(
        [
          {
            conversationId: input.conversationId,
            senderId: input.senderId,
            content: input.content,
            sentAt: new Date(input.sentAt),
          },
        ],
        { session },
      )
      .then(([messageDoc]) => this.toMessageEntity(messageDoc));
  }

  private toMessageEntity(
    messageDoc: MessageDocument & { _id: Types.ObjectId },
  ): Message {
    return {
      id: String(messageDoc._id),
      conversationId: messageDoc.conversationId.toString(),
      senderId: messageDoc.senderId.toString(),
      sentAt: messageDoc.sentAt.toISOString(),
      content: messageDoc.content,
    };
  }
}
