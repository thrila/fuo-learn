import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../shared/types/index.js";
import type { MaterialManager } from "./material.manager.js";

export class MaterialController {
  constructor(private materialManager: MaterialManager) {}

  listByCourse = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const courseId = String(req.params.id);
    const materials = await this.materialManager.listByCourse(
      courseId,
      authReq.user.id,
      authReq.user.role
    );
    res.json({ materials });
  };

  upload = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const courseId = String(req.params.id);

    if (!req.file) {
      res.status(400).json({ error: { message: "No file uploaded", code: "BAD_REQUEST" } });
      return;
    }

    const material = await this.materialManager.uploadMaterial(
      courseId,
      req.body.title || req.file.originalname,
      req.file,
      authReq.user.id,
      authReq.user.role
    );
    res.status(201).json({ material });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);
    const material = await this.materialManager.getAccessibleMaterial(id, authReq.user.id, authReq.user.role);
    res.json({ material });
  };

  serve = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);
    const file = await this.materialManager.serveFile(id, authReq.user.id, authReq.user.role);
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(file.buffer);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);
    await this.materialManager.deleteMaterial(id, authReq.user.id, authReq.user.role);
    res.status(204).send();
  };
}
