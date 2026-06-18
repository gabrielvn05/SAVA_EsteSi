import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { logEvent } from "@/lib/logging/logger";

type RouteContext = { params?: Record<string, string> };

export function withApiHandler(
  handler: (req: Request, ctx: RouteContext) => Promise<NextResponse>
) {
  return async (req: Request, ctx: RouteContext) => {
    const requestId = crypto.randomUUID();
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof AppError) {
        logEvent("api", "warn", err.message, { requestId, code: err.code, path: req.url });
        return apiError(err.code, err.message, err.status, requestId);
      }
      const message = err instanceof Error ? err.message : "Error interno del servidor.";
      logEvent("api", "error", message, { requestId, path: req.url });
      return apiError("INTERNAL", "Error interno del servidor.", 500, requestId);
    }
  };
}
