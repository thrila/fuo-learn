import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiReference } from "@scalar/express-api-reference";

import { config } from "./config/index.js";
import { openApiSpec } from "./config/openapi.js";
import { Database } from "./infrastructure/database/index.js";
import { LocalStorage } from "./infrastructure/storage/index.js";
import { ErrorHandlerMiddleware } from "./middleware/error-handler.js";
import { RequestLogger } from "./middleware/request-logger.js";
import { UserRepository } from "./modules/auth/auth.repository.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthManager } from "./modules/auth/auth.manager.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthRoutes } from "./modules/auth/auth.routes.js";
import { AdminSeed } from "./modules/auth/admin-seed.js";
import { CourseRepository } from "./modules/courses/course.repository.js";
import { CourseService } from "./modules/courses/course.service.js";
import { CourseManager } from "./modules/courses/course.manager.js";
import { CourseController } from "./modules/courses/course.controller.js";
import { CourseRoutes } from "./modules/courses/course.routes.js";
import { EnrollmentRepository } from "./modules/enrollments/enrollment.repository.js";
import { EnrollmentService } from "./modules/enrollments/enrollment.service.js";
import { EnrollmentManager } from "./modules/enrollments/enrollment.manager.js";
import { EnrollmentController } from "./modules/enrollments/enrollment.controller.js";
import { EnrollmentRoutes } from "./modules/enrollments/enrollment.routes.js";
import { MaterialRepository } from "./modules/materials/material.repository.js";
import { MaterialService } from "./modules/materials/material.service.js";
import { MaterialManager } from "./modules/materials/material.manager.js";
import { MaterialController } from "./modules/materials/material.controller.js";
import { MaterialRoutes } from "./modules/materials/material.routes.js";
import { ContentExtractionService } from "./modules/materials/material-extraction.service.js";
import { GeminiFactory } from "./infrastructure/gemini/index.js";
import { QuizGenerationService } from "./modules/quizzes/quiz-generation.service.js";
import { QuizGenerationManager } from "./modules/quizzes/quiz-generation.manager.js";
import { QuizGenerationController } from "./modules/quizzes/quiz-generation.controller.js";
import { QuizGenerationRoutes } from "./modules/quizzes/quiz-generation.routes.js";
import { QuizRepository } from "./modules/quizzes/quiz.repository.js";
import { QuizService } from "./modules/quizzes/quiz.service.js";
import { QuizManager } from "./modules/quizzes/quiz.manager.js";
import { QuizController } from "./modules/quizzes/quiz.controller.js";
import { QuizRoutes } from "./modules/quizzes/quiz.routes.js";
import { QuizAttemptRepository } from "./modules/quiz-attempts/quiz-attempt.repository.js";
import { QuizAttemptService } from "./modules/quiz-attempts/quiz-attempt.service.js";
import { QuizAttemptManager } from "./modules/quiz-attempts/quiz-attempt.manager.js";
import { QuizAttemptController } from "./modules/quiz-attempts/quiz-attempt.controller.js";
import { QuizAttemptRoutes } from "./modules/quiz-attempts/quiz-attempt.routes.js";
import { Logger } from "./shared/utils/logger.js";

export class App {
  public express: express.Express;
  private database: Database | null = null;
  private storage!: LocalStorage;
  private errorHandler: ErrorHandlerMiddleware;
  private logger: Logger;

