import { TransactionContext, TransactionRunner } from './transaction-runner';

export class FakeTransactionRunner extends TransactionRunner {
  run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return work(undefined);
  }
}
