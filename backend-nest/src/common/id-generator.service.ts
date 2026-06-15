import { Injectable } from '@nestjs/common';

@Injectable()
export class IdGeneratorService {
  private nextId = 100;

  generateId(): string {
    return String(this.nextId++);
  }
}
