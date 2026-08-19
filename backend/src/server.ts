import "dotenv/config";
import { App } from "./app.js";
import { logger } from "./shared/utils/logger.js";

const app = new App();

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down...");
  await app.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down...");
  await app.shutdown();
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason: String(reason) });
});

app.start().catch((err) => {
  logger.error("Failed to start server", { error: err.message, stack: err.stack });
  process.exit(1);
});
