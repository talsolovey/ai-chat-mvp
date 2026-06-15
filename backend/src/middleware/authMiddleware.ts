import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/AppError";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const userId = req.header("x-user-id");
  if (!userId) {
    next(AppError.unauthorized("Missing x-user-id header"));
    return;
  }
  req.userId = userId;
  next();
}

export function getUserId(req: Request): string {
  const userId = req.userId;
  if (!userId) {
    throw AppError.unauthorized("Missing x-user-id header");
  }
  return userId;
}
