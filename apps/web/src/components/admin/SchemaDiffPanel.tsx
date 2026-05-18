"use client";
// 06c: SchemaDiffPanel — added/changed/removed/unresolved の 4 ペイン + alias 割当 form
// 不変条件 #14: 本コンポーネントは /admin/schema/page.tsx 以外で import しない
// UT-07B-FU-02: HTTP 202 retryable continuation を「失敗」と区別して表示する。
//   API contract（/schema/aliases の 200/202 分岐）は変更せず、表示分岐のみで運用者に伝える。
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  postSchemaAlias,
  postSchemaAliasBulk,
  isSchemaAliasRetryableContinuation,
} from "../../lib/admin/api";
import {
  useSchemaDiffBulkSelection,
  type BulkRowState,
} from "./hooks/useSchemaDiffBulkSelection";
import { SchemaDiffBulkResolveModal } from "./SchemaDiffBulkResolveModal";
import {
  isStableKeyValid,
  normalizeStableKey,
  STABLE_KEY_VALIDATION_MESSAGE,
} from "./schemaAliasValidation";

const BULK_LIMIT = 50;

export type DiffType = "added" | "changed" | "removed" | "unresolved";

export interface SchemaDiffItem {
  diffId: string;
  revisionId: string;
  type: DiffType;
  questionId: string | null;
  stableKey: string | null;
  label: string;
  suggestedStableKey: string | null;
  status: "queued" | "resolved";
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface SchemaDiffListView {
  total: number;
  items: SchemaDiffItem[];
}

const TYPES: DiffType[] = ["added", "changed", "removed", "unresolved"];
const TYPE_LABELS: Record<DiffType, string> = {
  added: "追加",
  changed: "変更",
  removed: "削除",
  unresolved: "未解決",
};
const STATUS_LABELS: Record<SchemaDiffItem["status"], string> = {
  queued: "未解決",
  resolved: "解決済み",
};

const VALIDATION_FEEDBACK_ID = "schema-alias-validation-feedback";

type FeedbackKind =
  | "success"
  | "retryable"
  | "validation_error"
  | "conflict_error"
  | "error";

interface Feedback {
  kind: FeedbackKind;
  label: string;
  detail?: string;
}

export function SchemaDiffPanel({ initial }: { readonly initial: SchemaDiffListView }) {
  const router = useRouter();
  const grouped = useMemo(() => {
    const acc: Record<DiffType, SchemaDiffItem[]> = {
      added: [],
      changed: [],
      removed: [],
      unresolved: [],
    };
    for (const it of initial.items) acc[it.type].push(it);
    return acc;
  }, [initial.items]);

  const [active, setActive] = useState<SchemaDiffItem | null>(null);
  const [stableKey, setStableKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const stableKeyInputRef = useRef<HTMLInputElement>(null);

  // Issue #776: bulk resolve mode
  const [bulkMode, setBulkMode] = useState(false);

  const diffById = useMemo(() => {
    const m = new Map<string, SchemaDiffItem>();
    for (const it of initial.items) m.set(it.diffId, it);
    return m;
  }, [initial.items]);

  const bulk = useSchemaDiffBulkSelection({
    postSchemaAliasBulk,
    onAllSucceeded: () => router.refresh(),
    categoryOf: (diffId) => {
      const it = diffById.get(diffId);
      if (!it) return null;
      return it.type === "unresolved" || it.type === "changed" ? it.type : null;
    },
  });

  const onSelect = (it: SchemaDiffItem) => {
    setActive(it);
    setStableKey(it.suggestedStableKey ?? it.stableKey ?? "");
    setFeedback(null);
  };

  const trimmedKey = stableKey.trim();
  const isValidStableKey = isStableKeyValid(stableKey);
  const describedBy =
    feedback?.kind === "validation_error"
      ? `schema-alias-stableKey-hint ${VALIDATION_FEEDBACK_ID}`
      : "schema-alias-stableKey-hint";

  useEffect(() => {
    if (active?.questionId) {
      stableKeyInputRef.current?.focus();
    }
  }, [active]);

  const getPayload = (r: { data?: unknown }) =>
    typeof r.data === "object" && r.data !== null ? r.data : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !active.questionId || !trimmedKey) return;
    if (!isValidStableKey) {
      setFeedback({
        kind: "validation_error",
        label: STABLE_KEY_VALIDATION_MESSAGE,
      });
      return;
    }
    setBusy(true);
    const r = await postSchemaAlias({
      diffId: active.diffId,
      questionId: active.questionId,
      stableKey: trimmedKey,
    });
    setBusy(false);

    if (isSchemaAliasRetryableContinuation(r)) {
      setFeedback({
        kind: "retryable",
        label: "Back-fill 再試行可能（続きから処理できます）",
        detail: "もう一度「割当」を押すと続きから処理されます。",
      });
      return;
    }

    if (!r.ok) {
      const payload = getPayload(r);
      if (r.status === 422) {
        const code =
          payload && "code" in payload ? String((payload as { code: unknown }).code) : null;
        const existingQuestionIds =
          payload && "existingQuestionIds" in payload &&
          Array.isArray((payload as { existingQuestionIds: unknown }).existingQuestionIds)
            ? (payload as { existingQuestionIds: string[] }).existingQuestionIds
            : [];
        setFeedback({
          kind: "validation_error",
          label:
            code === "stable_key_collision"
              ? `入力内容に誤りがあります: stableKey は既存 questionId と衝突しています（${existingQuestionIds.join(", ")}）`
              : `入力内容に誤りがあります: ${r.error}`,
        });
      } else if (r.status === 409) {
        const existingStableKey =
          payload && "existingStableKey" in payload
            ? String((payload as { existingStableKey: unknown }).existingStableKey)
            : null;
        setFeedback({
          kind: "conflict_error",
          label: existingStableKey
            ? `他の操作と競合しました: ${r.error}（既存 stableKey: ${existingStableKey}）`
            : `他の操作と競合しました: ${r.error}`,
        });
      } else {
        setFeedback({ kind: "error", label: `失敗: ${r.error}` });
      }
      return;
    }

    setFeedback({ kind: "success", label: "alias を割当てました" });
    setActive(null);
    router.refresh();
  };

