// Issue #837: bulk rollback hook state machine.
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSchemaDiffBulkRollbackSelection } from "../useSchemaDiffBulkRollbackSelection";
import type { ResolvedAliasItem } from "../../SchemaDiffPanel";
import type {
  SchemaAliasRollbackBulkOptions,
  SchemaAliasRollbackBulkRow,
  rollbackSchemaAliasBulk,
} from "../../../../lib/admin/api";

const alias = (over: Partial<ResolvedAliasItem> = {}): ResolvedAliasItem => ({
  id: over.id ?? "alias-1",
  revisionId: over.revisionId ?? "rev-1",
  aliasQuestionId: over.aliasQuestionId ?? "q-1",
  stableKey: over.stableKey ?? "full_name",
  aliasLabel: over.aliasLabel ?? "Full name",
  resolvedAt: over.resolvedAt ?? "2026-05-19T00:00:00.000Z",
  resolvedBy: over.resolvedBy ?? "admin@example.com",
  version: over.version ?? 1,
  impact: over.impact ?? {
    affectedResponseCount: 2,
    recomputeRequired: false,
  },
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useSchemaDiffBulkRollbackSelection", () => {
  it("HOOK-BULK-ROLLBACK-01 selection を toggle / selectAll / clearSelection で管理する", () => {
    const rollbackSchemaAliasBulkMock = vi.fn() as unknown as typeof rollbackSchemaAliasBulk;
    const { result } = renderHook(() =>
      useSchemaDiffBulkRollbackSelection({
        rollbackSchemaAliasBulk: rollbackSchemaAliasBulkMock,
        onRowsSucceeded: vi.fn(),
      }),
    );

    act(() => result.current.toggle("alias-1"));
    expect(result.current.selectedIds.has("alias-1")).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    act(() => result.current.selectAll(["alias-1", "alias-2"]));
    expect([...result.current.selectedIds].sort()).toEqual(["alias-1", "alias-2"]);

    act(() => result.current.selectAll(["alias-1", "alias-2"]));
    expect(result.current.selectedCount).toBe(0);

    act(() => result.current.toggle("alias-3"));
    act(() => result.current.clearSelection());
    expect(result.current.selectedCount).toBe(0);
  });

  it("HOOK-BULK-ROLLBACK-02 openModal は alias を row state に変換する", () => {
    const rollbackSchemaAliasBulkMock = vi.fn() as unknown as typeof rollbackSchemaAliasBulk;
    const { result } = renderHook(() =>
      useSchemaDiffBulkRollbackSelection({
        rollbackSchemaAliasBulk: rollbackSchemaAliasBulkMock,
        onRowsSucceeded: vi.fn(),
      }),
    );

    act(() => {
      result.current.openModal([
        alias({ id: "alias-1" }),
        alias({ id: "alias-2", aliasLabel: "Email", stableKey: "email", version: 4 }),
      ]);
    });

    expect(result.current.modalOpen).toBe(true);
    expect(result.current.rows).toMatchObject([
      { aliasId: "alias-1", submitStatus: "idle" },
      { aliasId: "alias-2", aliasLabel: "Email", stableKey: "email", version: 4 },
    ]);
  });

  it("HOOK-BULK-ROLLBACK-03 submit 成功分を selection と rows から除去し成功 callback を呼ぶ", async () => {
    const rollbackSchemaAliasBulkMock = vi.fn(
      async (
        rows: ReadonlyArray<SchemaAliasRollbackBulkRow>,
        options?: SchemaAliasRollbackBulkOptions,
      ) => {
        const results = rows.map((row) => ({
          aliasId: row.aliasId,
          status: "success" as const,
          data: {
            aliasId: row.aliasId,
            rolledBackAt: "2026-05-19T01:00:00.000Z",
            relatedAuditId: null,
            newVersion: row.version + 1,
            impact: { affectedResponseCount: 1, recomputeRequired: false },
          },
        }));
        results.forEach((rowResult, index) => options?.onRowResult?.(rowResult, index));
        return { results };
      },
    ) as typeof rollbackSchemaAliasBulk;
    const onRowsSucceeded = vi.fn();
    const { result } = renderHook(() =>
      useSchemaDiffBulkRollbackSelection({
        rollbackSchemaAliasBulk: rollbackSchemaAliasBulkMock,
        onRowsSucceeded,
      }),
    );

    act(() => {
      result.current.toggle("alias-1");
      result.current.openModal([alias({ id: "alias-1" })]);
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(rollbackSchemaAliasBulkMock).toHaveBeenCalledWith(
      [{ aliasId: "alias-1", version: 1 }],
      expect.objectContaining({ onRowResult: expect.any(Function) }),
    );
    expect(result.current.summary).toEqual({ succeeded: ["alias-1"], failed: [] });
    expect(result.current.modalOpen).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(result.current.selectedIds.has("alias-1")).toBe(false);
    expect(onRowsSucceeded).toHaveBeenCalledWith(["alias-1"]);
  });

  it("HOOK-BULK-ROLLBACK-04 partial failure は失敗 row と errorMessage を残す", async () => {
    const rollbackSchemaAliasBulkMock = vi.fn(
      async (
        rows: ReadonlyArray<SchemaAliasRollbackBulkRow>,
        options?: SchemaAliasRollbackBulkOptions,
      ) => {
        const results = rows.map((row) =>
          row.aliasId === "alias-2"
            ? {
                aliasId: row.aliasId,
                status: "error" as const,
                error: {
                  kind: "version_mismatch" as const,
                  message: "race detected",
                  httpStatus: 409,
                },
              }
            : {
                aliasId: row.aliasId,
                status: "success" as const,
                data: {
                  aliasId: row.aliasId,
                  rolledBackAt: "2026-05-19T01:00:00.000Z",
                  relatedAuditId: null,
                  newVersion: row.version + 1,
                  impact: { affectedResponseCount: 1, recomputeRequired: false },
                },
              },
        );
        results.forEach((rowResult, index) => options?.onRowResult?.(rowResult, index));
        return { results };
      },
    ) as typeof rollbackSchemaAliasBulk;
    const onRowsSucceeded = vi.fn();
    const { result } = renderHook(() =>
      useSchemaDiffBulkRollbackSelection({
        rollbackSchemaAliasBulk: rollbackSchemaAliasBulkMock,
        onRowsSucceeded,
      }),
    );

    act(() => {
      result.current.toggle("alias-1");
      result.current.toggle("alias-2");
      result.current.openModal([
        alias({ id: "alias-1" }),
        alias({ id: "alias-2", aliasLabel: "Email", stableKey: "email" }),
      ]);
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.summary).toEqual({
      succeeded: ["alias-1"],
      failed: ["alias-2"],
    });
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.rows).toMatchObject([
      { aliasId: "alias-2", submitStatus: "error", errorMessage: "race detected" },
    ]);
    expect([...result.current.selectedIds]).toEqual(["alias-2"]);
    expect(onRowsSucceeded).toHaveBeenCalledWith(["alias-1"]);
  });
});
