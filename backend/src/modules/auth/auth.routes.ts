import { Router } from "express";
import type { AuthController } from "./auth.controller.js";
import { AuthenticateMiddleware } from "../../middleware/authenticate.js";
import { AuthorizeMiddleware } from "../../middleware/authorize.js";
import { ValidateMiddleware } from "../../middleware/validate.js";
import { registerSchema, loginSchema, updateStudentProfileSchema } from "./auth.types.js";

export class AuthRoutes {
  public router: Router;

  private authenticate: AuthenticateMiddleware;
  private validate: ValidateMiddleware;

  constructor(
    private controller: AuthController
  ) {
    this.router = Router();
    this.authenticate = new AuthenticateMiddleware();
    this.validate = new ValidateMiddleware();
    this.register();
  }

  private register(): void {
    const { authenticate, validate, controller } = this;

    // Public routes
    this.router.post(
      "/register",
      validate.handle(registerSchema),
      controller.register
    );

    this.router.post(
      "/login",
      validate.handle(loginSchema),
      controller.login
    );

    this.router.patch(
      "/profile",
      authenticate.handle,
      new AuthorizeMiddleware("student").handle,
      validate.handle(updateStudentProfileSchema),
      controller.updateStudentProfile
    );

    // Admin-only routes
    this.router.get(
      "/users",
      authenticate.handle,
      new AuthorizeMiddleware("admin").handle,
      controller.listAllUsers
    );

    this.router.get(
      "/users/pending",
      authenticate.handle,
      new AuthorizeMiddleware("admin").handle,
      controller.listPendingUsers
    );

    this.router.patch(
      "/users/:id/approve",
      authenticate.handle,
      new AuthorizeMiddleware("admin").handle,
      controller.approveUser
    );

    this.router.patch(
      "/users/:id/disable",
      authenticate.handle,
      new AuthorizeMiddleware("admin").handle,
      controller.disableUser
    );
  }
}
