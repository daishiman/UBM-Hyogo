"use client";

import { cn } from "../../lib/cn";

export interface PaginationProps {
  readonly current: number;
  readonly total?: number;
  readonly pageSize?: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
  readonly onNext?: () => void;
  readonly onPrev?: () => void;
  readonly nextHref?: string | undefined;
  readonly prevHref?: string | undefined;
  readonly nextLabel?: string;
  readonly prevLabel?: string;
  readonly nextAriaLabel?: string;
  readonly prevAriaLabel?: string;
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
  nextHref,
  prevHref,
  nextLabel = "次へ",
  prevLabel = "前へ",
  nextAriaLabel = "次のページ",
  prevAriaLabel = "前のページ",
  className,
}: PaginationProps) {
  const totalPages = total !== undefined && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const showMeta = total !== undefined;

  return (
    <nav aria-label="pagination" data-component="pagination" className={cn("ui-pagination", className)}>
      {prevHref && hasPrev ? (
        <a href={prevHref} aria-label={prevAriaLabel} className="ui-pagination__btn">
          {prevLabel}
        </a>
      ) : (
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label={prevAriaLabel}
          className="ui-pagination__btn"
        >
          {prevLabel}
        </button>
      )}
      <span className="ui-pagination__meta" aria-live="polite">
        {showMeta && totalPages !== undefined
          ? `${current} / ${totalPages}`
          : `ページ ${current}`}
      </span>
      {nextHref && hasNext ? (
        <a href={nextHref} aria-label={nextAriaLabel} className="ui-pagination__btn">
          {nextLabel}
        </a>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label={nextAriaLabel}
          className="ui-pagination__btn"
        >
          {nextLabel}
        </button>
      )}
    </nav>
  );
}
