import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini-2024-07-18',
  maxTokens: Number(process.env.OPENAI_MAX_TOKENS ?? 256),
  temperature: Number(process.env.OPENAI_TEMPERATURE ?? 0.7),
}));
