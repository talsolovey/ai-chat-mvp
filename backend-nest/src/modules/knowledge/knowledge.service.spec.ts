import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeRepository } from './knowledge.repository';
import { EmbeddingsProvider } from '../llm/embeddings-provider';
import { RetrievedChunk } from './knowledge.entity';
import { MINIMUM_SIMILARITY_SCORE } from './rag.constants';
import { FakeKnowledgeRepository } from './testing/fake-knowledge.repository';

class FakeEmbeddingsProvider extends EmbeddingsProvider {
  embedDocuments(chunkTexts: string[]): Promise<number[][]> {
    return Promise.resolve(chunkTexts.map(() => [0.1, 0.2, 0.3]));
  }

  embedQuery(): Promise<number[]> {
    return Promise.resolve([0.1, 0.2, 0.3]);
  }
}

function retrievedChunk(overrides: Partial<RetrievedChunk>): RetrievedChunk {
  return {
    chunkId: 'chunk-1',
    documentId: 'doc-1',
    documentName: 'notes.md',
    chunkText: 'some text',
    score: 0.9,
    ...overrides,
  };
}

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  let repository: FakeKnowledgeRepository;

  beforeEach(async () => {
    repository = new FakeKnowledgeRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        { provide: KnowledgeRepository, useValue: repository },
        { provide: EmbeddingsProvider, useClass: FakeEmbeddingsProvider },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
  });

  it('ingests a document into chunks with embeddings', async () => {
    const document = await service.ingestDocument(
      'user-1',
      'notes.md',
      'Photosynthesis converts light into chemical energy.',
    );

    expect(document.status).toBe('ready');
    expect(document.chunkCount).toBeGreaterThan(0);
    expect(repository.storedChunkCount).toBe(document.chunkCount);
  });

  it('does not duplicate chunks when the same content is re-uploaded', async () => {
    const content = 'The HTTP protocol is stateless.';
    const firstUpload = await service.ingestDocument(
      'user-1',
      'http.md',
      content,
    );
    const secondUpload = await service.ingestDocument(
      'user-1',
      'http-renamed.md',
      content,
    );

    expect(secondUpload.id).toBe(firstUpload.id);
    expect(repository.storedChunkCount).toBe(firstUpload.chunkCount);
  });

  it('ingests identical content separately for different users', async () => {
    const content = 'Shared study material.';
    const userOneDocument = await service.ingestDocument(
      'user-1',
      'shared.md',
      content,
    );
    const userTwoDocument = await service.ingestDocument(
      'user-2',
      'shared.md',
      content,
    );

    expect(userTwoDocument.id).not.toBe(userOneDocument.id);
  });

  it('throws NotFoundException when deleting a document the user does not own', async () => {
    const document = await service.ingestDocument(
      'owner-user',
      'private.md',
      'Private content.',
    );

    await expect(
      service.deleteDocument('other-user', document.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.listDocuments('owner-user')).resolves.toHaveLength(1);
  });

  it('drops retrieved chunks that score below the similarity minimum', async () => {
    repository.searchResultsToReturn = [
      retrievedChunk({ chunkId: 'strong', score: MINIMUM_SIMILARITY_SCORE }),
      retrievedChunk({
        chunkId: 'weak',
        score: MINIMUM_SIMILARITY_SCORE - 0.01,
      }),
    ];

    const relevantChunks = await service.retrieveRelevantChunks(
      'user-1',
      'What is photosynthesis?',
    );

    expect(relevantChunks.map((chunk) => chunk.chunkId)).toEqual(['strong']);
  });
});
