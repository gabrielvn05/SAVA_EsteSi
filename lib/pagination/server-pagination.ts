export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function parsePaginationParams(
  searchParams: URLSearchParams | Record<string, string | undefined>,
  defaultPageSize = 10
): PaginationParams {
  const get = (key: string) =>
    searchParams instanceof URLSearchParams ? searchParams.get(key) : searchParams[key];

  const page = Math.max(1, Number(get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(get("pageSize") ?? String(defaultPageSize)) || defaultPageSize));
  return { page, pageSize };
}

export function paginateArray<T>(items: T[], { page, pageSize }: PaginationParams): PaginatedResult<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalItems,
    totalPages
  };
}

export function supabaseRange({ page, pageSize }: PaginationParams) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}
