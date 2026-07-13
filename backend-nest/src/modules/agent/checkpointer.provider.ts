import { Provider } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import type { MongoDBSaverParams } from '@langchain/langgraph-checkpoint-mongodb';
import { LatestOnlyMongoDBSaver } from './latest-only-mongodb.saver';

export const AGENT_CHECKPOINTER = Symbol('AGENT_CHECKPOINTER');

// Safety net for abandoned threads: expired threads are re-seeded from the
// messages collection on the next turn, so nothing is lost.
const CHECKPOINT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const checkpointerProvider: Provider = {
  provide: AGENT_CHECKPOINTER,
  inject: [getConnectionToken()],
  useFactory: async (
    mongooseConnection: Connection,
  ): Promise<LatestOnlyMongoDBSaver> => {
    const checkpointSaver = new LatestOnlyMongoDBSaver({
      client:
        mongooseConnection.getClient() as unknown as MongoDBSaverParams['client'],
      ttl: CHECKPOINT_TTL_SECONDS,
    });
    await checkpointSaver.setup();
    return checkpointSaver;
  },
};
