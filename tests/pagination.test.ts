import { describe, expect, it } from "vitest";
import { paginateArray, parsePaginationParams, supabaseRange } from "@/lib/pagination/server-pagination";

describe("server-pagination", () => {
  it("parsea parámetros de URL", () => {
    const params = new URLSearchParams("page=2&pageSize=5");
    expect(parsePaginationParams(params)).toEqual({ page: 2, pageSize: 5 });
  });

  it("pagina arrays en memoria", () => {
    const items = [1, 2, 3, 4, 5];
    const result = paginateArray(items, { page: 2, pageSize: 2 });
    expect(result.items).toEqual([3, 4]);
    expect(result.totalPages).toBe(3);
  });

  it("calcula rango supabase", () => {
    expect(supabaseRange({ page: 1, pageSize: 10 })).toEqual({ from: 0, to: 9 });
    expect(supabaseRange({ page: 3, pageSize: 10 })).toEqual({ from: 20, to: 29 });
  });
});
