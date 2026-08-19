import { ConflictError, NotFoundError, ForbiddenError } from "../../shared/errors/index.js";
import type { UserRole } from "../../shared/types/index.js";
import { CourseRepository, type CourseRow, type CourseWithProfessor } from "./course.repository.js";

export class CourseService {
  constructor(private courseRepo: CourseRepository) {}

  async getCourse(id: string): Promise<CourseWithProfessor> {
    const course = await this.courseRepo.findById(id);
    if (!course) throw new NotFoundError("Course not found");
    return course;
  }

  async listCourses(filters?: { professorId?: string }): Promise<CourseWithProfessor[]> {
    return this.courseRepo.findMany(filters);
  }

  async createCourse(input: {
    title: string;
    description?: string;
    code: string;
    professorId: string;
  }): Promise<CourseRow> {
    const existing = await this.courseRepo.findByCode(input.code);
    if (existing) throw new ConflictError("A course with this code already exists");

    return this.courseRepo.create({
      title: input.title,
      description: input.description,
      code: input.code,
      professor_id: input.professorId,
    });
  }

  async updateCourse(
    id: string,
    input: { title?: string; description?: string; code?: string; professorId?: string },
    requestorId: string,
    requestorRole: UserRole
  ): Promise<CourseRow> {
    const course = await this.courseRepo.findById(id);
    if (!course) throw new NotFoundError("Course not found");

    if (requestorRole === "professor" && course.professor_id !== requestorId) {
      throw new ForbiddenError("You can only modify your own courses");
    }

    if (input.code && input.code !== course.code) {
      const existing = await this.courseRepo.findByCode(input.code);
      if (existing) throw new ConflictError("A course with this code already exists");
    }

    const updated = await this.courseRepo.update(id, {
      title: input.title,
      description: input.description,
      code: input.code,
      professor_id: input.professorId,
    });

    return updated!;
  }

  async deleteCourse(id: string, requestorId: string, requestorRole: UserRole): Promise<void> {
    const course = await this.courseRepo.findById(id);
    if (!course) throw new NotFoundError("Course not found");

    if (requestorRole === "professor" && course.professor_id !== requestorId) {
      throw new ForbiddenError("You can only delete your own courses");
    }

    await this.courseRepo.delete(id);
  }
}
