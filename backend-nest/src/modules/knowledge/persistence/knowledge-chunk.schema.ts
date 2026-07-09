import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class KnowledgeChunkDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'KnowledgeDocument', required: true })
  documentId!: Types.ObjectId;

  @Prop({ required: true })
  documentName!: string;

  @Prop({ required: true })
  chunkIndex!: number;

  @Prop({ required: true })
  chunkText!: string;

  @Prop({ type: [Number], required: true })
  embedding!: number[];
}

export const KnowledgeChunkSchema = SchemaFactory.createForClass(
  KnowledgeChunkDocument,
);
KnowledgeChunkSchema.index({ documentId: 1 });
