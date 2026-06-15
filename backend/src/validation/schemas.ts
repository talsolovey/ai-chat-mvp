import { z } from "zod";

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

export const loginBodySchema = z.object({
  userId: z.string().trim().min(1, "userId is required"),
});

export const createConversationBodySchema = z.object({
  title: z.string().trim().min(1, "title is required"),
});

export const createMessageBodySchema = z.object({
  content: z.string().trim().min(1, "content is required"),
});

export const getMessagesQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce
    .number()
    .int("limit must be an integer")
    .positive("limit must be positive")
    .max(MAX_PAGE_SIZE, `limit must be at most ${MAX_PAGE_SIZE}`)
    .optional(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type CreateConversationBody = z.infer<
  typeof createConversationBodySchema
>;
export type CreateMessageBody = z.infer<typeof createMessageBodySchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
