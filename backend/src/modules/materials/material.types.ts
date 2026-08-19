import { z } from "zod";

export const uploadMaterialSchema = z.object({
  title: z.string().min(1).max(255),
});

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
