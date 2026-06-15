import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { PublicUser } from '../users/user.entity';
import type { Message } from './messages.entity';
import { type MessagesPage } from './messages.service';
import { SendMessageUseCase } from '../../application/send-message/send-message.use-case';
import { ListMessagesUseCase } from '../../application/list-messages/list-messages.use-case';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';

@Controller('conversations/:id/messages')
export class MessagesController {
  constructor(
    private readonly listMessages: ListMessagesUseCase,
    private readonly sendMessage: SendMessageUseCase,
  ) {}

  @Get()
  getMessages(
    @CurrentUser() user: PublicUser,
    @Param('id') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<MessagesPage> {
    return this.listMessages.execute(
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
  ): Promise<Message> {
    return this.sendMessage.execute(conversationId, user.id, dto.content);
  }
}
