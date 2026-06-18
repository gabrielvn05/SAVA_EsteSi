import type { ApiResponseBody } from "@/lib/api/response";

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponseBody<T> | T;
  if (body && typeof body === "object" && "success" in body) {
    const wrapped = body as ApiResponseBody<T>;
    if (!wrapped.success || wrapped.data === null) {
      throw new Error(wrapped.error?.message ?? "Error en la solicitud.");
    }
    return wrapped.data;
  }
  return body as T;
}
