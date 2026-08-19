import { Router } from "express";
import type { CourseController } from "./course.controller.js";
import { AuthenticateMiddleware } from "../../middleware/authenticate.js";
import { AuthorizeMiddleware } from "../../middleware/authorize.js";
import { ValidateMiddleware } from "../../middleware/validate.js";
import { createCourseSchema, updateCourseSchema } from "./course.types.js";

export class CourseRoutes {
  public router: Router;

  private authenticate: AuthenticateMiddleware;
  private validate: ValidateMiddleware;

  constructor(
    private controller: CourseController
  ) {
    this.router = Router();
    this.authenticate = new AuthenticateMiddleware();
    this.validate = new ValidateMiddleware();
    this.register();
  }

  private register(): void {
    const { authenticate, validate, controller } = this;

    // Any authenticated user can browse courses
    this.router.get(
      "/",
      authenticate.handle,
      controller.list
    );

    // Any authenticated user can view a course
    this.router.get(
      "/:id",
      authenticate.handle,
      controller.getById
    );

    // Admin creates courses
    this.router.post(
      "/",
      authenticate.handle,
      new AuthorizeMiddleware("admin").handle,
      validate.handle(createCourseSchema),
      controller.create
    );

    // Admin or assigned professor updates
    this.router.patch(
      "/:id",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      validate.handle(updateCourseSchema),
      controller.update
    );

    // Admin or assigned professor deletes
    this.router.delete(
      "/:id",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      controller.delete
    );
  }
}
