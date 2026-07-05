import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { EvalModule } from './eval.module';
import { LlmProvider } from '../src/modules/llm/llm-provider';
import { MessagesService } from '../src/modules/messages/messages.service';
import { ASSISTANT_SYSTEM_PROMPT } from '../src/modules/llm/prompts/assistant.prompt';
import { createSummarizeMyRecentMessagesTool } from '../src/application/tools/summarize-my-recent-messages.tool';

type EvalPrompt = {
  name: string;
  prompt: string;
  expectation: string;
};

const SEED_MESSAGE_CONTENTS: readonly string[] = [
  'I started wiring up the assistant conversation type today.',
  'Streaming the reply over SSE was trickier than expected.',
  'Next I want to add a tool the model can call.',
  'Remember to update the .env.example before opening the PR.',
];

const EVAL_AUTHENTICATED_USER_ID = 'eval-user';
const EVAL_CONVERSATION_ID = 'eval-conversation';

async function runEvalPrompts(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      'OPENAI_API_KEY is not set. Set it in your environment before running the eval.',
    );
    process.exitCode = 1;
    return;
  }

  const evalPrompts = JSON.parse(
    readFileSync(join(__dirname, 'prompts.json'), 'utf-8'),
  ) as EvalPrompt[];

  const applicationContext = await NestFactory.createApplicationContext(
    EvalModule,
    { logger: false },
  );

  try {
    const llmProvider = applicationContext.get(LlmProvider);
    const messagesService = applicationContext.get(MessagesService);

    for (const seedMessageContent of SEED_MESSAGE_CONTENTS) {
      await messagesService.createUserMessage(
        EVAL_CONVERSATION_ID,
        EVAL_AUTHENTICATED_USER_ID,
        seedMessageContent,
      );
    }

    const userScopedTools = [
      createSummarizeMyRecentMessagesTool(
        { messagesService },
        EVAL_AUTHENTICATED_USER_ID,
      ),
    ];

    for (const evalPrompt of evalPrompts) {
      let accumulatedReplyText = '';
      for await (const streamEvent of llmProvider.streamAssistantReply({
        systemPrompt: ASSISTANT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: evalPrompt.prompt }],
        tools: userScopedTools,
      })) {
        if (streamEvent.type === 'token') {
          accumulatedReplyText += streamEvent.text;
        }
      }

      console.log('═'.repeat(72));
      console.log(`# ${evalPrompt.name}`);
      console.log(`prompt:      ${evalPrompt.prompt}`);
      console.log(`expectation: ${evalPrompt.expectation}`);
      console.log(`response:    ${accumulatedReplyText.trim()}`);
    }
    console.log('═'.repeat(72));
  } finally {
    await applicationContext.close();
  }
}

void runEvalPrompts();
