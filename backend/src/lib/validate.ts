import type { ZodType } from "zod";
import { AppError } from "./AppError";

export function parseOrThrow<T>(
  schema: ZodType<T>,
  data: unknown,
  message = "Invalid request",
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw AppError.badRequest(message, {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
}
