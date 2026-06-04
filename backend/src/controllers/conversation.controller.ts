import type { Request, Response } from "express";
import {
  createConversationForUser,
  getConversationsForUser,
} from "../services/conversation.service";
import { getUserId } from "../middleware/authMiddleware";
import { parseOrThrow } from "../lib/validate";
import { createConversationBodySchema } from "../validation/schemas";

export function getConversationsController(req: Request, res: Response): void {
  const userId = getUserId(req);

  const items = getConversationsForUser(userId);

  res.status(200).json(items);
}

export function createConversationController(
  req: Request,
  res: Response,
): void {
  const userId = getUserId(req);

  const { title } = parseOrThrow(
    createConversationBodySchema,
    req.body,
    "Invalid request body",
  );

  const conversation = createConversationForUser(userId, title);

  res.status(201).json(conversation);
}
