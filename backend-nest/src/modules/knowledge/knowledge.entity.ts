import { UserId } from '../users/user.entity';

export type KnowledgeDocument = {
  id: string;
  name: string;
  userId: UserId;
  chunkCount: number;
  status: 'ready';
  createdAt: string;
};

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  documentName: string;
  chunkText: string;
  score: number;
};

export type Citation = Omit<RetrievedChunk, 'score'>;

export function toCitation({
  chunkId,
  documentId,
  documentName,
  chunkText,
}: RetrievedChunk): Citation {
  return { chunkId, documentId, documentName, chunkText };
}
