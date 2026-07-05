import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { PublicUser } from '../users/user.entity';
import { type MessagesPage } from './messages.service';
import { ListMessagesUseCase } from '../../application/list-messages/list-messages.use-case';
import { PostMessageUseCase } from '../../application/post-message/post-message.use-case';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';

@Controller('conversations/:id/messages')
export class MessagesController {
  constructor(
    private readonly listMessagesUseCase: ListMessagesUseCase,
    private readonly postMessageUseCase: PostMessageUseCase,
  ) {}

  @Get()
  getMessages(
    @CurrentUser() authenticatedUser: PublicUser,
    @Param('id') conversationId: string,
    @Query() getMessagesQuery: GetMessagesQueryDto,
  ): Promise<MessagesPage> {
    return this.listMessagesUseCase.execute(
      conversationId,
      authenticatedUser.id,
      getMessagesQuery.cursor,
      getMessagesQuery.limit,
    );
  }

  @Post()
  async createMessage(
    @CurrentUser() authenticatedUser: PublicUser,
    @Param('id') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Res() httpResponse: Response,
  ): Promise<void> {
    const postMessageResult = await this.postMessageUseCase.execute(
      conversationId,
      authenticatedUser.id,
      createMessageDto.content,
    );

    if (postMessageResult.type === 'chat') {
      httpResponse.status(201).json(postMessageResult.message);
      return;
    }

    httpResponse.setHeader('Content-Type', 'text/event-stream');
    httpResponse.setHeader('Cache-Control', 'no-cache');
    httpResponse.setHeader('Connection', 'keep-alive');
    httpResponse.flushHeaders();

    try {
      for await (const streamEvent of postMessageResult.stream) {
        httpResponse.write(`data: ${JSON.stringify(streamEvent)}\n\n`);
      }
    } catch {
      httpResponse.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: 'The assistant failed to respond',
        })}\n\n`,
      );
    } finally {
      httpResponse.end();
    }
  }
}
