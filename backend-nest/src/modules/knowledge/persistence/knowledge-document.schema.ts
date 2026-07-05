import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class KnowledgeDocumentDocument {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  contentHash!: string;

  @Prop({ required: true, default: 0 })
  chunkCount!: number;

  @Prop({ type: String, enum: ['ready'], default: 'ready' })
  status!: 'ready';

  createdAt!: Date;
}

export type KnowledgeDocumentHydratedDocument =
  HydratedDocument<KnowledgeDocumentDocument>;

export const KnowledgeDocumentSchema = SchemaFactory.createForClass(
  KnowledgeDocumentDocument,
);
KnowledgeDocumentSchema.index({ userId: 1, contentHash: 1 }, { unique: true });
