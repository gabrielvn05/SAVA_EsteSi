import { describe, expect, it } from "vitest";
import { statusForCode } from "@/lib/api/response";
import { ValidationError, UnauthorizedError } from "@/lib/api/errors";

describe("API response", () => {
  it("mapea códigos HTTP", () => {
    expect(statusForCode("UNAUTHORIZED")).toBe(401);
    expect(statusForCode("VALIDATION")).toBe(400);
    expect(statusForCode("INTERNAL")).toBe(500);
  });

  it("crea errores tipados", () => {
    const err = new ValidationError("Campo requerido");
    expect(err.code).toBe("VALIDATION");
    expect(err.status).toBe(400);

    const auth = new UnauthorizedError();
    expect(auth.status).toBe(401);
  });
});
