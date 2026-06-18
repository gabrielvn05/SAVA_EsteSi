export type LogCategory = "auth" | "api" | "db" | "security" | "audit" | "system";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  category: LogCategory;
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
};

const buffer: LogEntry[] = [];
const MAX_BUFFER = 200;

export function logEvent(
  category: LogCategory,
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
) {
  const entry: LogEntry = {
    category,
    level,
    message,
    timestamp: new Date().toISOString(),
    context
  };
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();

  const payload = JSON.stringify(entry);
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else if (process.env.NODE_ENV === "development") console.info(payload);
}

export function getRecentLogs(category?: LogCategory): readonly LogEntry[] {
  if (!category) return buffer;
  return buffer.filter((e) => e.category === category);
}
