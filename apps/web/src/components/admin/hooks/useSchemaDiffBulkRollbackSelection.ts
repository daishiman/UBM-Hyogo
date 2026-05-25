"use client";
// Issue #837: schema alias bulk rollback selection / modal lifecycle.
// The hook mirrors bulk resolve state while keeping rollback-specific rows separate.

import { useCallback, useState } from "react";
import type {
  SchemaAliasRollbackBulkOptions,
  SchemaAliasRollbackBulkRowResult,
  rollbackSchemaAliasBulk as rollbackSchemaAliasBulkType,
} from "../../../lib/admin/api";
import type { ResolvedAliasItem } from "../SchemaDiffPanel";

export type BulkRollbackSubmitStatus = "idle" | "pending" | "success" | "error";

export interface BulkRollbackRowState {
  aliasId: string;
  version: number;
  stableKey: string;
  aliasLabel: string;
  resolvedAt: string;
  resolvedBy: string;
  impact?: {
    affectedResponseCount: number;
    recomputeRequired: boolean;
  };
  submitStatus: BulkRollbackSubmitStatus;
  errorMessage?: string | undefined;
}

export interface BulkRollbackSummary {
  succeeded: string[];
  failed: string[];
}

export interface UseSchemaDiffBulkRollbackSelectionResult {
  selectedIds: ReadonlySet<string>;
  toggle: (aliasId: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  selectedCount: number;
  modalOpen: boolean;
  rows: BulkRollbackRowState[];
  summary: BulkRollbackSummary | null;
  isSubmitting: boolean;
  openModal: (aliases: ReadonlyArray<ResolvedAliasItem>) => void;
  closeModal: () => void;
  submit: () => Promise<BulkRollbackSummary>;
}

export interface UseSchemaDiffBulkRollbackSelectionDeps {
  rollbackSchemaAliasBulk: typeof rollbackSchemaAliasBulkType;
  onRowsSucceeded: (aliasIds: string[]) => void;
}

const toRow = (alias: ResolvedAliasItem): BulkRollbackRowState => {
  const row: BulkRollbackRowState = {
    aliasId: alias.id,
    version: alias.version,
    stableKey: alias.stableKey,
    aliasLabel: alias.aliasLabel,
    resolvedAt: alias.resolvedAt,
    resolvedBy: alias.resolvedBy,
    submitStatus: "idle",
  };
  if (alias.impact) row.impact = alias.impact;
  return row;
};

export function useSchemaDiffBulkRollbackSelection(
  deps: UseSchemaDiffBulkRollbackSelectionDeps,
): UseSchemaDiffBulkRollbackSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [rows, setRows] = useState<BulkRollbackRowState[]>([]);
  const [summary, setSummary] = useState<BulkRollbackSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = useCallback((aliasId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(aliasId)) next.delete(aliasId);
      else next.add(aliasId);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const openModal = useCallback((aliases: ReadonlyArray<ResolvedAliasItem>) => {
    setRows(aliases.map(toRow));
    setSummary(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setModalOpen(false);
    setRows([]);
    setSummary(null);
  }, [isSubmitting]);

  const submit = useCallback(async () => {
    const snapshot = rows;
    setIsSubmitting(true);
    setRows((current) =>
      current.map((row) => ({ ...row, submitStatus: "pending", errorMessage: undefined })),
    );
    let results: SchemaAliasRollbackBulkRowResult[];
    try {
      const options: SchemaAliasRollbackBulkOptions = {
        onRowResult: (rowResult) => {
          setRows((current) =>
            current.map((row) => {
              if (row.aliasId !== rowResult.aliasId) return row;
              if (rowResult.status === "success") {
                return { ...row, submitStatus: "success", errorMessage: undefined };
              }
              return {
                ...row,
                submitStatus: "error",
                errorMessage: rowResult.error?.message,
              };
            }),
          );
        },
      };
      const out = await deps.rollbackSchemaAliasBulk(
        snapshot.map((row) => ({
          aliasId: row.aliasId,
          version: row.version,
        })),
        options,
      );
      results = out.results;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results = snapshot.map((row) => ({
        aliasId: row.aliasId,
        status: "error",
        error: { kind: "network", message },
      }));
    } finally {
      setIsSubmitting(false);
    }

    const succeeded = results
      .filter((result) => result.status === "success")
      .map((result) => result.aliasId);
    const failed = results
      .filter((result) => result.status === "error")
      .map((result) => result.aliasId);
    const nextSummary = { succeeded, failed };
    setSummary(nextSummary);
    setRows((current) =>
      current
        .filter((row) => !succeeded.includes(row.aliasId))
        .map((row) => {
          const failedResult = results.find(
            (result) => result.aliasId === row.aliasId && result.status === "error",
          );
          return failedResult
            ? {
                ...row,
                submitStatus: "error",
                errorMessage: failedResult.error?.message,
              }
            : row;
        }),
    );
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const aliasId of succeeded) next.delete(aliasId);
      return next;
    });
    if (succeeded.length > 0) deps.onRowsSucceeded(succeeded);
    if (failed.length === 0) {
      setModalOpen(false);
      setRows([]);
    }
    return nextSummary;
  }, [rows, deps]);

  return {
    selectedIds,
    toggle,
    selectAll,
    clearSelection,
    selectedCount: selectedIds.size,
    modalOpen,
    rows,
    summary,
    isSubmitting,
    openModal,
    closeModal,
    submit,
  };
}
