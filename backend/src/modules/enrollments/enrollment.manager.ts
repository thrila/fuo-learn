import type { UserRole } from "../../shared/types/index.js";
import { EnrollmentService } from "./enrollment.service.js";

export class EnrollmentManager {
  constructor(private enrollmentService: EnrollmentService) {}

  async requestEnrollment(courseId: string, studentId: string) {
    return this.enrollmentService.requestEnrollment(courseId, studentId);
  }

  async getEnrollmentsByCourse(courseId: string, requestorId: string, requestorRole: UserRole) {
    return this.enrollmentService.getEnrollmentsByCourse(courseId, requestorId, requestorRole);
  }

  async getMyEnrollments(studentId: string) {
    return this.enrollmentService.getMyEnrollments(studentId);
  }

  async updateEnrollmentStatus(
    enrollmentId: string,
    status: "approved" | "rejected",
    requestorId: string,
    requestorRole: UserRole
  ) {
    return this.enrollmentService.updateEnrollmentStatus(enrollmentId, status, requestorId, requestorRole);
  }
}
