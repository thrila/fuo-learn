import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnrollmentService } from "../../../../src/modules/enrollments/enrollment.service.js";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from "../../../../src/shared/errors/index.js";

function makeCourse(professorId = "prof-1") {
  return {
    id: "course-1",
    title: "Test Course",
    description: null,
    code: "TST101",
    professor_id: professorId,
    created_at: new Date(),
    updated_at: new Date(),
    professor_first_name: "Prof",
    professor_last_name: "One",
    professor_email: "prof@uni.edu",
  };
}

function makeEnrollment(overrides: Record<string, unknown> = {}) {
  return {
    id: "enroll-1",
    course_id: "course-1",
    student_id: "student-1",
    status: "pending" as const,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function mockEnrollmentRepo() {
  return {
    findById: vi.fn(),
    findExisting: vi.fn(),
    findByCourse: vi.fn(),
    findByStudent: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  } as any;
}

function mockCourseRepo() {
  return {
    findById: vi.fn(),
  } as any;
}

describe("EnrollmentService", () => {
  let service: EnrollmentService;
  let enrollRepo: ReturnType<typeof mockEnrollmentRepo>;
  let courseRepo: ReturnType<typeof mockCourseRepo>;

  beforeEach(() => {
    enrollRepo = mockEnrollmentRepo();
    courseRepo = mockCourseRepo();
    service = new EnrollmentService(enrollRepo, courseRepo);
    vi.clearAllMocks();
  });

  describe("requestEnrollment", () => {
    it("creates a new enrollment for a valid course", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      enrollRepo.findExisting.mockResolvedValue(null);
      enrollRepo.create.mockResolvedValue(makeEnrollment());

      const result = await service.requestEnrollment("course-1", "student-1");
      expect(result.status).toBe("pending");
    });

    it("throws NotFoundError if course does not exist", async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(
        service.requestEnrollment("nonexistent", "student-1")
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError if already approved", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      enrollRepo.findExisting.mockResolvedValue(
        makeEnrollment({ status: "approved" })
      );

      await expect(
        service.requestEnrollment("course-1", "student-1")
      ).rejects.toThrow(ConflictError);
    });

    it("throws ConflictError if already pending", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      enrollRepo.findExisting.mockResolvedValue(
        makeEnrollment({ status: "pending" })
      );

      await expect(
        service.requestEnrollment("course-1", "student-1")
      ).rejects.toThrow(ConflictError);
    });

    it("allows re-request after rejection", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      enrollRepo.findExisting.mockResolvedValue(
        makeEnrollment({ status: "rejected" })
      );
      enrollRepo.updateStatus.mockResolvedValue(
        makeEnrollment({ status: "pending" })
      );

      const result = await service.requestEnrollment("course-1", "student-1");
      expect(result.status).toBe("pending");
      expect(enrollRepo.updateStatus).toHaveBeenCalledWith("enroll-1", "pending");
    });
  });

  describe("getEnrollmentsByCourse", () => {
    it("returns enrollments for the course", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      enrollRepo.findByCourse.mockResolvedValue([]);

      const result = await service.getEnrollmentsByCourse(
        "course-1",
        "prof-1",
        "professor"
      );
      expect(result).toEqual([]);
    });

    it("throws NotFoundError if course does not exist", async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(
        service.getEnrollmentsByCourse("nonexistent", "prof-1", "professor")
      ).rejects.toThrow(NotFoundError);
    });

    it("forbids professor from viewing another professor's enrollments", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());

      await expect(
        service.getEnrollmentsByCourse("course-1", "prof-2", "professor")
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows admin to view any course enrollments", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      enrollRepo.findByCourse.mockResolvedValue([]);

      await expect(
        service.getEnrollmentsByCourse("course-1", "admin-1", "admin")
      ).resolves.toBeDefined();
    });
  });

  describe("updateEnrollmentStatus", () => {
    it("approves a pending enrollment as admin", async () => {
      enrollRepo.findById.mockResolvedValue(makeEnrollment());
      enrollRepo.updateStatus.mockResolvedValue(
        makeEnrollment({ status: "approved" })
      );

      const result = await service.updateEnrollmentStatus(
        "enroll-1",
        "approved",
        "admin-1",
        "admin"
      );
      expect(result.status).toBe("approved");
    });

    it("approves a pending enrollment as professor", async () => {
      enrollRepo.findById.mockResolvedValue(makeEnrollment());
      courseRepo.findById.mockResolvedValue(makeCourse("prof-1"));
      enrollRepo.updateStatus.mockResolvedValue(
        makeEnrollment({ status: "approved" })
      );

      const result = await service.updateEnrollmentStatus(
        "enroll-1",
        "approved",
        "prof-1",
        "professor"
      );
      expect(result.status).toBe("approved");
    });

    it("throws NotFoundError if enrollment does not exist", async () => {
      enrollRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateEnrollmentStatus(
          "nonexistent",
          "approved",
          "admin-1",
          "admin"
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError if enrollment is not pending", async () => {
      enrollRepo.findById.mockResolvedValue(
        makeEnrollment({ status: "approved" })
      );

      await expect(
        service.updateEnrollmentStatus(
          "enroll-1",
          "rejected",
          "admin-1",
          "admin"
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("forbids professor from approving enrollment in another course", async () => {
      enrollRepo.findById.mockResolvedValue(makeEnrollment());
      courseRepo.findById.mockResolvedValue(makeCourse("prof-2"));

      await expect(
        service.updateEnrollmentStatus(
          "enroll-1",
          "approved",
          "prof-1",
          "professor"
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows admin to approve any enrollment", async () => {
      enrollRepo.findById.mockResolvedValue(makeEnrollment());
      enrollRepo.updateStatus.mockResolvedValue(
        makeEnrollment({ status: "approved" })
      );

      const result = await service.updateEnrollmentStatus(
        "enroll-1",
        "approved",
        "admin-1",
        "admin"
      );
      expect(result.status).toBe("approved");
    });
  });
});
