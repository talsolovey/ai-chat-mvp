export type TransactionContext = unknown;

export abstract class TransactionRunner {
  abstract run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
