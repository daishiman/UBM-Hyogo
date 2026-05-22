"use client";
// Issue #776: schema alias bulk resolve — selection state / modal lifecycle / submit を内包する hook。
// 既存の single inline edit 経路 (SchemaDiffPanel) と並走させるため、bulk 専用の sub-state として分離している。

import { useCallback, useMemo, useState } from "react";
import type {
  SchemaAliasBulkOptions,
  SchemaAliasBulkRowResult,
  postSchemaAliasBulk as postSchemaAliasBulkType,
} from "../../../lib/admin/api";
import { normalizeStableKey } from "../schemaAliasValidation";

export type BulkSubmitStatus = "idle" | "pending" | "success" | "retryable" | "error";

export interface BulkRowState {
  diffId: string;
  questionId: string;
  category: "unresolved" | "changed";
  suggestedStableKey: string | null;
  stableKey: string;
  submitStatus: BulkSubmitStatus;
  errorMessage?: string | undefined;
}

export interface UseSchemaDiffBulkSelectionResult {
  selectedIds: ReadonlySet<string>;
  toggle: (diffId: string) => void;
  selectAllInCategory: (category: "unresolved" | "changed", ids: string[]) => void;
  clearSelection: () => void;
  breakdown: { unresolved: number; changed: number; total: number };
  modalOpen: boolean;
  openModal: (rows: BulkRowState[]) => void;
  closeModal: () => void;
  rows: BulkRowState[];
  updateRowStableKey: (diffId: string, stableKey: string) => void;
  applySuggestion: (diffId: string) => void;
  applyAllSuggestions: () => void;
  submit: () => Promise<{
    succeeded: string[];
    retryable: string[];
    failed: string[];
  }>;
  isSubmitting: boolean;
}

export interface UseSchemaDiffBulkSelectionDeps {
  postSchemaAliasBulk: typeof postSchemaAliasBulkType;
  onAllSucceeded: () => void;
  categoryOf?: (diffId: string) => "unresolved" | "changed" | null;
}

export function useSchemaDiffBulkSelection(
  deps: UseSchemaDiffBulkSelectionDeps,
): UseSchemaDiffBulkSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [rows, setRows] = useState<BulkRowState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = useCallback((diffId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(diffId)) next.delete(diffId);
      else next.add(diffId);
      return next;
    });
  }, []);

  const selectAllInCategory = useCallback(
    (_category: "unresolved" | "changed", ids: string[]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.add(id);
        return next;
      });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const breakdown = useMemo(() => {
    let unresolved = 0;
    let changed = 0;
    if (deps.categoryOf) {
      for (const id of selectedIds) {
        const c = deps.categoryOf(id);
        if (c === "unresolved") unresolved++;
        else if (c === "changed") changed++;
      }
    }
    return { unresolved, changed, total: selectedIds.size };
  }, [selectedIds, deps]);

  const openModal = useCallback((initRows: BulkRowState[]) => {
    setRows(
      initRows.map((r) => ({
        ...r,
        submitStatus: "idle",
        errorMessage: undefined,
      })),
    );
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setModalOpen(false);
    setRows([]);
  }, [isSubmitting]);

  const updateRowStableKey = useCallback((diffId: string, stableKey: string) => {
    setRows((rs) => rs.map((r) => (r.diffId === diffId ? { ...r, stableKey } : r)));
  }, []);

  const applySuggestion = useCallback((diffId: string) => {
    setRows((rs) =>
      rs.map((r) =>
        r.diffId === diffId && r.suggestedStableKey
          ? { ...r, stableKey: r.suggestedStableKey }
          : r,
      ),
    );
  }, []);

  const applyAllSuggestions = useCallback(() => {
    setRows((rs) =>
      rs.map((r) =>
        r.suggestedStableKey ? { ...r, stableKey: r.suggestedStableKey } : r,
      ),
    );
  }, []);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    // snapshot of rows at submit time
    const snapshot = rows;
    setRows((rs) =>
      rs.map((r) => ({ ...r, submitStatus: "pending", errorMessage: undefined })),
    );
    const payload = snapshot.map((r) => ({
      diffId: r.diffId,
      questionId: r.questionId,
      stableKey: normalizeStableKey(r.stableKey),
    }));
    let results: SchemaAliasBulkRowResult[] = [];
    try {
      const options: SchemaAliasBulkOptions = {
        onRowResult: (rowResult) => {
          setRows((rs) =>
            rs.map((r) => {
              if (r.diffId !== rowResult.diffId) return r;
              if (rowResult.status === "success") {
                return { ...r, submitStatus: "success", errorMessage: undefined };
              }
              if (rowResult.status === "retryable") {
                return {
                  ...r,
                  submitStatus: "retryable",
                  errorMessage: "Back-fill 再試行可能（続きから処理できます）",
                };
              }
              return {
                ...r,
                submitStatus: "error",
                errorMessage: rowResult.error?.message,
              };
            }),
          );
        },
      };
      const out = await deps.postSchemaAliasBulk(payload, options);
      results = out.results;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results = snapshot.map((r) => ({
        diffId: r.diffId,
        questionId: r.questionId,
        status: "error" as const,
        error: { kind: "network" as const, message },
      }));
    } finally {
      setIsSubmitting(false);
    }
    const succeeded = results
      .filter((r) => r.status === "success")
      .map((r) => r.diffId);
    const retryable = results
      .filter((r) => r.status === "retryable")
      .map((r) => r.diffId);
    const failed = results.filter((r) => r.status === "error");

    setRows((rs) =>
      rs
        .filter((r) => !succeeded.includes(r.diffId))
        .map((r) => {
          const f = failed.find((x) => x.diffId === r.diffId);
          if (f) {
            return {
              ...r,
              submitStatus: "error",
              errorMessage: f.error?.message,
            };
          }
          if (retryable.includes(r.diffId)) {
            return {
              ...r,
              submitStatus: "retryable",
              errorMessage:
                "Back-fill 再試行可能（続きから処理できます）",
            };
          }
          return r;
        }),
    );
    setSelectedIds((s) => {
      const next = new Set(s);
      for (const id of succeeded) next.delete(id);
      return next;
    });

    const allSucceeded = failed.length === 0 && retryable.length === 0;
    if (allSucceeded) {
      setModalOpen(false);
      setRows([]);
      deps.onAllSucceeded();
    }
    return {
      succeeded,
      retryable,
      failed: failed.map((f) => f.diffId),
    };
  }, [rows, deps]);

  return {
    selectedIds,
    toggle,
    selectAllInCategory,
    clearSelection,
    breakdown,
    modalOpen,
    openModal,
    closeModal,
    rows,
    updateRowStableKey,
    applySuggestion,
    applyAllSuggestions,
    submit,
    isSubmitting,
  };
}
