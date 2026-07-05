import { createHash } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { UserId } from '../users/user.entity';
import { EmbeddingsProvider } from '../llm/embeddings-provider';
import { KnowledgeDocument, RetrievedChunk } from './knowledge.entity';
import { KnowledgeRepository } from './knowledge.repository';
import {
  CHUNK_OVERLAP_CHARACTERS,
  CHUNK_SIZE_CHARACTERS,
  MINIMUM_SIMILARITY_SCORE,
  RETRIEVAL_TOP_K,
} from './rag.constants';

@Injectable()
export class KnowledgeService {
  private readonly textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE_CHARACTERS,
    chunkOverlap: CHUNK_OVERLAP_CHARACTERS,
  });

  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly embeddingsProvider: EmbeddingsProvider,
  ) {}

  async ingestDocument(
    userId: UserId,
    documentName: string,
    content: string,
  ): Promise<KnowledgeDocument> {
    const contentHash = createHash('sha256').update(content).digest('hex');

    const alreadyIngestedDocument =
      await this.knowledgeRepository.findDocumentByContentHash(
        userId,
        contentHash,
      );
    if (alreadyIngestedDocument) {
      return alreadyIngestedDocument;
    }

    const chunkTexts = await this.textSplitter.splitText(content);
    const chunkEmbeddings =
      await this.embeddingsProvider.embedDocuments(chunkTexts);

    return this.knowledgeRepository.createDocumentWithChunks({
      userId,
      documentName,
      contentHash,
      chunks: chunkTexts.map((chunkText, chunkIndex) => ({
        chunkIndex,
        chunkText,
        embedding: chunkEmbeddings[chunkIndex],
      })),
    });
  }

  listDocuments(userId: UserId): Promise<KnowledgeDocument[]> {
    return this.knowledgeRepository.listDocuments(userId);
  }

  async deleteDocument(userId: UserId, documentId: string): Promise<void> {
    const deleted =
      await this.knowledgeRepository.deleteDocumentWithChunksOwnedBy(
        userId,
        documentId,
      );
    if (!deleted) {
      throw new NotFoundException('Document not found');
    }
  }

  async retrieveRelevantChunks(
    userId: UserId,
    question: string,
  ): Promise<RetrievedChunk[]> {
    const questionEmbedding =
      await this.embeddingsProvider.embedQuery(question);
    const retrievedChunks =
      await this.knowledgeRepository.searchChunksByEmbedding(
        userId,
        questionEmbedding,
        RETRIEVAL_TOP_K,
      );
    return retrievedChunks.filter(
      (chunk) => chunk.score >= MINIMUM_SIMILARITY_SCORE,
    );
  }
}
