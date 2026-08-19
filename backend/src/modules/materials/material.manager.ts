import type { UserRole } from "../../shared/types/index.js";
import { MaterialService } from "./material.service.js";

export class MaterialManager {
  constructor(private materialService: MaterialService) {}

  async getMaterial(id: string) {
    return this.materialService.getMaterial(id);
  }

  async listByCourse(courseId: string, requestorId: string, requestorRole: UserRole) {
    return this.materialService.listByCourse(courseId, requestorId, requestorRole);
  }

  async uploadMaterial(
    courseId: string,
    title: string,
    file: Express.Multer.File,
    uploadedBy: string,
    requestorRole: UserRole
  ) {
    return this.materialService.uploadMaterial(courseId, title, file, uploadedBy, requestorRole);
  }

  async deleteMaterial(id: string, requestorId: string, requestorRole: UserRole) {
    return this.materialService.deleteMaterial(id, requestorId, requestorRole);
  }

  async serveFile(id: string, requestorId: string, requestorRole: UserRole) {
    return this.materialService.serveFile(id, requestorId, requestorRole);
  }

  async getAccessibleMaterial(id: string, requestorId: string, requestorRole: UserRole) {
    return this.materialService.getAccessibleMaterial(id, requestorId, requestorRole);
  }
}
