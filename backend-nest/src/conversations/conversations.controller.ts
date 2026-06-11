import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { PublicUser } from '../users/user.entity';
import type { Conversation } from './conversations.entity';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  getConversations(@CurrentUser() user: PublicUser): Conversation[] {
    return this.conversationsService.getConversationsForUser(user.id);
  }

  @Post()
  createConversation(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateConversationDto,
  ): Conversation {
    return this.conversationsService.createConversationForUser(
      user.id,
      dto.title,
    );
  }
}
