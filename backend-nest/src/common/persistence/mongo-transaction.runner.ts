import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { TransactionContext, TransactionRunner } from './transaction-runner';

@Injectable()
export class MongoTransactionRunner extends TransactionRunner {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
}
