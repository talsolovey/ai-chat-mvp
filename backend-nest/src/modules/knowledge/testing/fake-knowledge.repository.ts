import { UserId } from '../../users/user.entity';
import { KnowledgeDocument, RetrievedChunk } from '../knowledge.entity';
import { ChunkToPersist, KnowledgeRepository } from '../knowledge.repository';

type StoredChunk = ChunkToPersist & {
  userId: UserId;
  documentId: string;
  documentName: string;
};

export class FakeKnowledgeRepository extends KnowledgeRepository {
  private documents: (KnowledgeDocument & { contentHash: string })[] = [];
  private chunks: StoredChunk[] = [];
  private nextId = 1;

  searchResultsToReturn: RetrievedChunk[] = [];

  findDocumentByContentHash(
    userId: UserId,
    contentHash: string,
  ): Promise<KnowledgeDocument | null> {
    const found = this.documents.find(
      (document) =>
        document.userId === userId && document.contentHash === contentHash,
    );
    return Promise.resolve(found ?? null);
  }

  createDocumentWithChunks(input: {
    userId: UserId;
    documentName: string;
    contentHash: string;
    chunks: ChunkToPersist[];
  }): Promise<KnowledgeDocument> {
    const document: KnowledgeDocument & { contentHash: string } = {
      id: String(this.nextId++),
      name: input.documentName,
      userId: input.userId,
      contentHash: input.contentHash,
      chunkCount: input.chunks.length,
      status: 'ready',
      createdAt: new Date().toISOString(),
    };
    this.documents.push(document);
    this.chunks.push(
      ...input.chunks.map((chunk) => ({
        ...chunk,
        userId: input.userId,
        documentId: document.id,
        documentName: input.documentName,
      })),
    );
    return Promise.resolve(document);
  }

  listDocuments(userId: UserId): Promise<KnowledgeDocument[]> {
    return Promise.resolve(
      this.documents.filter((document) => document.userId === userId),
    );
  }

  deleteDocumentWithChunksOwnedBy(
    userId: UserId,
    documentId: string,
  ): Promise<boolean> {
    const ownedDocument = this.documents.find(
      (document) => document.id === documentId && document.userId === userId,
    );
    if (!ownedDocument) {
      return Promise.resolve(false);
    }
    this.documents = this.documents.filter(
      (document) => document.id !== documentId,
    );
    this.chunks = this.chunks.filter(
      (chunk) => chunk.documentId !== documentId,
    );
    return Promise.resolve(true);
  }

  searchChunksByEmbedding(): Promise<RetrievedChunk[]> {
    return Promise.resolve(this.searchResultsToReturn);
  }

  get storedChunkCount(): number {
    return this.chunks.length;
  }
}
