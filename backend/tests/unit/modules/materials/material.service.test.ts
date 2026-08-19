import { describe, it, expect, vi, beforeEach } from "vitest";
import { MaterialService } from "../../../../src/modules/materials/material.service.js";
import { NotFoundError, ForbiddenError } from "../../../../src/shared/errors/index.js";

function makeCourse(professorId = "prof-1") {
  return {
    id: "course-1",
    title: "Course",
    description: null,
    code: "C101",
    professor_id: professorId,
    created_at: new Date(),
    updated_at: new Date(),
    professor_first_name: "P",
    professor_last_name: "1",
    professor_email: "p@u.edu",
  };
}

function makeMaterial(overrides: Record<string, unknown> = {}) {
  return {
    id: "mat-1",
    course_id: "course-1",
    title: "Lecture 1",
    file_url: "/uploads/materials/mat-1.pdf",
    file_type: "application/pdf",
    file_key: "mat-1.pdf",
    uploaded_by: "prof-1",
    created_at: new Date(),
    ...overrides,
  };
}

function makeFile(): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: "lecture.pdf",
    encoding: "7bit",
    mimetype: "application/pdf",
    buffer: Buffer.from("fake-pdf"),
    size: 1024,
    destination: "",
    filename: "lecture.pdf",
    path: "",
    stream: null as never,
  };
}

function mockMaterialRepo() {
  return {
    findById: vi.fn(),
    findByCourse: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  } as any;
}

function mockCourseRepo() {
  return {
    findById: vi.fn(),
  } as any;
}

function mockEnrollmentRepo() {
  return {
    findExisting: vi.fn(),
  } as any;
}

function mockStorage() {
  return {
    store: vi.fn(),
    read: vi.fn(),
    delete: vi.fn(),
  } as any;
}

describe("MaterialService", () => {
  let service: MaterialService;
  let materialRepo: ReturnType<typeof mockMaterialRepo>;
  let courseRepo: ReturnType<typeof mockCourseRepo>;
  let enrollmentRepo: ReturnType<typeof mockEnrollmentRepo>;
  let storage: ReturnType<typeof mockStorage>;

  beforeEach(() => {
    materialRepo = mockMaterialRepo();
    courseRepo = mockCourseRepo();
    enrollmentRepo = mockEnrollmentRepo();
    storage = mockStorage();
    service = new MaterialService(materialRepo, courseRepo, enrollmentRepo, storage);
    vi.clearAllMocks();
  });

  describe("getMaterial", () => {
    it("returns a material by id", async () => {
      materialRepo.findById.mockResolvedValue(makeMaterial());

      const result = await service.getMaterial("mat-1");
      expect(result.id).toBe("mat-1");
    });

    it("throws NotFoundError if material does not exist", async () => {
      materialRepo.findById.mockResolvedValue(null);

      await expect(service.getMaterial("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("listByCourse", () => {
    it("returns materials for a course", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      materialRepo.findByCourse.mockResolvedValue([]);

      const result = await service.listByCourse(
        "course-1",
        "prof-1",
        "professor"
      );
      expect(result).toEqual([]);
    });

    it("throws NotFoundError if course does not exist", async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(
        service.listByCourse("nonexistent", "prof-1", "professor")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("uploadMaterial", () => {
    it("uploads a file to an existing course", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      storage.store.mockResolvedValue({
        key: "mat-1.pdf",
        url: "/uploads/materials/mat-1.pdf",
        path: "/fake/path",
      });
      materialRepo.create.mockResolvedValue(makeMaterial());

      const result = await service.uploadMaterial(
        "course-1",
        "Lecture 1",
        makeFile(),
        "prof-1",
        "professor"
      );
      expect(result.title).toBe("Lecture 1");
    });

    it("throws NotFoundError if course does not exist", async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(
        service.uploadMaterial(
          "nonexistent",
          "Lecture",
          makeFile(),
          "prof-1",
          "professor"
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("forbids professor from uploading to another professor's course", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());

      await expect(
        service.uploadMaterial(
          "course-1",
          "Lecture",
          makeFile(),
          "prof-2",
          "professor"
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows admin to upload to any course", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      storage.store.mockResolvedValue({
        key: "mat-1.pdf",
        url: "/uploads/materials/mat-1.pdf",
        path: "/fake/path",
      });
      materialRepo.create.mockResolvedValue(makeMaterial());

      await expect(
        service.uploadMaterial(
          "course-1",
          "Lecture",
          makeFile(),
          "admin-1",
          "admin"
        )
      ).resolves.toBeDefined();
    });
  });

  describe("deleteMaterial", () => {
    it("deletes a material and its file", async () => {
      materialRepo.findById.mockResolvedValue(makeMaterial());
      courseRepo.findById.mockResolvedValue(makeCourse("prof-1"));
      storage.delete.mockResolvedValue(undefined);
      materialRepo.delete.mockResolvedValue(true);

      await expect(
        service.deleteMaterial("mat-1", "prof-1", "professor")
      ).resolves.toBeUndefined();
      expect(materialRepo.delete).toHaveBeenCalledWith("mat-1");
      expect(storage.delete).toHaveBeenCalledWith("mat-1.pdf");
    });

    it("throws NotFoundError if material does not exist", async () => {
      materialRepo.findById.mockResolvedValue(null);

      await expect(
        service.deleteMaterial("nonexistent", "prof-1", "professor")
      ).rejects.toThrow(NotFoundError);
    });

    it("forbids professor from deleting another professor's material", async () => {
      materialRepo.findById.mockResolvedValue(makeMaterial());
      courseRepo.findById.mockResolvedValue(makeCourse("prof-2"));

      await expect(
        service.deleteMaterial("mat-1", "prof-1", "professor")
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows admin to delete any material", async () => {
      materialRepo.findById.mockResolvedValue(makeMaterial());
      storage.delete.mockResolvedValue(undefined);
      materialRepo.delete.mockResolvedValue(true);

      await expect(
        service.deleteMaterial("mat-1", "admin-1", "admin")
      ).resolves.toBeUndefined();
    });
  });
});
