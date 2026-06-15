import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { IdGeneratorService } from './id-generator.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

@Global()
@Module({
  providers: [
    IdGeneratorService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
  exports: [IdGeneratorService],
})
export class CommonModule {}