  constructor() {
    this.express = express();
    this.logger = new Logger("app");
    this.errorHandler = new ErrorHandlerMiddleware();

    this.configureMiddleware();
    this.configureDocsRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.express.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
          connectSrc: ["'self'"],
        },
      },
    }));
    this.express.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    }));
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(new RequestLogger().handle);
  }

  private configureDocsRoutes(): void {
    this.express.get("/health", (_req, res) => {
      res.json({ status: "ok", database: this.database ? "connected" : "not connected" });
    });

    this.express.get("/api/docs", apiReference({
      spec: { content: openApiSpec },
    }));

    this.express.get("/api/openapi.json", (_req, res) => {
      res.json(openApiSpec);
    });
  }

  private configureModuleRoutes(): void {
    if (!this.database) {
      this.logger.warn("Database not connected — API routes disabled");
      this.express.use("/api", (_req, res) => {
        res.status(503).json({
          error: {
            message: "Database not connected — API routes unavailable",
            code: "SERVICE_UNAVAILABLE",
          },
        });
      });
      return;
    }

    // Shared repositories
    const userRepo = new UserRepository(this.database);
    const courseRepo = new CourseRepository(this.database);

    // Auth
    const authService = new AuthService(userRepo);
    const authManager = new AuthManager(authService);
    const authController = new AuthController(authManager);
    this.express.use("/api/auth", new AuthRoutes(authController).router);

    // Courses
    const courseService = new CourseService(courseRepo);
    const courseManager = new CourseManager(courseService);
    const courseController = new CourseController(courseManager);
    this.express.use("/api/courses", new CourseRoutes(courseController).router);

    // Enrollments
    const enrollmentRepo = new EnrollmentRepository(this.database);
    const enrollmentService = new EnrollmentService(enrollmentRepo, courseRepo);
    const enrollmentManager = new EnrollmentManager(enrollmentService);
    const enrollmentController = new EnrollmentController(enrollmentManager);
    this.express.use("/api", new EnrollmentRoutes(enrollmentController).router);

    // Materials
    const materialRepo = new MaterialRepository(this.database);
    const materialService = new MaterialService(materialRepo, courseRepo, enrollmentRepo, this.storage);
    const materialManager = new MaterialManager(materialService);
    const materialController = new MaterialController(materialManager);
    this.express.use("/api", new MaterialRoutes(materialController).router);

    // Quizzes
    const quizRepo = new QuizRepository(this.database);
    const quizService = new QuizService(quizRepo, courseRepo);
    const quizManager = new QuizManager(quizService);
    const quizController = new QuizController(quizManager);
    this.express.use("/api", new QuizRoutes(quizController).router);

    // Quiz Attempts
    const attemptRepo = new QuizAttemptRepository(this.database);
    const attemptService = new QuizAttemptService(attemptRepo, quizRepo, courseRepo, enrollmentRepo);
    const attemptManager = new QuizAttemptManager(attemptService);
    const attemptController = new QuizAttemptController(attemptManager);
    this.express.use("/api", new QuizAttemptRoutes(attemptController).router);

    // Quiz Generation (Gemini AI)
    const geminiClient = config.GEMINI_API_KEY
      ? GeminiFactory.getOrCreate(config.GEMINI_API_KEY)
      : null;
    if (geminiClient) {
      const extractionService = new ContentExtractionService();
      const generationService = new QuizGenerationService(geminiClient);
      const generationManager = new QuizGenerationManager(generationService, extractionService, materialRepo, quizRepo, this.storage);
      const generationController = new QuizGenerationController(generationManager);
      this.express.use("/api", new QuizGenerationRoutes(generationController).router);
      this.logger.info("Quiz generation enabled (Gemini API key configured)");
    } else {
      this.logger.warn("Quiz generation disabled — no GEMINI_API_KEY configured");
    }

    this.express.use((_req, res) => {
      res.status(404).json({
        error: { message: "Not found", code: "NOT_FOUND" },
      });
    });
  }

  private configureErrorHandling(): void {
    this.express.use(this.errorHandler.handle);
  }

  async start(): Promise<void> {
    try {
      this.database = new Database(config.DATABASE_URL);
      await this.database.testConnection();
      this.logger.info("Database connection established");

      this.storage = new LocalStorage(config.UPLOAD_DIR);
      await this.storage.init();

      const seed = new AdminSeed(this.database);
      await seed.run();
    } catch (err) {
      this.logger.warn("Could not connect to database — starting in docs-only mode", {
        error: err instanceof Error ? err.message : String(err),
      });
      this.database = null;
    }

    this.configureModuleRoutes();

    this.express.listen(config.PORT, () => {
      this.logger.info(`Server running on port ${config.PORT}`, { port: config.PORT });
      this.logger.info(`API docs at http://localhost:${config.PORT}/api/docs`);
    });
  }

  async shutdown(): Promise<void> {
    if (this.database) {
      await this.database.shutdown();
      this.logger.info("Database connection closed");
    }
    this.logger.info("Server shut down");
  }
}
