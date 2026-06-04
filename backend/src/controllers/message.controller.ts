import type { Request, Response } from "express";
import {
  createMessage,
  getMessagesForConversation,
} from "../services/message.service";
import { getUserId } from "../middleware/authMiddleware";
import { parseOrThrow } from "../lib/validate";
import {
  createMessageBodySchema,
  getMessagesQuerySchema,
} from "../validation/schemas";

type ConversationParams = { id: string };

export function getMessagesController(
  req: Request<ConversationParams>,
  res: Response,
): void {
  const userId = getUserId(req);
  const { id } = req.params;
  const { cursor, limit } = parseOrThrow(
    getMessagesQuerySchema,
    req.query,
    "Invalid query parameters",
  );

  const result = getMessagesForConversation(id, userId, cursor, limit);

  res.status(200).json(result);
}

export function createMessageController(
  req: Request<ConversationParams>,
  res: Response,
): void {
  const userId = getUserId(req);
  const { id } = req.params;

  const { content } = parseOrThrow(
    createMessageBodySchema,
    req.body,
    "Invalid request body",
  );

  const message = createMessage(id, userId, content);

  res.status(201).json(message);
}
