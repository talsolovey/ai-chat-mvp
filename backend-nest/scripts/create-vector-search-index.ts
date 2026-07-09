import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';
import { MongoClient, Document } from 'mongodb';

type VectorSearchIndexConfig = {
  name: string;
  type: string;
  collection: string;
  definition: Document;
};

async function createVectorSearchIndex(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set');
  }

  const indexConfig = JSON.parse(
    readFileSync(join(__dirname, '../atlas/vector-search-index.json'), 'utf-8'),
  ) as VectorSearchIndexConfig;

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const database = client.db();

    const existingCollections = await database
      .listCollections({ name: indexConfig.collection })
      .toArray();
    if (existingCollections.length === 0) {
      await database.createCollection(indexConfig.collection);
    }

    const collection = database.collection(indexConfig.collection);

    const existingIndexes = await collection
      .listSearchIndexes()
      .toArray()
      .catch(() => []);
    if (existingIndexes.some((index) => index.name === indexConfig.name)) {
      console.log(
        `Index "${indexConfig.name}" already exists — nothing to do.`,
      );
      return;
    }

    await collection.createSearchIndex({
      name: indexConfig.name,
      type: indexConfig.type,
      definition: indexConfig.definition,
    });
    console.log(
      `Index "${indexConfig.name}" created on "${indexConfig.collection}". It may take a minute to become queryable.`,
    );
  } finally {
    await client.close();
  }
}

createVectorSearchIndex().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
