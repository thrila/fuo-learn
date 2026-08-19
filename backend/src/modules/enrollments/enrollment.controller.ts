import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../shared/types/index.js";
import type { EnrollmentManager } from "./enrollment.manager.js";

export class EnrollmentController {
  constructor(private enrollmentManager: EnrollmentManager) {}

  requestEnrollment = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const courseId = String(req.params.id);
    const enrollment = await this.enrollmentManager.requestEnrollment(courseId, authReq.user.id);
    res.status(201).json({ enrollment });
  };

  getEnrollmentsByCourse = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const courseId = String(req.params.id);
    const enrollments = await this.enrollmentManager.getEnrollmentsByCourse(
      courseId,
      authReq.user.id,
      authReq.user.role
    );
    res.json({ enrollments });
  };

  getMyEnrollments = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const enrollments = await this.enrollmentManager.getMyEnrollments(authReq.user.id);
    res.json({ enrollments });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const enrollmentId = String(req.params.id);
    const enrollment = await this.enrollmentManager.updateEnrollmentStatus(
      enrollmentId,
      req.body.status,
      authReq.user.id,
      authReq.user.role
    );
    res.json({ enrollment });
  };
}