  const bulkEligible = (t: DiffType) => t === "unresolved" || t === "changed";

  const onConfirmBulk = () => {
    const ids = Array.from(bulk.selectedIds);
    if (ids.length === 0) return;
    const rows: BulkRowState[] = ids
      .map((id) => diffById.get(id))
      .filter((it): it is SchemaDiffItem => Boolean(it && it.questionId))
      .map((it) => ({
        diffId: it.diffId,
        questionId: it.questionId as string,
        category: it.type === "unresolved" ? "unresolved" : "changed",
        suggestedStableKey: it.suggestedStableKey,
        stableKey: normalizeStableKey(it.suggestedStableKey ?? it.stableKey ?? ""),
        submitStatus: "idle" as const,
      }));
    bulk.openModal(rows);
  };

  const bulkLimitExceeded = bulk.breakdown.total > BULK_LIMIT;
  const bulkWarning = bulkLimitExceeded
    ? `一度に選択できるのは最大 ${BULK_LIMIT} 件です（現在 ${bulk.breakdown.total} 件選択中）。`
    : null;

  return (
    <section aria-labelledby="schema-diff-h">
      <h1 id="schema-diff-h">schema 差分</h1>
      <p>{initial.total} 件</p>
      <div>
        <button
          type="button"
          onClick={() => {
            setBulkMode((v) => !v);
            if (bulkMode) bulk.clearSelection();
          }}
          aria-pressed={bulkMode}
        >
          {bulkMode ? "Bulk Resolve を終了" : "Bulk Resolve"}
        </button>
        {bulkMode && (
          <span data-testid="bulk-selection-summary">
            {bulk.breakdown.total} 件選択中（unresolved {bulk.breakdown.unresolved} /
            changed {bulk.breakdown.changed}）
          </span>
        )}
        {bulkMode && (
          <button
            type="button"
            onClick={onConfirmBulk}
            disabled={
              bulk.breakdown.total === 0 || bulkLimitExceeded
            }
            aria-describedby={bulkLimitExceeded ? "bulk-limit-warning" : undefined}
          >
            Bulk Resolve 確定
          </button>
        )}
        {bulkWarning && (
          <p id="bulk-limit-warning" role="alert" data-feedback-kind="bulk_warning">
            {bulkWarning}
          </p>
        )}
      </div>
      {feedback && (
        <div
          id={feedback.kind === "validation_error" ? VALIDATION_FEEDBACK_ID : undefined}
          role={
            feedback.kind === "success" || feedback.kind === "retryable"
              ? "status"
              : "alert"
          }
          data-feedback-kind={feedback.kind}
        >
          <p>{feedback.label}</p>
          {feedback.detail && <p>{feedback.detail}</p>}
        </div>
      )}

      <div className="schema-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {TYPES.map((t) => {
          const showCheckbox = bulkMode && bulkEligible(t);
          const eligibleIds = grouped[t]
            .filter((it) => it.questionId)
            .map((it) => it.diffId);
          const allSelectedInCat =
            eligibleIds.length > 0 &&
            eligibleIds.every((id) => bulk.selectedIds.has(id));
          return (
          <div key={t} aria-labelledby={`pane-${t}`}>
            <h2 id={`pane-${t}`}>{TYPE_LABELS[t]}</h2>
            {grouped[t].length === 0 ? (
              <p>なし</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    {showCheckbox && (
                      <th scope="col">
                        <label>
                          <input
                            type="checkbox"
                            aria-label={`全選択 ${TYPE_LABELS[t]}`}
                            checked={allSelectedInCat}
                            onChange={(e) => {
                              if (e.target.checked) {
                                bulk.selectAllInCategory(
                                  t === "unresolved" ? "unresolved" : "changed",
                                  eligibleIds,
                                );
                              } else {
                                for (const id of eligibleIds) {
                                  if (bulk.selectedIds.has(id)) bulk.toggle(id);
                                }
                              }
                            }}
                          />
                          <span className="visually-hidden">
                            全選択 {TYPE_LABELS[t]}
                          </span>
                        </label>
                      </th>
                    )}
                    <th scope="col">質問</th>
                    <th scope="col">questionId</th>
                    <th scope="col">状態</th>
                  </tr>
                </thead>
                <tbody>
              {grouped[t].map((it) => (
                <tr key={it.diffId}>
                  {showCheckbox && (
                    <td>
                      {it.questionId && (
                        <input
                          type="checkbox"
                          aria-label={`select diff ${it.questionId}`}
                          checked={bulk.selectedIds.has(it.diffId)}
                          onChange={() => bulk.toggle(it.diffId)}
                        />
                      )}
                    </td>
                  )}
                  <td>
                    <button
                      type="button"
                      onClick={() => onSelect(it)}
                      aria-pressed={active?.diffId === it.diffId}
                    >
                      {it.label}
                    </button>
                  </td>
                  <td>{it.questionId ?? "(no questionId)"}</td>
                  <td>{STATUS_LABELS[it.status]}</td>
                </tr>
              ))}
                </tbody>
              </table>
            )}
          </div>
          );
        })}
      </div>

      {active && active.questionId && (
        <form onSubmit={onSubmit} aria-label="stableKey alias 割当">
          <h3>{active.label}</h3>
          <p>questionId: <code>{active.questionId}</code></p>
          <label>
            新しい stableKey
            <input
              ref={stableKeyInputRef}
              type="text"
              value={stableKey}
              onChange={(e) => setStableKey(e.target.value)}
              required
              pattern="[A-Za-z][A-Za-z0-9_]*"
              aria-invalid={trimmedKey.length > 0 && !isValidStableKey}
              aria-describedby={describedBy}
            />
          </label>
          <p id="schema-alias-stableKey-hint">
            英字で始まり、英数字と _ のみ使用できます。
          </p>
          <button
            type="submit"
            disabled={busy || !trimmedKey || !isValidStableKey}
          >
            割当
          </button>
          <button type="button" onClick={() => setActive(null)}>閉じる</button>
        </form>
      )}
      {active && !active.questionId && (
        <p role="alert">この diff には questionId がないため alias 割当はできません。</p>
      )}

      <SchemaDiffBulkResolveModal
        open={bulk.modalOpen}
        rows={bulk.rows}
        isSubmitting={bulk.isSubmitting}
        onUpdateStableKey={bulk.updateRowStableKey}
        onApplyRecommendation={bulk.applySuggestion}
        onApplyAllRecommendations={bulk.applyAllSuggestions}
        onSubmit={() => {
          void bulk.submit();
        }}
        onClose={bulk.closeModal}
      />
    </section>
  );
}
