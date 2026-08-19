import pg from "pg";
import { Logger } from "../../shared/utils/logger.js";

export class Database {
  private pool: pg.Pool;
  private logger: Logger;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
    this.logger = new Logger("database");
  }

  async query(text: string, params?: unknown[]): Promise<pg.QueryResult> {
    const start = Date.now();
    const result = await this.pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 500) {
      this.logger.warn("Slow query detected", { duration, rows: result.rowCount });
    }

    this.logger.debug("Query executed", {
      duration,
      rows: result.rowCount,
      text: text.slice(0, 120),
    });

    return result;
  }

  async getClient(): Promise<pg.PoolClient> {
    return this.pool.connect();
  }

  async testConnection(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("SELECT 1");
      this.logger.info("Database connection verified");
    } finally {
      client.release();
    }
  }

  async shutdown(): Promise<void> {
    await this.pool.end();
    this.logger.info("Connection pool closed");
  }
}
