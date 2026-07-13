import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { KnowledgeService } from '../../knowledge/knowledge.service';
import { getAuthenticatedUserIdFromRunConfig } from '../run-config';

const SearchDocumentsInputSchema = z.object({
  query: z.string().min(1).describe('What to look for in the documents'),
});

export function buildSearchDocumentsTool(knowledgeService: KnowledgeService) {
  return tool(
    async ({ query }, runConfig: LangGraphRunnableConfig): Promise<string> => {
      const retrievedChunks = await knowledgeService.retrieveRelevantChunks(
        getAuthenticatedUserIdFromRunConfig(runConfig),
        query,
      );
      return JSON.stringify({
        results: retrievedChunks.map((retrievedChunk) => ({
          documentName: retrievedChunk.documentName,
          excerpt: retrievedChunk.chunkText,
        })),
      });
    },
    {
      name: 'search_documents',
      description:
        "Search the user's uploaded documents for passages relevant to a " +
        'query. Use when the question needs grounded knowledge from their ' +
        'own material.',
      schema: SearchDocumentsInputSchema,
    },
  );
}
