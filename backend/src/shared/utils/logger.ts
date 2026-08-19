export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  logger: string;
  message: string;
  [key: string]: unknown;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_LABEL: Record<LogLevel, string> = {
  debug: "DBG ",
  info: "INFO",
  warn: "WARN",
  error: "ERR ",
};

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

export type LoggerFormat = "pretty" | "json";

export class Logger {
  private minLevel: LogLevel;
  private format: LoggerFormat;

  constructor(
    private context: string,
    options?: { level?: LogLevel; format?: LoggerFormat }
  ) {
    this.minLevel = options?.level ?? "info";
    this.format = options?.format ?? (process.env.NODE_ENV === "production" ? "json" : "pretty");
  }

  child(context: string): Logger {
    return new Logger(`${this.context}.${context}`, {
      level: this.minLevel,
      format: this.format,
    });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log("error", message, meta);
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.minLevel]) {
      return;
    }

    if (this.format === "json") {
      this.writeJson(level, message, meta);
    } else {
      this.writePretty(level, message, meta);
    }
  }

  private writeJson(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      logger: this.context,
      message,
      ...meta,
    };

    const stream = level === "error" ? process.stderr : process.stdout;
    stream.write(JSON.stringify(entry) + "\n");
  }

  private writePretty(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    const color = LEVEL_COLOR[level];
    const label = LEVEL_LABEL[level];

    const tag = `${DIM}${time}${RESET} ${color}${BOLD}${label}${RESET} ${DIM}${this.context}${RESET}`;
    const line = `${tag}  ${message}`;

    const stream = level === "error" ? process.stderr : process.stdout;
    stream.write(line + "\n");

    if (meta && Object.keys(meta).length > 0) {
      const pretty = JSON.stringify(meta, null, 2)
        .split("\n")
        .map((l, i) => i === 0 ? l : `${" ".repeat(16)}${l}`)
        .join("\n");
      stream.write(`${" ".repeat(16)}${DIM}${pretty}${RESET}\n`);
    }
  }
}

export const logger = new Logger("app");
