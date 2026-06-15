import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';

@Public()
@Controller('health')
export class AppController {
  @Get()
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
