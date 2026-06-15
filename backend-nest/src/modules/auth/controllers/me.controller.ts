import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { PublicUser } from '../../users/user.entity';

@Controller('me')
export class MeController {
  @Get()
  getMe(@CurrentUser() user: PublicUser): PublicUser {
    return user;
  }
}
