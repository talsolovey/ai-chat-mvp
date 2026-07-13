import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { MongoDBSaverParams } from '@langchain/langgraph-checkpoint-mongodb';
import type { RunnableConfig } from '@langchain/core/runnables';
import {
  emptyCheckpoint,
  type Checkpoint,
  type CheckpointMetadata,
} from '@langchain/langgraph';
import { LatestOnlyMongoDBSaver } from './latest-only-mongodb.saver';

describe('LatestOnlyMongoDBSaver (integration)', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let saver: LatestOnlyMongoDBSaver;

  const configForThread = (threadId: string): RunnableConfig => ({
    configurable: { thread_id: threadId, checkpoint_ns: '' },
  });

  const checkpointWithId = (checkpointId: string): Checkpoint => ({
    ...emptyCheckpoint(),
    id: checkpointId,
  });

  const sampleMetadata = {
    source: 'loop',
    step: 0,
    parents: {},
  } as CheckpointMetadata;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    client = new MongoClient(mongod.getUri());
    await client.connect();
    saver = new LatestOnlyMongoDBSaver({
      client: client as unknown as MongoDBSaverParams['client'],
    });
    await saver.setup();
  });

  afterEach(async () => {
    await client.db().collection(saver.checkpointCollectionName).deleteMany({});
    await client
      .db()
      .collection(saver.checkpointWritesCollectionName)
      .deleteMany({});
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  it('keeps only the newest checkpoint for a thread', async () => {
    await saver.put(
      configForThread('thread-1'),
      checkpointWithId('checkpoint-1'),
      sampleMetadata,
    );
    await saver.put(
      configForThread('thread-1'),
      checkpointWithId('checkpoint-2'),
      sampleMetadata,
    );

    const remainingCheckpoints = await client
      .db()
      .collection(saver.checkpointCollectionName)
      .find({ thread_id: 'thread-1' })
      .toArray();
    expect(remainingCheckpoints).toHaveLength(1);
    expect(remainingCheckpoints[0].checkpoint_id).toBe('checkpoint-2');
  });

  it('still returns the newest checkpoint after pruning', async () => {
    await saver.put(
      configForThread('thread-1'),
      checkpointWithId('checkpoint-1'),
      sampleMetadata,
    );
    await saver.put(
      configForThread('thread-1'),
      checkpointWithId('checkpoint-2'),
      sampleMetadata,
    );

    const latestTuple = await saver.getTuple(configForThread('thread-1'));
    expect(latestTuple?.checkpoint.id).toBe('checkpoint-2');
  });

  it('prunes pending writes belonging to older checkpoints', async () => {
    await saver.put(
      configForThread('thread-1'),
      checkpointWithId('checkpoint-1'),
      sampleMetadata,
    );
    await saver.putWrites(
      {
        configurable: {
          thread_id: 'thread-1',
          checkpoint_ns: '',
          checkpoint_id: 'checkpoint-1',
        },
      },
      [['messages', 'sample-write']],
      'task-1',
    );

    await saver.put(
      configForThread('thread-1'),
      checkpointWithId('checkpoint-2'),
      sampleMetadata,
    );

    const remainingWrites = await client
      .db()
      .collection(saver.checkpointWritesCollectionName)
      .find({ thread_id: 'thread-1' })
      .toArray();
    expect(remainingWrites).toHaveLength(0);
  });

  it('does not touch checkpoints of other threads', async () => {
    await saver.put(
      configForThread('thread-1'),
      checkpointWithId('checkpoint-1'),
      sampleMetadata,
    );
    await saver.put(
      configForThread('thread-2'),
      checkpointWithId('checkpoint-2'),
      sampleMetadata,
    );

    const otherThreadCheckpoints = await client
      .db()
      .collection(saver.checkpointCollectionName)
      .find({ thread_id: 'thread-1' })
      .toArray();
    expect(otherThreadCheckpoints).toHaveLength(1);
  });
});
