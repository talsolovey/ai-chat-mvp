import { UserId } from '../users/user.entity';
import { KnowledgeDocument, RetrievedChunk } from './knowledge.entity';

export type ChunkToPersist = {
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
};

export abstract class KnowledgeRepository {
  abstract findDocumentByContentHash(
    userId: UserId,
    contentHash: string,
  ): Promise<KnowledgeDocument | null>;

  abstract createDocumentWithChunks(input: {
    userId: UserId;
    documentName: string;
    contentHash: string;
    chunks: ChunkToPersist[];
  }): Promise<KnowledgeDocument>;

  abstract listDocuments(userId: UserId): Promise<KnowledgeDocument[]>;

  abstract deleteDocumentWithChunksOwnedBy(
    userId: UserId,
    documentId: string,
  ): Promise<boolean>;

  abstract searchChunksByEmbedding(
    userId: UserId,
    queryEmbedding: number[],
    topK: number,
  ): Promise<RetrievedChunk[]>;
}
