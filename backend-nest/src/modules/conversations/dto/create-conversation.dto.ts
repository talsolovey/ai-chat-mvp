import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { ConversationType } from '../conversations.entity';

export class CreateConversationDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'title is required' })
  title!: string;

  @IsOptional()
  @IsIn(['chat', 'assistant'])
  type: ConversationType = 'chat';
}
