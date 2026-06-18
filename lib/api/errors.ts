import type { ApiErrorCode } from "@/lib/api/response";

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status ?? defaultStatus(code);
  }
}

function defaultStatus(code: ApiErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "VALIDATION":
      return 400;
    default:
      return 500;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autenticado.") {
    super("UNAUTHORIZED", message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No tiene permisos para esta operación.") {
    super("FORBIDDEN", message);
  }
}
