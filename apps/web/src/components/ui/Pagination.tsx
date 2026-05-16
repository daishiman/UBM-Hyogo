"use client";

import { cn } from "../../lib/cn";

export interface PaginationProps {
  readonly current: number;
  readonly total?: number;
  readonly pageSize?: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
  readonly onNext: () => void;
  readonly onPrev: () => void;
  readonly className?: string;
}

export function Pagination({
  current,
  total,
  pageSize,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  className,
}: PaginationProps) {
  const totalPages = total !== undefined && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const showMeta = total !== undefined;

  return (
    <nav aria-label="pagination" data-component="pagination" className={cn("ui-pagination", className)}>
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="前のページ"
        className="ui-pagination__btn"
      >
        ←
      </button>
      <span className="ui-pagination__meta" aria-live="polite">
        {showMeta && totalPages !== undefined
          ? `${current} / ${totalPages}`
          : `ページ ${current}`}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="次のページ"
        className="ui-pagination__btn"
      >
        →
      </button>
    </nav>
  );
}
