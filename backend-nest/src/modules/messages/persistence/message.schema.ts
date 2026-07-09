import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { Citation } from '../../knowledge/knowledge.entity';

@Schema({ timestamps: true })
export class MessageDocument {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role!: 'user' | 'assistant';

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, default: null })
  senderId!: Types.ObjectId | null;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  sentAt!: Date;

  @Prop({
    type: [
      {
        _id: false,
        chunkId: { type: String, required: true },
        documentId: { type: String, required: true },
        documentName: { type: String, required: true },
        chunkText: { type: String, required: true },
      },
    ],
    default: undefined,
  })
  citations?: Citation[];
}

export type MessageHydratedDocument = HydratedDocument<MessageDocument>;

export const MessageSchema = SchemaFactory.createForClass(MessageDocument);
MessageSchema.index({ conversationId: 1, _id: -1 });
