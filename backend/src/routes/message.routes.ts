import { Router } from "express";
import {
  getMessagesController,
  createMessageController,
} from "../controllers/message.controller";

export const messagesRouter = Router();

messagesRouter.get("/:id/messages", getMessagesController);
messagesRouter.post("/:id/messages", createMessageController);
