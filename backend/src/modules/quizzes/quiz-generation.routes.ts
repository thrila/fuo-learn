import { Router } from "express";
import type { QuizGenerationController } from "./quiz-generation.controller.js";
import { AuthenticateMiddleware } from "../../middleware/authenticate.js";
import { AuthorizeMiddleware } from "../../middleware/authorize.js";
import { ValidateMiddleware } from "../../middleware/validate.js";
import { generateQuizRequestSchema } from "./quiz-generation.types.js";

export class QuizGenerationRoutes {
  public router: Router;

  private authenticate: AuthenticateMiddleware;
  private validate: ValidateMiddleware;

  constructor(
    private controller: QuizGenerationController
  ) {
    this.router = Router();
    this.authenticate = new AuthenticateMiddleware();
    this.validate = new ValidateMiddleware();
    this.register();
  }

  private register(): void {
    const { authenticate, validate, controller } = this;

    this.router.post(
      "/materials/:materialId/generate-quiz",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      validate.handle(generateQuizRequestSchema),
      controller.generateFromMaterial
    );
  }
}
