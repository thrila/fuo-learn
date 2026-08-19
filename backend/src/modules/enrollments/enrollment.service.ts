import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from "../../shared/errors/index.js";
import type { UserRole } from "../../shared/types/index.js";
import { EnrollmentRepository, type EnrollmentRow, type EnrollmentWithDetails } from "./enrollment.repository.js";
import type { CourseRepository } from "../courses/course.repository.js";

export class EnrollmentService {
  constructor(
    private enrollmentRepo: EnrollmentRepository,
    private courseRepo: CourseRepository
  ) {}

  async requestEnrollment(courseId: string, studentId: string): Promise<EnrollmentRow> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");

    const existing = await this.enrollmentRepo.findExisting(courseId, studentId);
    if (existing) {
      if (existing.status === "approved") throw new ConflictError("Already enrolled in this course");
      if (existing.status === "pending") throw new ConflictError("Enrollment request already pending");
      // If rejected, allow re-request by updating
      const updated = await this.enrollmentRepo.updateStatus(existing.id, "pending");
      return updated!;
    }

    return this.enrollmentRepo.create(courseId, studentId);
  }

  async getEnrollmentsByCourse(
    courseId: string,
    requestorId: string,
    requestorRole: UserRole
  ): Promise<EnrollmentWithDetails[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");

    if (requestorRole === "professor" && course.professor_id !== requestorId) {
      throw new ForbiddenError("You can only view enrollments for your own courses");
    }

    return this.enrollmentRepo.findByCourse(courseId);
  }

  async getMyEnrollments(studentId: string): Promise<EnrollmentWithDetails[]> {
    return this.enrollmentRepo.findByStudent(studentId);
  }

  async updateEnrollmentStatus(
    enrollmentId: string,
    status: "approved" | "rejected",
    requestorId: string,
    requestorRole: UserRole
  ): Promise<EnrollmentRow> {
    const enrollment = await this.enrollmentRepo.findById(enrollmentId);
    if (!enrollment) throw new NotFoundError("Enrollment not found");

    if (enrollment.status !== "pending") {
      throw new BadRequestError("Can only approve or reject pending enrollments");
    }

    if (requestorRole === "professor") {
      const course = await this.courseRepo.findById(enrollment.course_id);
      if (!course || course.professor_id !== requestorId) {
        throw new ForbiddenError("You can only manage enrollments for your own courses");
      }
    }

    const updated = await this.enrollmentRepo.updateStatus(enrollmentId, status);
    return updated!;
  }
}
