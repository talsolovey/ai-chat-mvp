import { Provider } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  MongoDBSaver,
  type MongoDBSaverParams,
} from '@langchain/langgraph-checkpoint-mongodb';

export const AGENT_CHECKPOINTER = Symbol('AGENT_CHECKPOINTER');

export const checkpointerProvider: Provider = {
  provide: AGENT_CHECKPOINTER,
  inject: [getConnectionToken()],
  useFactory: async (mongooseConnection: Connection): Promise<MongoDBSaver> => {
    const checkpointSaver = new MongoDBSaver({
      client:
        mongooseConnection.getClient() as unknown as MongoDBSaverParams['client'],
    });
    await checkpointSaver.setup();
    return checkpointSaver;
  },
};
