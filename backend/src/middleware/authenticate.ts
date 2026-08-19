import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { UnauthorizedError } from "../shared/errors/index.js";
import type { AuthenticatedUser } from "../shared/types/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export class AuthenticateMiddleware {
  handle = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const header = req.headers.authorization;
      const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
      const tokenStr = header?.startsWith("Bearer ") ? header.slice(7) : queryToken;

      if (!tokenStr) {
        throw new UnauthorizedError("Missing or malformed authorization header");
      }

      const payload = jwt.verify(tokenStr, config.JWT_SECRET) as AuthenticatedUser;
      req.user = payload;
      next();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        next(err);
      } else {
        next(new UnauthorizedError("Invalid or expired token"));
      }
    }
  };
}
