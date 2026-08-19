import type { Request, Response } from "express";
import type { AuthManager } from "./auth.manager.js";
import type { AuthenticatedRequest } from "../../shared/types/index.js";

export class AuthController {
  constructor(private authManager: AuthManager) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authManager.register({
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
    });
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authManager.login({
      email: req.body.email,
      password: req.body.password,
    });
    res.json(result);
  };

  approveUser = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const user = await this.authManager.approveUser(id);
    res.json({ user });
  };

  disableUser = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const user = await this.authManager.disableUser(id);
    res.json({ user });
  };

  listPendingUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.authManager.listPendingUsers();
    res.json({ users });
  };

  listAllUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.authManager.listAllUsers();
    res.json({ users });
  };

  updateStudentProfile = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const user = await this.authManager.updateStudentProfile(authReq.user.id, authReq.user.role, {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });
    res.json({ user });
  };
}
