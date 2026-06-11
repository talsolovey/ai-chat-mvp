import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { PublicUser } from '../users/user.entity';
import type { Message } from './messages.entity';
import { MessagesService, type MessagesPage } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';

@Controller('conversations/:id/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  getMessages(
    @CurrentUser() user: PublicUser,
    @Param('id') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ): MessagesPage {
    return this.messagesService.getMessagesForConversation(
      conversationId,
      user.id,
      query.cursor,
      query.limit,
    );
  }

  @Post()
  createMessage(
    @CurrentUser() user: PublicUser,
    @Param('id') conversationId: string,
    @Body() dto: CreateMessageDto,
  ): Message {
    return this.messagesService.createMessage(
      conversationId,
      user.id,
      dto.content,
    );
  }
}
