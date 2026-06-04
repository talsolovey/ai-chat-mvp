import type { ErrorRequestHandler } from "express";
import { AppError, type ErrorResponseBody } from "../lib/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toResponseBody());
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    const body: ErrorResponseBody = {
      error: { code: "BAD_REQUEST", message: "Invalid JSON body" },
    };
    res.status(400).json(body);
    return;
  }

  console.error("Unhandled error:", err);
  const body: ErrorResponseBody = {
    error: { code: "INTERNAL", message: "Something went wrong." },
  };
  res.status(500).json(body);
};
