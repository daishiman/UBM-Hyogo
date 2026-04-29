// pagination helper (04a)
// PaginationMeta を 1 箇所で算出する。limit clamp は search-query-parser で実施済み。

export interface PaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const safeTotal = Math.max(0, Math.trunc(total));
  const safeLimit = Math.max(1, Math.trunc(limit));
  const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / safeLimit);
  const safePage = Math.max(1, Math.trunc(page));
  return {
    total: safeTotal,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1 && safePage <= totalPages + 1,
  };
};
