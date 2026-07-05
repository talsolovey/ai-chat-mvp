export interface LlmTool {
  name: string;
  description: string;
  inputJsonSchema: Record<string, unknown>;
  run(rawToolInput: unknown): Promise<unknown>;
}
