import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TransactionRunner } from './persistence/transaction-runner';
import { MongoTransactionRunner } from './persistence/mongo-transaction.runner';

@Global()
@Module({
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: TransactionRunner, useClass: MongoTransactionRunner },
  ],
  exports: [TransactionRunner],
})
export class CommonModule {}
