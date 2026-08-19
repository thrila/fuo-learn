import { Router } from "express";
import type { QuizAttemptController } from "./quiz-attempt.controller.js";
import { AuthenticateMiddleware } from "../../middleware/authenticate.js";
import { AuthorizeMiddleware } from "../../middleware/authorize.js";
import { ValidateMiddleware } from "../../middleware/validate.js";
import { submitAttemptSchema } from "./quiz-attempt.types.js";

export class QuizAttemptRoutes {
  public router: Router;

  private authenticate: AuthenticateMiddleware;
  private validate: ValidateMiddleware;

  constructor(
    private controller: QuizAttemptController
  ) {
    this.router = Router();
    this.authenticate = new AuthenticateMiddleware();
    this.validate = new ValidateMiddleware();
    this.register();
  }

  private register(): void {
    const { authenticate, validate, controller } = this;

    // Student starts a quiz attempt
    this.router.post(
      "/quizzes/:id/attempts",
      authenticate.handle,
      new AuthorizeMiddleware("student").handle,
      controller.start
    );

    // Submit answers
    this.router.post(
      "/attempts/:id/submit",
      authenticate.handle,
      new AuthorizeMiddleware("student").handle,
      validate.handle(submitAttemptSchema),
      controller.submit
    );

    // Student views their attempts. This must be before /attempts/:id so "mine"
    // is not treated as an attempt ID.
    this.router.get(
      "/attempts/mine",
      authenticate.handle,
      new AuthorizeMiddleware("student").handle,
      controller.getMyAttempts
    );

    // Get attempt details
    this.router.get(
      "/attempts/:id",
      authenticate.handle,
      controller.getById
    );
  }
}
