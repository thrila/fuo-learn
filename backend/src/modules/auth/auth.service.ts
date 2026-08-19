import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { config } from "../../config/index.js";
import { ConflictError, ForbiddenError, UnauthorizedError, NotFoundError } from "../../shared/errors/index.js";
import type { UserRole } from "../../shared/types/index.js";
import { UserRepository, type UserRow } from "./auth.repository.js";
import type { UpdateStudentProfileInput } from "./auth.types.js";

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: string;
  };
}

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async register(input: RegisterInput): Promise<AuthTokens> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.userRepo.create({
      id: uuidv4(),
      email: input.email,
      password_hash: passwordHash,
      first_name: input.firstName,
      last_name: input.lastName,
      role: input.role,
    });

    return this.buildAuthResponse(user);
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status === "pending") {
      throw new UnauthorizedError("Account is pending approval");
    }

    if (user.status === "disabled") {
      throw new UnauthorizedError("Account has been disabled");
    }

    return this.buildAuthResponse(user);
  }

  async approveUser(id: string): Promise<UserRow> {
    const user = await this.userRepo.updateStatus(id, "active");
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async disableUser(id: string): Promise<UserRow> {
    const user = await this.userRepo.updateStatus(id, "disabled");
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async enableUser(id: string): Promise<UserRow> {
    const user = await this.userRepo.updateStatus(id, "active");
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async listPendingUsers(): Promise<UserRow[]> {
    return this.userRepo.listPending();
  }

  async listAllUsers(): Promise<UserRow[]> {
    return this.userRepo.listAll();
  }

  async updateStudentProfile(id: string, role: UserRole, input: UpdateStudentProfileInput): Promise<UserRow> {
    if (role !== "student") {
      throw new ForbiddenError("Only students can edit their profile name");
    }

    const user = await this.userRepo.updateNames(id, input.firstName, input.lastName);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  private buildAuthResponse(user: UserRow): AuthTokens {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: "24h",
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
      },
    };
  }
}
