import { AuthService, type RegisterInput, type LoginInput } from "./auth.service.js";
import type { UserRole } from "../../shared/types/index.js";
import type { UpdateStudentProfileInput } from "./auth.types.js";

export class AuthManager {
  constructor(private authService: AuthService) {}

  async register(input: RegisterInput) {
    return this.authService.register(input);
  }

  async login(input: LoginInput) {
    return this.authService.login(input);
  }

  async approveUser(id: string) {
    return this.authService.approveUser(id);
  }

  async disableUser(id: string) {
    return this.authService.disableUser(id);
  }

  async listPendingUsers() {
    return this.authService.listPendingUsers();
  }

  async listAllUsers() {
    return this.authService.listAllUsers();
  }

  async updateStudentProfile(id: string, role: UserRole, input: UpdateStudentProfileInput) {
    return this.authService.updateStudentProfile(id, role, input);
  }
}
