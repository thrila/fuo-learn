import { BadRequestError, NotFoundError, ForbiddenError } from "../../shared/errors/index.js";
import type { UserRole } from "../../shared/types/index.js";
import { MaterialRepository, type MaterialRow, type MaterialWithUploader } from "./material.repository.js";
import type { CourseRepository } from "../courses/course.repository.js";
import type { EnrollmentRepository } from "../enrollments/enrollment.repository.js";
import type { LocalStorage } from "../../infrastructure/storage/index.js";
import { uploadMaterialSchema } from "./material.types.js";

export class MaterialService {
  constructor(
    private materialRepo: MaterialRepository,
    private courseRepo: CourseRepository,
    private enrollmentRepo: EnrollmentRepository,
    private storage: LocalStorage
  ) {}

  async getMaterial(id: string): Promise<MaterialRow> {
    const material = await this.materialRepo.findById(id);
    if (!material) throw new NotFoundError("Material not found");
    return material;
  }

  async listByCourse(
    courseId: string,
    requestorId: string,
    requestorRole: UserRole
  ): Promise<MaterialWithUploader[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");

    if (requestorRole === "professor" && course.professor_id !== requestorId) {
      throw new ForbiddenError("You can only view materials for your own courses");
    }

    if (requestorRole === "student") {
      const enrollment = await this.enrollmentRepo.findExisting(courseId, requestorId);
      if (!enrollment || enrollment.status !== "approved") {
        throw new ForbiddenError("You must be enrolled in this course to view materials");
      }
    }

    return this.materialRepo.findByCourse(courseId);
  }

  async serveFile(
    id: string,
    requestorId: string,
    requestorRole: UserRole
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const material = await this.getAccessibleMaterial(id, requestorId, requestorRole);

    const buffer = await this.storage.read(material.file_key);
    return {
      buffer,
      contentType: material.file_type,
      filename: material.title,
    };
  }

  async uploadMaterial(
    courseId: string,
    title: string,
    file: Express.Multer.File,
    uploadedBy: string,
    requestorRole: UserRole
  ): Promise<MaterialRow> {
    const parsedTitle = uploadMaterialSchema.safeParse({ title: title.trim() });
    if (!parsedTitle.success) {
      throw new BadRequestError("Material title must be between 1 and 255 characters");
    }

    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");

    if (requestorRole === "professor" && course.professor_id !== uploadedBy) {
      throw new ForbiddenError("You can only upload materials to your own courses");
    }

    const stored = await this.storage.store(file, "materials");

    return this.materialRepo.create({
      course_id: courseId,
      title: parsedTitle.data.title,
      file_url: stored.url,
      file_type: file.mimetype,
      file_key: stored.path,
      uploaded_by: uploadedBy,
    });
  }

  async deleteMaterial(
    id: string,
    requestorId: string,
    requestorRole: UserRole
  ): Promise<void> {
    const material = await this.materialRepo.findById(id);
    if (!material) throw new NotFoundError("Material not found");

    if (requestorRole === "professor") {
      const course = await this.courseRepo.findById(material.course_id);
      if (!course || course.professor_id !== requestorId) {
        throw new ForbiddenError("You can only delete materials from your own courses");
      }
    }

    await this.materialRepo.delete(id);
    await this.storage.delete(material.file_key);
  }

  async getAccessibleMaterial(
    id: string,
    requestorId: string,
    requestorRole: UserRole
  ): Promise<MaterialRow> {
    const material = await this.getMaterial(id);

    if (requestorRole === "professor") {
      const course = await this.courseRepo.findById(material.course_id);
      if (!course || course.professor_id !== requestorId) {
        throw new ForbiddenError("You can only access materials for your own courses");
      }
    }

    if (requestorRole === "student") {
      const enrollment = await this.enrollmentRepo.findExisting(material.course_id, requestorId);
      if (!enrollment || enrollment.status !== "approved") {
        throw new ForbiddenError("You must be enrolled in this course to access materials");
      }
    }

    return material;
  }
}
