"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { cn } from "../../../../lib/cn";
import { AdminEmptyState } from "./AdminEmptyState";

export interface AdminTableColumn<Row> {
  key: string;
  header: string;
  render?: (row: Row) => ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  accessor?: (row: Row) => string | number | null | undefined;
}

export interface AdminTableProps<Row> {
  columns: AdminTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  onRowSelect?: (row: Row) => void;
  selectedKey?: string | null;
  stickyHeader?: boolean;
  emptyState?: ReactNode;
  defaultSort?: { key: string; order: "asc" | "desc" };
  caption?: string;
  className?: string;
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

export function AdminTable<Row>({
  columns,
  rows,
  getRowKey,
  onRowSelect,
  selectedKey,
  stickyHeader = true,
  emptyState,
  defaultSort,
  caption,
  className,
}: AdminTableProps<Row>) {
  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" } | null>(
    defaultSort ?? null,
  );

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col || !col.sortable) return rows;
    const accessor = col.accessor ?? ((row: Row) => (row as Record<string, unknown>)[sort.key] as string | number | null | undefined);
    const sorted = [...rows].sort((a, b) => compare(accessor(a), accessor(b)));
    return sort.order === "desc" ? sorted.reverse() : sorted;
  }, [rows, sort, columns]);

  if (rows.length === 0) {
    return (
      <>
        {emptyState ?? (
          <AdminEmptyState title="対象データがありません" />
        )}
      </>
    );
  }

  const onHeaderClick = (col: AdminTableColumn<Row>) => {
    if (!col.sortable) return;
    setSort((cur) => {
      if (!cur || cur.key !== col.key) return { key: col.key, order: "asc" };
      return { key: col.key, order: cur.order === "asc" ? "desc" : "asc" };
    });
  };

  return (
    <div
      className={cn("admin-table-wrapper", className)}
      data-sticky-header={stickyHeader || undefined}
    >
      <table className="admin-table" data-testid="admin-table">
        {caption ? <caption className="admin-table__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  data-align={col.align ?? "left"}
                  data-sortable={col.sortable || undefined}
                  aria-sort={
                    isSorted ? (sort.order === "asc" ? "ascending" : "descending") : undefined
                  }
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onHeaderClick(col)}
                      className="admin-table__sort-button"
                    >
                      {col.header}
                      {isSorted ? (
                        <span aria-hidden="true">
                          {sort.order === "asc" ? " ▲" : " ▼"}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const key = getRowKey(row);
            const isSelected = selectedKey === key;
            return (
              <tr
                key={key}
                data-selected={isSelected || undefined}
                onClick={onRowSelect ? () => onRowSelect(row) : undefined}
                className={cn(
                  onRowSelect && "admin-table__row--interactive",
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} data-align={col.align ?? "left"}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
