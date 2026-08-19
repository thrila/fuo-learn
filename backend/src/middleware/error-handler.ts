import type { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/index.js";
import { Logger } from "../shared/utils/logger.js";

type RequestError = Error & { type?: string; code?: string };

export class ErrorHandlerMiddleware {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("error-handler");
  }

  handle = (err: RequestError, req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
      this.logger.warn(`${err.message}`, {
        code: err.code,
        statusCode: err.statusCode,
        requestId: req.requestId,
        method: req.method,
        url: req.url,
      });
      res.status(err.statusCode).json({
        error: {
          message: err.message,
          code: err.code,
          requestId: req.requestId,
        },
      });
      return;
    }

    if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
      this.logger.warn("Invalid JSON in request body", {
        message: err.message,
        requestId: req.requestId,
        method: req.method,
        url: req.url,
      });
      res.status(400).json({
        error: {
          message: "Invalid JSON in request body",
          code: "BAD_REQUEST",
          requestId: req.requestId,
        },
      });
      return;
    }

    if (err.name === "MulterError") {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large"
          : err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Unexpected file field"
            : `Upload error: ${err.message}`;
      this.logger.warn("Multer upload error", {
        code: err.code,
        message: err.message,
        requestId: req.requestId,
        method: req.method,
        url: req.url,
      });
      res.status(400).json({
        error: {
          message,
          code: "BAD_REQUEST",
          requestId: req.requestId,
        },
      });
      return;
    }

    if (err.message === "Only PDF and PPT/PPTX files are allowed") {
      res.status(400).json({
        error: {
          message: err.message,
          code: "BAD_REQUEST",
          requestId: req.requestId,
        },
      });
      return;
    }

    this.logger.error("Unhandled error", {
      message: err.message,
      stack: err.stack,
      requestId: req.requestId,
      method: req.method,
      url: req.url,
    });

    res.status(500).json({
      error: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
        requestId: req.requestId,
      },
    });
  };
}
