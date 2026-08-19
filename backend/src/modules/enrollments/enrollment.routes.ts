import { Router } from "express";
import type { EnrollmentController } from "./enrollment.controller.js";
import { AuthenticateMiddleware } from "../../middleware/authenticate.js";
import { AuthorizeMiddleware } from "../../middleware/authorize.js";
import { ValidateMiddleware } from "../../middleware/validate.js";
import { approveEnrollmentSchema } from "./enrollment.types.js";

export class EnrollmentRoutes {
  public router: Router;

  private authenticate: AuthenticateMiddleware;
  private validate: ValidateMiddleware;

  constructor(
    private controller: EnrollmentController
  ) {
    this.router = Router();
    this.authenticate = new AuthenticateMiddleware();
    this.validate = new ValidateMiddleware();
    this.register();
  }

  private register(): void {
    const { authenticate, validate, controller } = this;

    // Student requests enrollment in a course
    this.router.post(
      "/courses/:id/enroll",
      authenticate.handle,
      new AuthorizeMiddleware("student").handle,
      controller.requestEnrollment
    );

    // Professor/admin views enrollment requests for a course
    this.router.get(
      "/courses/:id/enrollments",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      controller.getEnrollmentsByCourse
    );

    // Student views their own enrollments
    this.router.get(
      "/enrollments/mine",
      authenticate.handle,
      new AuthorizeMiddleware("student").handle,
      controller.getMyEnrollments
    );

    // Professor/admin approves or rejects enrollment
    this.router.patch(
      "/enrollments/:id/status",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      validate.handle(approveEnrollmentSchema),
      controller.updateStatus
    );
  }
}
