import type { Request, Response, NextFunction } from "express";

export function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    console.log(`${method} ${originalUrl} -> ${statusCode} (${duration}ms)`);
  });

  next();
}
