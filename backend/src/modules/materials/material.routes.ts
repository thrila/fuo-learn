import { Router } from "express";
import multer from "multer";
import type { MaterialController } from "./material.controller.js";
import { AuthenticateMiddleware } from "../../middleware/authenticate.js";
import { AuthorizeMiddleware } from "../../middleware/authorize.js";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "./material.types.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ALLOWED_MIME_TYPES[number])) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and PPT/PPTX files are allowed"));
    }
  },
});

export class MaterialRoutes {
  public router: Router;

  private authenticate: AuthenticateMiddleware;

  constructor(
    private controller: MaterialController
  ) {
    this.router = Router();
    this.authenticate = new AuthenticateMiddleware();
    this.register();
  }

  private register(): void {
    const { authenticate, controller } = this;

    // List materials for a course (any authenticated user)
    this.router.get(
      "/courses/:id/materials",
      authenticate.handle,
      controller.listByCourse
    );

    // Upload material (professor only)
    this.router.post(
      "/courses/:id/materials",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      upload.single("file"),
      controller.upload
    );

    // Material metadata, including the access check used by the viewer.
    this.router.get(
      "/materials/:id",
      authenticate.handle,
      controller.getById
    );

    // Serve/download material file (authenticated, enrollment-checked)
    this.router.get(
      "/materials/:id/file",
      authenticate.handle,
      controller.serve
    );

    // Delete material (professor/admin)
    this.router.delete(
      "/materials/:id",
      authenticate.handle,
      new AuthorizeMiddleware("admin", "professor").handle,
      controller.delete
    );
  }
}
