import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { TransactionRunner } from '../../../common/persistence/transaction-runner';
import { UserId } from '../../users/user.entity';
import { KnowledgeDocument, RetrievedChunk } from '../knowledge.entity';
import { ChunkToPersist, KnowledgeRepository } from '../knowledge.repository';
import { VECTOR_SEARCH_INDEX_NAME } from '../rag.constants';
import {
  KnowledgeDocumentDocument,
  KnowledgeDocumentHydratedDocument,
} from './knowledge-document.schema';
import { KnowledgeChunkDocument } from './knowledge-chunk.schema';

const VECTOR_SEARCH_CANDIDATE_POOL = 100;

type VectorSearchResult = {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  documentName: string;
  chunkText: string;
  score: number;
};

@Injectable()
export class MongoKnowledgeRepository extends KnowledgeRepository {
  constructor(
    @InjectModel('KnowledgeDocument')
    private readonly documentModel: Model<KnowledgeDocumentDocument>,
    @InjectModel('KnowledgeChunk')
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    private readonly transactionRunner: TransactionRunner,
  ) {
    super();
  }

  async findDocumentByContentHash(
    userId: UserId,
    contentHash: string,
  ): Promise<KnowledgeDocument | null> {
    const document = await this.documentModel.findOne({
      userId: new Types.ObjectId(userId),
      contentHash,
    });
    return document ? this.toEntity(document) : null;
  }

  async createDocumentWithChunks(input: {
    userId: UserId;
    documentName: string;
    contentHash: string;
    chunks: ChunkToPersist[];
  }): Promise<KnowledgeDocument> {
    const documentRecord = await this.transactionRunner.run(
      async (transaction) => {
        const session = transaction as ClientSession;
        const [createdDocument] = await this.documentModel.create(
          [
            {
              name: input.documentName,
              userId: new Types.ObjectId(input.userId),
              contentHash: input.contentHash,
              chunkCount: input.chunks.length,
              status: 'ready',
            },
          ],
          { session },
        );

        await this.chunkModel.insertMany(
          input.chunks.map((chunk) => ({
            userId: new Types.ObjectId(input.userId),
            documentId: createdDocument._id,
            documentName: input.documentName,
            chunkIndex: chunk.chunkIndex,
            chunkText: chunk.chunkText,
            embedding: chunk.embedding,
          })),
          { session },
        );

        return createdDocument;
      },
    );

    return this.toEntity(documentRecord);
  }

  async listDocuments(userId: UserId): Promise<KnowledgeDocument[]> {
    const documents = await this.documentModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return documents.map((document) => this.toEntity(document));
  }

  async deleteDocumentWithChunksOwnedBy(
    userId: UserId,
    documentId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(documentId)) {
      return false;
    }

    return this.transactionRunner.run(async (transaction) => {
      const session = transaction as ClientSession;
      const deletedDocument = await this.documentModel.findOneAndDelete(
        {
          _id: new Types.ObjectId(documentId),
          userId: new Types.ObjectId(userId),
        },
        { session },
      );
      if (!deletedDocument) {
        return false;
      }

      await this.chunkModel.deleteMany(
        { documentId: new Types.ObjectId(documentId) },
        { session },
      );
      return true;
    });
  }

  async searchChunksByEmbedding(
    userId: UserId,
    queryEmbedding: number[],
    topK: number,
  ): Promise<RetrievedChunk[]> {
    const searchResults = await this.chunkModel
      .aggregate<VectorSearchResult>([
        {
          $vectorSearch: {
            index: VECTOR_SEARCH_INDEX_NAME,
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: VECTOR_SEARCH_CANDIDATE_POOL,
            limit: topK,
            filter: { userId: new Types.ObjectId(userId) },
          },
        },
        {
          $project: {
            documentId: 1,
            documentName: 1,
            chunkText: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ])
      .exec();

    return searchResults.map((result) => ({
      chunkId: String(result._id),
      documentId: String(result.documentId),
      documentName: result.documentName,
      chunkText: result.chunkText,
      score: result.score,
    }));
  }

  private toEntity(
    document: KnowledgeDocumentHydratedDocument,
  ): KnowledgeDocument {
    return {
      id: String(document._id),
      name: document.name,
      userId: document.userId.toString(),
      chunkCount: document.chunkCount,
      status: document.status,
      createdAt: document.createdAt.toISOString(),
    };
  }
}
