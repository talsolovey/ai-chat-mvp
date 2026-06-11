import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsService } from './conversations.service';
import { IdGeneratorService } from '../common/id-generator.service';

describe('ConversationsService', () => {
  let service: ConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationsService, IdGeneratorService],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
