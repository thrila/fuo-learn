import { z } from "zod";

const envSchema = z.object({
  // TODO: Create a .env file from .env.example and fill in your PostgreSQL credentials
  // TODO: Create the database in Postgres before starting: CREATE DATABASE fuolearn;
  // TODO: Database migrations are not yet implemented — tables will need to be created manually
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/fuolearn"),
  JWT_SECRET: z.string().default("dev-secret-change-in-production-min-16-chars"),
  GEMINI_API_KEY: z.string().default(""),
  PORT: z.coerce.number().default(3000),
  UPLOAD_DIR: z.string().default("./uploads"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

function loadConfig(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const config = loadConfig();
