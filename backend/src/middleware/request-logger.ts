import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { Logger } from "../shared/utils/logger.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export class RequestLogger {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("http");
  }

  handle = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    const start = Date.now();
    const { method, url } = req;

    res.on("finish", () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

      this.logger[level](`${method} ${url} ${res.statusCode}`, {
        requestId,
        method,
        url,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
    });

    next();
  };
}
