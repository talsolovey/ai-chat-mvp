import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { ConversationType } from '../conversations.entity';

@Schema({ timestamps: true })
export class ConversationDocument {
  @Prop({ required: true })
  title!: string;

  @Prop({ type: String, enum: ['chat', 'assistant'], default: 'chat' })
  type!: ConversationType;

  @Prop({ default: '' })
  lastMessageSnippet!: string;

  @Prop({ required: true })
  lastMessageAt!: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;
}

export type ConversationHydratedDocument =
  HydratedDocument<ConversationDocument>;

export const ConversationSchema =
  SchemaFactory.createForClass(ConversationDocument);
ConversationSchema.index({ userId: 1, lastMessageAt: -1 });
