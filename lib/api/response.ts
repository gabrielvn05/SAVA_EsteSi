import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

export type ApiResponseBody<T> = {
  success: boolean;
  data: T | null;
  error: { code: ApiErrorCode; message: string } | null;
  meta: {
    timestamp: string;
    requestId?: string;
    pagination?: { page: number; pageSize: number; totalItems: number; totalPages: number };
  };
};

export function apiSuccess<T>(
  data: T,
  init?: { status?: number; pagination?: ApiResponseBody<T>["meta"]["pagination"]; requestId?: string }
) {
  const body: ApiResponseBody<T> = {
    success: true,
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: init?.requestId,
      pagination: init?.pagination
    }
  };
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function apiError(code: ApiErrorCode, message: string, status: number, requestId?: string) {
  const body: ApiResponseBody<null> = {
    success: false,
    data: null,
    error: { code, message },
    meta: { timestamp: new Date().toISOString(), requestId }
  };
  return NextResponse.json(body, { status });
}

export function statusForCode(code: ApiErrorCode): number {
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
