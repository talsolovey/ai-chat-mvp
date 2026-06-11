import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { PublicUser } from '../users/user.entity';

@Controller('me')
export class MeController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getMe(@CurrentUser() user: PublicUser): PublicUser {
    return user;
  }
}
