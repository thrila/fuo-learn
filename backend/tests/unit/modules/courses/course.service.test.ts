import { describe, it, expect, vi, beforeEach } from "vitest";
import { CourseService } from "../../../../src/modules/courses/course.service.js";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../../../../src/shared/errors/index.js";

function makeCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: "course-1",
    title: "Test Course",
    description: "A test course",
    code: "TST101",
    professor_id: "prof-1",
    created_at: new Date(),
    updated_at: new Date(),
    professor_first_name: "Prof",
    professor_last_name: "One",
    professor_email: "prof@uni.edu",
    ...overrides,
  };
}

function mockRepo() {
  return {
    findById: vi.fn(),
    findByCode: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as any;
}

describe("CourseService", () => {
  let service: CourseService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(() => {
    repo = mockRepo();
    service = new CourseService(repo);
    vi.clearAllMocks();
  });

  describe("getCourse", () => {
    it("returns a course by id", async () => {
      repo.findById.mockResolvedValue(makeCourse());

      const result = await service.getCourse("course-1");
      expect(result.id).toBe("course-1");
    });

    it("throws NotFoundError if course does not exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getCourse("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("createCourse", () => {
    it("creates a course with unique code", async () => {
      repo.findByCode.mockResolvedValue(null);
      repo.create.mockResolvedValue(makeCourse());

      const result = await service.createCourse({
        title: "Test Course",
        code: "TST101",
        professorId: "prof-1",
      });

      expect(result.code).toBe("TST101");
    });

    it("throws ConflictError if course code already exists", async () => {
      repo.findByCode.mockResolvedValue(makeCourse());

      await expect(
        service.createCourse({
          title: "Test Course",
          code: "TST101",
          professorId: "prof-1",
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("updateCourse", () => {
    it("allows admin to update any course", async () => {
      repo.findById.mockResolvedValue(makeCourse());
      repo.findByCode.mockResolvedValue(null);
      repo.update.mockResolvedValue(makeCourse({ title: "Updated" }));

      const result = await service.updateCourse(
        "course-1",
        { title: "Updated" },
        "admin-1",
        "admin"
      );
      expect(result.title).toBe("Updated");
    });

    it("allows professor to update their own course", async () => {
      repo.findById.mockResolvedValue(makeCourse());
      repo.findByCode.mockResolvedValue(null);
      repo.update.mockResolvedValue(makeCourse({ title: "Updated" }));

      const result = await service.updateCourse(
        "course-1",
        { title: "Updated" },
        "prof-1",
        "professor"
      );
      expect(result.title).toBe("Updated");
    });

    it("forbids professor from updating another professor's course", async () => {
      repo.findById.mockResolvedValue(makeCourse());

      await expect(
        service.updateCourse(
          "course-1",
          { title: "Hacked" },
          "prof-2",
          "professor"
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError if course does not exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updateCourse("nonexistent", { title: "X" }, "admin-1", "admin")
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when changing to a duplicate code", async () => {
      repo.findById.mockResolvedValue(makeCourse({ code: "OLD101" }));
      repo.findByCode.mockResolvedValue(makeCourse());

      await expect(
        service.updateCourse(
          "course-1",
          { code: "TST101" },
          "admin-1",
          "admin"
        )
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("deleteCourse", () => {
    it("allows admin to delete any course", async () => {
      repo.findById.mockResolvedValue(makeCourse());
      repo.delete.mockResolvedValue(true);

      await expect(
        service.deleteCourse("course-1", "admin-1", "admin")
      ).resolves.toBeUndefined();
    });

    it("allows professor to delete their own course", async () => {
      repo.findById.mockResolvedValue(makeCourse());
      repo.delete.mockResolvedValue(true);

      await expect(
        service.deleteCourse("course-1", "prof-1", "professor")
      ).resolves.toBeUndefined();
    });

    it("forbids professor from deleting another professor's course", async () => {
      repo.findById.mockResolvedValue(makeCourse());

      await expect(
        service.deleteCourse("course-1", "prof-2", "professor")
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError if course does not exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.deleteCourse("nonexistent", "admin-1", "admin")
      ).rejects.toThrow(NotFoundError);
    });
  });
});
