import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MessageDocument {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  sentAt!: Date;
}

export type MessageHydratedDocument = HydratedDocument<MessageDocument>;

export const MessageSchema = SchemaFactory.createForClass(MessageDocument);
MessageSchema.index({ conversationId: 1, _id: -1 });
