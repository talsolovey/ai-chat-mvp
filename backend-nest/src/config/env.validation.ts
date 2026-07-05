import { plainToInstance } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @MinLength(16, { message: 'JWT_SECRET must be at least 16 characters' })
  JWT_SECRET!: string;

  @IsString()
  @Matches(/^mongodb(\+srv)?:\/\//, {
    message: 'MONGO_URI must be a valid mongodb:// connection string',
  })
  MONGO_URI!: string;

  @IsString()
  @MinLength(1, { message: 'OPENAI_API_KEY must not be empty' })
  OPENAI_API_KEY!: string;

  @IsOptional()
  @IsString()
  OPENAI_EMBEDDING_MODEL?: string;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${messages}`);
  }

  return validated;
}
