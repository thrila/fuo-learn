import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BadRequestError } from "../shared/errors/index.js";

type RequestSource = "body" | "query" | "params";

export class ValidateMiddleware {
  handle(schema: z.ZodType, source: RequestSource = "body") {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
        const message = Object.entries(fieldErrors)
          .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
          .join("; ");
        next(new BadRequestError(message || "Validation failed"));
        return;
      }
      req[source] = result.data;
      next();
    };
  }
}
