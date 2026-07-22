import type { NextFunction, Request, Response } from "express";

export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const route = req.originalUrl ?? req.url;

  res.on("finish", () => {
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(`${req.method} ${route} ${res.statusCode} ${duration}ms`);
  });

  next();
}
