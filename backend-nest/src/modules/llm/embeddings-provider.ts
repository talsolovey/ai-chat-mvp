export abstract class EmbeddingsProvider {
  abstract embedDocuments(chunkTexts: string[]): Promise<number[][]>;
  abstract embedQuery(queryText: string): Promise<number[]>;
}
