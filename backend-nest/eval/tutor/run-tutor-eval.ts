import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { HumanMessage } from '@langchain/core/messages';
import { TutorEvalModule } from './tutor-eval.module';
import { KnowledgeService } from '../../src/modules/knowledge/knowledge.service';
import { AGENT_GRAPH } from '../../src/modules/agent/agent.module';
import type { AgentGraph } from '../../src/modules/agent/agent.graph';

type QaPair = {
  question: string;
  expectedSource: string;
  expectedAnswerContains: string[];
};

const EVAL_USER_ID = '00000000000000000000e7a1';
const CORPUS_DIRECTORY = join(__dirname, 'corpus');

async function runTutorEval(): Promise<void> {
  if (!process.env.OPENAI_API_KEY || !process.env.MONGO_URI) {
    console.error('Set OPENAI_API_KEY and MONGO_URI before running the eval.');
    process.exitCode = 1;
    return;
  }

  const qaPairs = JSON.parse(
    readFileSync(join(__dirname, 'qa-pairs.json'), 'utf-8'),
  ) as QaPair[];

  const applicationContext = await NestFactory.createApplicationContext(
    TutorEvalModule,
    {
      logger: false,
    },
  );

  try {
    const knowledgeService = applicationContext.get(KnowledgeService);
    const agentGraph = applicationContext.get<AgentGraph>(AGENT_GRAPH);

    for (const existingDocument of await knowledgeService.listDocuments(
      EVAL_USER_ID,
    )) {
      await knowledgeService.deleteDocument(EVAL_USER_ID, existingDocument.id);
    }
    for (const fileName of readdirSync(CORPUS_DIRECTORY)) {
      const content = readFileSync(join(CORPUS_DIRECTORY, fileName), 'utf-8');
      await knowledgeService.ingestDocument(EVAL_USER_ID, fileName, content);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const evalRunId = Date.now();
    let retrievalHits = 0;
    let answerHits = 0;

    for (const [qaPairIndex, qaPair] of qaPairs.entries()) {
      const threadId = `tutor-eval-${evalRunId}-${qaPairIndex}`;
      const result = await agentGraph.invoke(
        {
          messages: [new HumanMessage(qaPair.question)],
          conversationId: threadId,
          conversationType: 'tutor',
        },
        { configurable: { thread_id: threadId, userId: EVAL_USER_ID } },
      );

      const retrievedTheExpectedSource = result.citations.some(
        (citation) => citation.documentName === qaPair.expectedSource,
      );
      if (retrievedTheExpectedSource) {
        retrievalHits++;
      }

      const answer = result.messages.at(-1)?.text ?? '';
      const lowerCaseAnswer = answer.toLowerCase();
      const answerCoveredExpectedFacts = qaPair.expectedAnswerContains.every(
        (expectedFact) => lowerCaseAnswer.includes(expectedFact.toLowerCase()),
      );
      if (answerCoveredExpectedFacts) {
        answerHits++;
      }

      console.log(
        `${retrievedTheExpectedSource ? 'RET ✓' : 'RET ✗'} ` +
          `${answerCoveredExpectedFacts ? 'ANS ✓' : 'ANS ✗'}  ${qaPair.question}`,
      );
    }

    const total = qaPairs.length;
    console.log('\n=== Tutor eval summary ===');
    console.log(
      `Retrieval recall: ${retrievalHits}/${total} (${((retrievalHits / total) * 100).toFixed(0)}%)`,
    );
    console.log(
      `Answer quality:   ${answerHits}/${total} (${((answerHits / total) * 100).toFixed(0)}%)`,
    );
  } finally {
    await applicationContext.close();
  }
}

runTutorEval().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
