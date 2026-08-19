import type { UserRole } from "../../shared/types/index.js";
import { CourseService } from "./course.service.js";

export class CourseManager {
  constructor(private courseService: CourseService) {}

  async getCourse(id: string) {
    return this.courseService.getCourse(id);
  }

  async listCourses(filters?: { professorId?: string }) {
    return this.courseService.listCourses(filters);
  }

  async createCourse(input: {
    title: string;
    description?: string;
    code: string;
    professorId: string;
  }) {
    return this.courseService.createCourse(input);
  }

  async updateCourse(
    id: string,
    input: { title?: string; description?: string; code?: string; professorId?: string },
    requestorId: string,
    requestorRole: UserRole
  ) {
    return this.courseService.updateCourse(id, input, requestorId, requestorRole);
  }

  async deleteCourse(id: string, requestorId: string, requestorRole: UserRole) {
    return this.courseService.deleteCourse(id, requestorId, requestorRole);
  }
}
