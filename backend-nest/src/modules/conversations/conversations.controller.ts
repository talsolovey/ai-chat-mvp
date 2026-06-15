import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { PublicUser } from '../users/user.entity';
import type { Conversation } from './conversations.entity';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  getConversations(@CurrentUser() user: PublicUser): Promise<Conversation[]> {
    return this.conversationsService.getConversationsForUser(user.id);
  }

  @Post()
  createConversation(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateConversationDto,
  ): Promise<Conversation> {
    return this.conversationsService.createConversationForUser(
      user.id,
      dto.title,
    );
  }
}
