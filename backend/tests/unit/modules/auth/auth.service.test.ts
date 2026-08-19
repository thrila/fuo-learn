import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../../../../../src/modules/auth/auth.service.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../../../../../src/shared/errors/index.js";

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$fakehashedpassword"),
    compare: vi.fn(),
  },
}));

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    password_hash: "$2b$12$fakehash",
    first_name: "Test",
    last_name: "User",
    role: "student" as const,
    status: "active" as const,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function mockUserRepo() {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    listPending: vi.fn(),
    listAll: vi.fn(),
  } as any;
}

describe("AuthService", () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(() => {
    userRepo = mockUserRepo();
    service = new AuthService(userRepo);
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("creates a new user and returns tokens", async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockResolvedValue(makeUser({ status: "pending" }));

      const result = await service.register({
        email: "test@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
        role: "student",
      });

      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.role).toBe("student");
      expect(result.user.status).toBe("pending");
      expect(userRepo.create).toHaveBeenCalled();
    });

    it("throws ConflictError if email already exists", async () => {
      userRepo.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.register({
          email: "test@example.com",
          password: "password123",
          firstName: "Test",
          lastName: "User",
          role: "student",
        })
      ).rejects.toThrow(ConflictError);
    });

    it("always sets status to pending", async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockResolvedValue(makeUser({ status: "pending" }));

      const result = await service.register({
        email: "new@example.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
        role: "professor",
      });

      expect(result.user.status).toBe("pending");
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: "professor" })
      );
    });
  });

  describe("login", () => {
    it("returns tokens for valid credentials", async () => {
      const bcrypt = (await import("bcrypt")).default;
      userRepo.findByEmail.mockResolvedValue(makeUser({ status: "active" }));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
    });

    it("throws UnauthorizedError for non-existent email", async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "none@example.com", password: "pass" })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError for wrong password", async () => {
      const bcrypt = (await import("bcrypt")).default;
      userRepo.findByEmail.mockResolvedValue(makeUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({ email: "test@example.com", password: "wrong" })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError for pending accounts", async () => {
      const bcrypt = (await import("bcrypt")).default;
      userRepo.findByEmail.mockResolvedValue(makeUser({ status: "pending" }));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        service.login({ email: "test@example.com", password: "pass" })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError for disabled accounts", async () => {
      const bcrypt = (await import("bcrypt")).default;
      userRepo.findByEmail.mockResolvedValue(makeUser({ status: "disabled" }));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        service.login({ email: "test@example.com", password: "pass" })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("approveUser", () => {
    it("sets user status to active", async () => {
      userRepo.updateStatus.mockResolvedValue(makeUser({ status: "active" }));

      const result = await service.approveUser("user-1");
      expect(result.status).toBe("active");
      expect(userRepo.updateStatus).toHaveBeenCalledWith("user-1", "active");
    });

    it("throws NotFoundError if user does not exist", async () => {
      userRepo.updateStatus.mockResolvedValue(null);

      await expect(service.approveUser("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("disableUser", () => {
    it("sets user status to disabled", async () => {
      userRepo.updateStatus.mockResolvedValue(makeUser({ status: "disabled" }));

      const result = await service.disableUser("user-1");
      expect(result.status).toBe("disabled");
      expect(userRepo.updateStatus).toHaveBeenCalledWith("user-1", "disabled");
    });

    it("throws NotFoundError if user does not exist", async () => {
      userRepo.updateStatus.mockResolvedValue(null);

      await expect(service.disableUser("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("listPendingUsers", () => {
    it("returns pending users", async () => {
      const pending = [makeUser({ status: "pending" })];
      userRepo.listPending.mockResolvedValue(pending);

      const result = await service.listPendingUsers();
      expect(result).toEqual(pending);
    });
  });

  describe("listAllUsers", () => {
    it("returns all users", async () => {
      const users = [makeUser(), makeUser({ id: "user-2" })];
      userRepo.listAll.mockResolvedValue(users);

      const result = await service.listAllUsers();
      expect(result).toHaveLength(2);
    });
  });
});
