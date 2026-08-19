import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../shared/types/index.js";
import type { CourseManager } from "./course.manager.js";

export class CourseController {
  constructor(private courseManager: CourseManager) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const course = await this.courseManager.getCourse(id);
    res.json({ course });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const filters: { professorId?: string } = {};

    if (authReq.user.role === "professor") {
      filters.professorId = authReq.user.id;
    }

    const courses = await this.courseManager.listCourses(
      Object.keys(filters).length > 0 ? filters : undefined
    );
    res.json({ courses });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const course = await this.courseManager.createCourse({
      title: req.body.title,
      description: req.body.description,
      code: req.body.code,
      professorId: req.body.professorId,
    });
    res.status(201).json({ course });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);
    const course = await this.courseManager.updateCourse(
      id,
      {
        title: req.body.title,
        description: req.body.description,
        code: req.body.code,
        professorId: req.body.professorId,
      },
      authReq.user.id,
      authReq.user.role
    );
    res.json({ course });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);
    await this.courseManager.deleteCourse(id, authReq.user.id, authReq.user.role);
    res.status(204).send();
  };
}
