import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { TutorEvalModule } from './tutor-eval.module';
import { KnowledgeService } from '../../src/modules/knowledge/knowledge.service';
import { RetrievedChunk } from '../../src/modules/knowledge/knowledge.entity';
import { TutorRagChain } from '../../src/modules/llm/tutor-rag.chain';

type QaPair = {
  question: string;
  expectedSource: string;
  expectedAnswerContains: string[];
};

const EVAL_USER_ID = '00000000000000000000e7a1';
const CORPUS_DIRECTORY = join(__dirname, 'corpus');

async function collectAnswer(
  tutorRagChain: TutorRagChain,
  question: string,
  retrievedChunks: RetrievedChunk[],
): Promise<string> {
  let answer = '';
  for await (const token of tutorRagChain.streamGroundedAnswer({
    question,
    retrievedChunks,
    history: [],
  })) {
    answer += token;
  }
  return answer;
}

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
    const tutorRagChain = applicationContext.get(TutorRagChain);

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

    let retrievalHits = 0;
    let answerHits = 0;

    for (const qaPair of qaPairs) {
      const retrievedChunks = await knowledgeService.retrieveRelevantChunks(
        EVAL_USER_ID,
        qaPair.question,
      );
      const retrievedTheExpectedSource = retrievedChunks.some(
        (chunk) => chunk.documentName === qaPair.expectedSource,
      );
      if (retrievedTheExpectedSource) {
        retrievalHits++;
      }

      const answer = await collectAnswer(
        tutorRagChain,
        qaPair.question,
        retrievedChunks,
      );
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
