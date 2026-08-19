import { Router } from "express";
import type { QuizController } from "./quiz.controller.js";
import { AuthenticateMiddleware } from "../../middleware/authenticate.js";
import { AuthorizeMiddleware } from "../../middleware/authorize.js";
import { ValidateMiddleware } from "../../middleware/validate.js";
import { createQuizSchema, updateQuizSchema, addQuestionSchema } from "./quiz.types.js";

export class QuizRoutes {
  public router: Router;

  private authenticate: AuthenticateMiddleware;
  private validate: ValidateMiddleware;

  constructor(
    private controller: QuizController
  ) {
    this.router = Router();
    this.authenticate = new AuthenticateMiddleware();
    this.validate = new ValidateMiddleware();
    this.register();
  }

  private register(): void {
    const { authenticate, validate, controller } = this;

    // List quizzes for a course
    this.router.get(
      "/courses/:id/quizzes",
      authenticate.handle,
      controller.listByCourse
    );

    // Get quiz by ID
    this.router.get(
      "/quizzes/:id",
      authenticate.handle,
      controller.getById
    );

    // Get questions for a quiz
    this.router.get(
      "/quizzes/:id/questions",
      authenticate.handle,
      controller.getQuestions
    );

    // Create quiz (professor/admin)
    this.router.post(
      "/quizzes",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      validate.handle(createQuizSchema),
      controller.create
    );

    // Update quiz
    this.router.patch(
      "/quizzes/:id",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      validate.handle(updateQuizSchema),
      controller.update
    );

    // Publish quiz
    this.router.post(
      "/quizzes/:id/publish",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      controller.publish
    );

    // Unpublish quiz
    this.router.post(
      "/quizzes/:id/unpublish",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      controller.unpublish
    );

    // Add question to quiz
    this.router.post(
      "/quizzes/:id/questions",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      validate.handle(addQuestionSchema),
      controller.addQuestion
    );

    // Delete quiz
    this.router.delete(
      "/quizzes/:id",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      controller.delete
    );

    // Delete question from quiz
    this.router.delete(
      "/quizzes/:quizId/questions/:questionId",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      controller.deleteQuestion
    );
  }
}
