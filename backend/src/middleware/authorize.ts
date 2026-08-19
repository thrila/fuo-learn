import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../shared/errors/index.js";
import type { UserRole } from "../shared/types/index.js";

export class AuthorizeMiddleware {
  private allowedRoles: UserRole[];

  constructor(...roles: UserRole[]) {
    this.allowedRoles = roles;
  }

  handle = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!this.allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError("Insufficient permissions"));
      return;
    }

    next();
  };
}
