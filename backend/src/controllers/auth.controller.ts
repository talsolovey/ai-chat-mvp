import type { Request, Response } from "express";
import { login } from "../services/auth.service";
import { AppError } from "../lib/AppError";
import { parseOrThrow } from "../lib/validate";
import { loginBodySchema } from "../validation/schemas";

export function loginController(req: Request, res: Response): void {
  const { userId } = parseOrThrow(
    loginBodySchema,
    req.body,
    "Invalid request body",
  );

  const result = login(userId);

  if (!result) {
    throw AppError.unauthorized("Unknown user");
  }

  res.status(200).json({
    token: result.token,
    user: result.user,
  });
}
