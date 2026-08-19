import { mkdir, writeFile, unlink, access, readFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { Logger } from "../../shared/utils/logger.js";

export interface StoredFile {
  key: string;
  url: string;
  path: string;
}

export class LocalStorage {
  private uploadDir: string;
  private logger: Logger;

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;
    this.logger = new Logger("storage");
  }

  async init(): Promise<void> {
    await mkdir(this.uploadDir, { recursive: true });
    this.logger.info("Storage directory initialized", { path: this.uploadDir });
  }

  async store(file: Express.Multer.File, subfolder: string): Promise<StoredFile> {
    const dir = join(this.uploadDir, subfolder);
    await mkdir(dir, { recursive: true });

    const ext = this.getExtension(file.originalname);
    const key = `${randomUUID()}${ext}`;
    const filePath = join(dir, key);

    await writeFile(filePath, file.buffer);

    this.logger.info("File stored", { key, originalname: file.originalname, size: file.size });

    return {
      key,
      url: `/uploads/${subfolder}/${key}`,
      path: filePath,
    };
  }

  async read(filePath: string): Promise<Buffer> {
    return readFile(filePath);
  }

  async delete(filePath: string): Promise<void> {
    try {
      await access(filePath);
      await unlink(filePath);
      this.logger.info("File deleted", { path: filePath });
    } catch {
      this.logger.warn("File not found for deletion", { path: filePath });
    }
  }

  private getExtension(filename: string): string {
    const dot = filename.lastIndexOf(".");
    return dot >= 0 ? filename.slice(dot) : "";
  }
}
