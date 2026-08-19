import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Database } from "../../infrastructure/database/index.js";
import { Logger } from "../../shared/utils/logger.js";

export class AdminSeed {
  private logger: Logger;

  constructor(private db: Database) {
    this.logger = new Logger("admin-seed");
  }

  async run(): Promise<void> {
    const credentials = this.loadCredentials();
    if (!credentials) return;

    const { email, password } = credentials;

    const existing = await this.db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      this.logger.info("Admin user already exists", { email });
      return;
    }

    const bcrypt = await import("bcrypt");
    const { v4: uuidv4 } = await import("uuid");

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);

    await this.db.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'System', 'Administrator', 'admin', 'active', NOW(), NOW())`,
      [id, email, passwordHash]
    );

    this.logger.info("Admin user created", { email });
  }

  private loadCredentials(): { email: string; password: string } | null {
    const passwordFile = join(process.cwd(), "password.txt");
    if (!existsSync(passwordFile)) {
      this.logger.warn("password.txt not found — admin seed skipped");
      return null;
    }

    const content = readFileSync(passwordFile, "utf-8");
    const emailMatch = content.match(/^Username:\s*(.+)$/m);
    const passwordMatch = content.match(/^Password:\s*(.+)$/m);

    if (!emailMatch?.[1] || !passwordMatch?.[1]) {
      this.logger.error("password.txt is malformed — expected 'Username:' and 'Password:' lines");
      return null;
    }

    return {
      email: emailMatch[1].trim(),
      password: passwordMatch[1].trim(),
    };
  }
}
