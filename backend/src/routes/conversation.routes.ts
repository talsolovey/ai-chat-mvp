import { Router } from "express";
import {
  createConversationController,
  getConversationsController,
} from "../controllers/conversation.controller";

export const conversationsRouter = Router();

conversationsRouter.get("/", getConversationsController);
conversationsRouter.post("/", createConversationController);
