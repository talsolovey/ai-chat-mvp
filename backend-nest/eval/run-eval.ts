import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { MemorySaver } from '@langchain/langgraph';
import { EvalModule } from './eval.module';
import { MessagesService } from '../src/modules/messages/messages.service';
import type { KnowledgeService } from '../src/modules/knowledge/knowledge.service';
import { buildAgentGraph } from '../src/modules/agent/agent.graph';
import { buildTutorAnswerNode } from '../src/modules/agent/nodes/tutor-answer.node';
import { buildAssistantAgentNode } from '../src/modules/agent/nodes/assistant-agent.node';
import { buildSearchDocumentsTool } from '../src/modules/agent/tools/search-documents.tool';
import { buildSummarizeMyRecentMessagesTool } from '../src/modules/agent/tools/summarize-my-recent-messages.tool';

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

const emptyKnowledgeServiceStub = {
  retrieveRelevantChunks: () => Promise.resolve([]),
} as unknown as KnowledgeService;

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
    const configService = applicationContext.get(ConfigService);
    const messagesService = applicationContext.get(MessagesService);

    for (const seedMessageContent of SEED_MESSAGE_CONTENTS) {
      await messagesService.createUserMessage(
        EVAL_CONVERSATION_ID,
        EVAL_AUTHENTICATED_USER_ID,
        seedMessageContent,
      );
    }

    const chatModel = new ChatOpenAI({
      apiKey: configService.get<string>('llm.apiKey'),
      model: configService.get<string>('llm.model'),
      maxTokens: configService.get<number>('llm.maxTokens'),
      temperature: configService.get<number>('llm.temperature'),
    });

    const agentGraph = buildAgentGraph({
      tutorAnswerNode: buildTutorAnswerNode(
        emptyKnowledgeServiceStub,
        chatModel,
      ),
      assistantAgentNode: buildAssistantAgentNode(chatModel, [
        buildSearchDocumentsTool(emptyKnowledgeServiceStub),
        buildSummarizeMyRecentMessagesTool(messagesService),
      ]),
      checkpointer: new MemorySaver(),
    });

    for (const [evalPromptIndex, evalPrompt] of evalPrompts.entries()) {
      const threadId = `assistant-eval-${evalPromptIndex}`;
      const result = await agentGraph.invoke(
        {
          messages: [new HumanMessage(evalPrompt.prompt)],
          conversationId: threadId,
          conversationType: 'assistant',
        },
        {
          configurable: {
            thread_id: threadId,
            userId: EVAL_AUTHENTICATED_USER_ID,
          },
        },
      );
      const assistantReplyText = result.messages.at(-1)?.text ?? '';

      console.log('═'.repeat(72));
      console.log(`# ${evalPrompt.name}`);
      console.log(`prompt:      ${evalPrompt.prompt}`);
      console.log(`expectation: ${evalPrompt.expectation}`);
      console.log(`response:    ${assistantReplyText.trim()}`);
    }
    console.log('═'.repeat(72));
  } finally {
    await applicationContext.close();
  }
}

void runEvalPrompts();
