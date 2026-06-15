import { Router } from "express";
import { authRouter } from "./auth.routes";
import { conversationsRouter } from "./conversation.routes";
import { messagesRouter } from "./message.routes";
import { authMiddleware } from "../middleware/authMiddleware";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok from /api/health" });
});

apiRouter.use("/auth", authRouter);

apiRouter.use("/conversations", authMiddleware);
apiRouter.use("/conversations", conversationsRouter);
apiRouter.use("/conversations", messagesRouter);
