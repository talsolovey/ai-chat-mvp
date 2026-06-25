import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import {
  AssistantReplyArgs,
  LlmProvider,
  LlmStreamEvent,
} from './llm-provider';
import { LlmTool } from './llm-tool';

const MAXIMUM_TOOL_CALL_ROUNDS = 5;

type ToolCallBeingAssembled = {
  toolCallId: string;
  functionName: string;
  functionArgumentsJson: string;
};

@Injectable()
export class OpenAiService extends LlmProvider {
  private readonly openAiClient: OpenAI;
  private readonly defaultModel: string;
  private readonly defaultMaxTokens: number;
  private readonly defaultTemperature: number;

  constructor(private readonly configService: ConfigService) {
    super();
    this.openAiClient = new OpenAI({
      apiKey: this.configService.get<string>('llm.apiKey'),
    });
    this.defaultModel =
      this.configService.get<string>('llm.model') ?? 'gpt-4o-mini-2024-07-18';
    this.defaultMaxTokens =
      this.configService.get<number>('llm.maxTokens') ?? 256;
    this.defaultTemperature =
      this.configService.get<number>('llm.temperature') ?? 0.7;
  }

  async *streamAssistantReply(
    args: AssistantReplyArgs,
  ): AsyncIterable<LlmStreamEvent> {
    const availableTools = args.tools ?? [];
    const toolDefinitions = this.toOpenAiToolDefinitions(availableTools);
    const conversationMessages = this.buildChatMessages(args);

    for (
      let roundIndex = 0;
      roundIndex < MAXIMUM_TOOL_CALL_ROUNDS;
      roundIndex++
    ) {
      const completionStream = await this.openAiClient.chat.completions.create({
        model: this.defaultModel,
        max_tokens: args.maxTokens ?? this.defaultMaxTokens,
        temperature: args.temperature ?? this.defaultTemperature,
        stream: true,
        messages: conversationMessages,
        tools: toolDefinitions,
      });

      const toolCallsByIndex = new Map<number, ToolCallBeingAssembled>();
      let finishReason: string | null = null;

      for await (const streamChunk of completionStream) {
        const firstChoice = streamChunk.choices[0];
        const tokenText = firstChoice?.delta?.content;
        if (tokenText) {
          yield { type: 'token', text: tokenText };
        }

        for (const toolCallDelta of firstChoice?.delta?.tool_calls ?? []) {
          const partialToolCall = toolCallsByIndex.get(toolCallDelta.index) ?? {
            toolCallId: '',
            functionName: '',
            functionArgumentsJson: '',
          };
          toolCallsByIndex.set(toolCallDelta.index, {
            toolCallId: toolCallDelta.id ?? partialToolCall.toolCallId,
            functionName:
              toolCallDelta.function?.name ?? partialToolCall.functionName,
            functionArgumentsJson:
              partialToolCall.functionArgumentsJson +
              (toolCallDelta.function?.arguments ?? ''),
          });
        }

        if (firstChoice?.finish_reason) {
          finishReason = firstChoice.finish_reason;
        }
      }

      if (finishReason !== 'tool_calls' || toolCallsByIndex.size === 0) {
        break;
      }

      const requestedToolCalls = [...toolCallsByIndex.values()];

      conversationMessages.push({
        role: 'assistant',
        content: null,
        tool_calls: requestedToolCalls.map((toolCall) => ({
          id: toolCall.toolCallId,
          type: 'function',
          function: {
            name: toolCall.functionName,
            arguments: toolCall.functionArgumentsJson,
          },
        })),
      });

      for (const toolCall of requestedToolCalls) {
        const toolResult = await this.executeToolCall(availableTools, toolCall);
        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.toolCallId,
          content: JSON.stringify(toolResult),
        });
      }
    }

    yield { type: 'done' };
  }

  private async executeToolCall(
    availableTools: LlmTool[],
    toolCall: ToolCallBeingAssembled,
  ): Promise<unknown> {
    const matchingTool = availableTools.find(
      (candidateTool) => candidateTool.name === toolCall.functionName,
    );
    if (!matchingTool) {
      return { error: `Unknown tool: ${toolCall.functionName}` };
    }
    try {
      const parsedToolInput: unknown = toolCall.functionArgumentsJson
        ? JSON.parse(toolCall.functionArgumentsJson)
        : {};
      return await matchingTool.run(parsedToolInput);
    } catch {
      return { error: `Tool ${toolCall.functionName} failed to run` };
    }
  }

  private toOpenAiToolDefinitions(
    availableTools: LlmTool[],
  ): ChatCompletionTool[] | undefined {
    if (availableTools.length === 0) {
      return undefined;
    }
    return availableTools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputJsonSchema,
      },
    }));
  }

  private buildChatMessages(
    args: AssistantReplyArgs,
  ): ChatCompletionMessageParam[] {
    return [
      { role: 'system', content: args.systemPrompt },
      ...args.messages.map(
        (message): ChatCompletionMessageParam => ({
          role: message.role,
          content: message.content,
        }),
      ),
    ];
  }
}
