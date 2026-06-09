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
  rollbackSchemaAlias,
  rollbackSchemaAliasBulk,
  RollbackApiError,
  recomputeSchemaAlias,
  type RollbackSchemaAliasResult,
  type RecomputeSchemaAliasResult,
} from "../../lib/admin/api";
import {
  useSchemaDiffBulkSelection,
  type BulkRowState,
} from "./hooks/useSchemaDiffBulkSelection";
import { useSchemaDiffBulkRollbackSelection } from "./hooks/useSchemaDiffBulkRollbackSelection";
import { SchemaDiffBulkResolveModal } from "./SchemaDiffBulkResolveModal";
import { SchemaDiffBulkRollbackModal } from "./SchemaDiffBulkRollbackModal";
import {
  isStableKeyValid,
  normalizeStableKey,
  STABLE_KEY_VALIDATION_MESSAGE,
} from "./schemaAliasValidation";
import {
  describeDiffType,
  describeSchemaStatus,
} from "./schemaGlossary";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
import { Chip } from "../ui";
import { isBrowser } from "../../lib/is-browser";
import { FetchAuthedError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";

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
  resolvedAliases?: ResolvedAliasItem[];
}

const TYPES: DiffType[] = ["added", "changed", "removed", "unresolved"];
const TYPE_LABELS: Record<DiffType, string> = {
  added: "追加",
  changed: "変更",
  removed: "削除",
  unresolved: "未解決",
};
const TYPE_CHIP_TONE: Record<DiffType, "green" | "amber" | "red" | "cool"> = {
  added: "green",
  changed: "amber",
  removed: "red",
  unresolved: "cool",
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

interface SchemaAliasApplyBody {
  ok?: boolean;
  mode?: "apply" | "dryRun";
  alias?: {
    id: string;
    revisionId: string;
    aliasQuestionId: string;
    aliasLabel: string | null;
    resolvedAt: string | null;
    resolvedBy: string | null;
    version: number;
  };
  backfill?: {
    status?: string;
    retryable?: boolean;
    code?: string;
  };
  code?: string;
  existingQuestionIds?: string[];
  existingStableKey?: string;
}

function buildSchemaAliasErrorMessage(
  status: number,
  fallback: string,
  payload: SchemaAliasApplyBody | null,
): string {
  if (status === 422) {
    if (payload?.code === "stable_key_collision") {
      const ids = payload.existingQuestionIds ?? [];
      return `stableKey は既存 questionId と衝突しています（${ids.join(", ")}）`;
    }
    return fallback;
  }
  if (status === 409 && payload?.existingStableKey) {
    return `${fallback}（既存 stableKey: ${payload.existingStableKey}）`;
  }
  return fallback;
}

const getSchemaAliasErrorMessage = (error: unknown): string => {
  if (error instanceof FetchAuthedError) return error.bodyText;
  if (error instanceof Error) return error.message;
  return "unknown error";
};


// Issue #778: rollback / undo に必要な型と内部 component。HistoryPane / RollbackConfirmModal /
// UndoToast はいずれも同ファイル内に閉じ、外部 export しない（不変条件 #14）。
export interface ResolvedAliasItem {
  id: string;
  revisionId: string;
  stableKey: string;
  aliasQuestionId: string;
  aliasLabel: string;
  resolvedAt: string;
  resolvedBy: string;
  version: number;
  impact?: ImpactInfo;
}

interface ImpactInfo {
  affectedResponseCount: number;
  recomputeRequired: boolean;
}

type RollbackModalState =
  | { kind: "idle" }
  | { kind: "confirm"; alias: ResolvedAliasItem }
  | { kind: "calling"; alias: ResolvedAliasItem }
  | { kind: "error"; alias: ResolvedAliasItem; status: number; message: string };

type UndoState =
  | { kind: "hidden" }
  | { kind: "available"; alias: ResolvedAliasItem; expiresAt: number };

const UNDO_WINDOW_MS = 5 * 60 * 1000;

// Issue #836: recompute（reverse-backfill）UI 状態。job の真実は server（D1）。
// UI は API レスポンスからこの状態を導出する（UI に真実を持たない）。
type RecomputeUiStatus = "idle" | "submitting" | "completed" | "running" | "failed";

interface PostRollbackRecomputeState {
  aliasId: string;
  aliasLabel: string;
  processedCount: number | null;
}

const RECOMPUTE_STATUS_LABEL: Record<RecomputeUiStatus, string> = {
  idle: "未実行",
  submitting: "再集計中…",
  running: "再集計中（継続可能）",
  completed: "再集計済み",
  failed: "再集計に失敗",
};

const RECOMPUTE_BUTTON_LABEL: Record<RecomputeUiStatus, string> = {
  idle: "再集計を実行",
  submitting: "再集計を実行",
  running: "再集計を続行",
  completed: "再集計済み",
  failed: "再集計を再試行",
};

interface RollbackConfirmModalProps {
  readonly alias: ResolvedAliasItem;
  readonly actorEmail: string | null;
  readonly busy: boolean;
  readonly errorMessage: string | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

function RollbackConfirmModal(props: RollbackConfirmModalProps) {
  const titleId = "rollback-title";
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        props.onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      // eslint-disable-next-line no-restricted-globals -- isBrowser() guard above
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
        // eslint-disable-next-line no-restricted-globals -- isBrowser() guard above
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // eslint-disable-next-line no-restricted-globals -- isBrowser() guard above
    document.addEventListener("keydown", onKey);
    return () => {
      // eslint-disable-next-line no-restricted-globals -- isBrowser() guard above
      document.removeEventListener("keydown", onKey);
    };
  }, [props]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={dialogRef}
      data-component="rollback-confirm-modal"
      className="rollback-modal"
    >
      <h3 id={titleId}>resolve の取り消し</h3>
      <dl>
        <dt>alias label</dt>
        <dd>{props.alias.aliasLabel}</dd>
        <dt>stableKey</dt>
        <dd><code>{props.alias.stableKey}</code></dd>
        <dt>resolved at</dt>
        <dd>{props.alias.resolvedAt}</dd>
        <dt>resolved by</dt>
        <dd>{props.alias.resolvedBy}</dd>
        <dt>影響応答件数</dt>
        <dd data-role="affected-response-count">
          {props.alias.impact
            ? `${props.alias.impact.affectedResponseCount} 件`
            : "未取得"}
        </dd>
        <dt>再集計要否</dt>
        <dd data-role="recompute-required">
          {props.alias.impact?.recomputeRequired ? "必要" : "不要または未確定"}
        </dd>
        <dt>操作者 (you)</dt>
        <dd>{props.actorEmail ?? "(unknown)"}</dd>
      </dl>
      {props.errorMessage && (
        <p role="alert" data-role="modal-error">
          {props.errorMessage}
        </p>
      )}
      <div className="rollback-modal-actions">
        <button
          type="button"
          onClick={props.onCancel}
          ref={cancelRef}
          disabled={props.busy}
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={props.onConfirm}
          disabled={props.busy}
          data-action="confirm-rollback"
        >
          {props.busy ? "取り消し中…" : "取り消す"}
        </button>
      </div>
    </div>
  );
}

interface HistoryPaneProps {
  readonly aliases: ReadonlyArray<ResolvedAliasItem>;
  readonly onRequestRollback: (alias: ResolvedAliasItem) => void;
  readonly bulkRollbackMode: boolean;
  readonly selectedIds: ReadonlySet<string>;
  readonly selectedCount: number;
  readonly bulkLimitExceeded: boolean;
  readonly onToggleBulkRollbackMode: () => void;
  readonly onToggleBulkRollbackAlias: (aliasId: string) => void;
  readonly onSelectAllBulkRollbackAliases: (aliasIds: string[]) => void;
  readonly onConfirmBulkRollback: () => void;
}

function HistoryPane(props: HistoryPaneProps) {
  const visibleAliases = props.aliases.slice(0, 10);
  const allSelected =
    visibleAliases.length > 0 &&
    visibleAliases.every((alias) => props.selectedIds.has(alias.id));
  if (props.aliases.length === 0) {
    return (
      <section aria-labelledby="schema-alias-history-h">
        <h2 id="schema-alias-history-h">resolve 履歴</h2>
        <p>履歴はまだありません。</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="schema-alias-history-h">
      <h2 id="schema-alias-history-h">resolve 履歴</h2>
      <div>
        <button
          type="button"
          onClick={props.onToggleBulkRollbackMode}
          aria-pressed={props.bulkRollbackMode}
        >
          {props.bulkRollbackMode ? "Bulk Rollback を終了" : "Bulk Rollback"}
        </button>
        {props.bulkRollbackMode && (
          <>
            <span data-testid="bulk-rollback-selection-summary">
              {props.selectedCount} 件選択中
            </span>
            <button
              type="button"
              onClick={props.onConfirmBulkRollback}
              disabled={props.selectedCount === 0 || props.bulkLimitExceeded}
              aria-describedby={
                props.bulkLimitExceeded ? "bulk-rollback-limit-warning" : undefined
              }
            >
              Bulk Rollback 確認
            </button>
          </>
        )}
      </div>
      {props.bulkRollbackMode && props.bulkLimitExceeded && (
        <p
          id="bulk-rollback-limit-warning"
          role="alert"
          data-feedback-kind="bulk_rollback_warning"
        >
          一度に選択できるのは最大 {BULK_LIMIT} 件です（現在 {props.selectedCount} 件選択中）。
        </p>
      )}
      <ul role="list" data-component="schema-alias-history">
        {props.bulkRollbackMode && (
          <li>
            <label>
              <input
                type="checkbox"
                aria-label="resolve 履歴を全選択"
                checked={allSelected}
                onChange={() =>
                  props.onSelectAllBulkRollbackAliases(
                    visibleAliases.map((alias) => alias.id),
                  )
                }
              />
              <span>表示中の履歴を全選択</span>
            </label>
          </li>
        )}
        {visibleAliases.map((a) => (
          <li key={a.id} data-alias-id={a.id}>
            {props.bulkRollbackMode && (
              <input
                type="checkbox"
                aria-label={`select alias ${a.aliasLabel}`}
                checked={props.selectedIds.has(a.id)}
                onChange={() => props.onToggleBulkRollbackAlias(a.id)}
              />
            )}
            <span>{a.aliasLabel}</span>
            <code>{a.stableKey}</code>
            <time dateTime={a.resolvedAt}>{a.resolvedAt}</time>
            <span>{a.resolvedBy}</span>
            <button
              type="button"
              onClick={() => props.onRequestRollback(a)}
              aria-label={`alias ${a.aliasLabel} の resolve を取り消す`}
            >
              rollback
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface UndoToastProps {
  readonly alias: ResolvedAliasItem;
  readonly onUndo: () => void;
  readonly onDismiss: () => void;
}

function UndoToast(props: UndoToastProps) {
  return (
    <div role="status" aria-live="polite" data-component="undo-toast">
      <p>
        alias「{props.alias.aliasLabel}」を割当てました。5 分以内であれば取消できます。
      </p>
      <button
        type="button"
        onClick={props.onUndo}
        aria-label={`alias ${props.alias.aliasLabel} の割当を取消す`}
      >
        取消
      </button>
      <button type="button" onClick={props.onDismiss}>
        閉じる
      </button>
    </div>
  );
}

export interface SchemaDiffPanelProps {
  readonly initial: SchemaDiffListView;
  readonly resolvedAliases?: ReadonlyArray<ResolvedAliasItem>;
  readonly actorEmail?: string | null;
  readonly hideInlineStats?: boolean;
}

export function SchemaDiffPanel({
  initial,
  resolvedAliases,
  actorEmail,
  hideInlineStats = false,
}: SchemaDiffPanelProps) {
  const router = useRouter();
  const schemaAliasMutation = useAdminMutation<SchemaAliasApplyBody>("/api/admin/schema/aliases", "POST", {
    refreshOnSuccess: false,
    mutationFn: async (payload) => {
      const r = await postSchemaAlias(payload as {
        questionId: string;
        stableKey: string;
        diffId?: string;
      });
      if (!r.ok) {
        const errPayload = (r.data ?? null) as SchemaAliasApplyBody | null;
        const message = buildSchemaAliasErrorMessage(r.status, r.error, errPayload);
        throw new FetchAuthedError(r.status, message);
      }
      if (isSchemaAliasRetryableContinuation(r)) return r.data as SchemaAliasApplyBody;
      return r.data as SchemaAliasApplyBody;
    },
  });
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

  // Issue #778: rollback / undo state
  const [rollbackState, setRollbackState] = useState<RollbackModalState>({
    kind: "idle",
  });
  // Issue #836: recompute UI state（reverse-backfill 実行・status バッジ）
  const [postRollbackRecompute, setPostRollbackRecompute] =
    useState<PostRollbackRecomputeState | null>(null);
  const [recomputeStatus, setRecomputeStatus] = useState<RecomputeUiStatus>("idle");
  const [recomputeError, setRecomputeError] = useState<string | null>(null);
  const recomputeMutation = useAdminMutation<RecomputeSchemaAliasResult>(
    "/api/admin/schema/aliases/recompute",
    "POST",
    {
      refreshOnSuccess: false,
      mutationFn: (payload) =>
        recomputeSchemaAlias(payload as { aliasId: string }),
      successMessage: (data) =>
        `再集計を実行しました（処理件数: ${data.processedCount}）`,
      onSuccess: (data) => {
        setRecomputeStatus(data.status === "completed" ? "completed" : "running");
        setRecomputeError(null);
        setPostRollbackRecompute((prev) =>
          prev ? { ...prev, processedCount: data.processedCount } : prev,
        );
      },
      onError: (e) => {
        setRecomputeStatus("failed");
        setRecomputeError(e instanceof Error ? e.message : "再集計に失敗しました");
      },
    },
  );
  const handleRecompute = (aliasId: string) => {
    setRecomputeStatus("submitting");
    setRecomputeError(null);
    // trigger は onError 後に re-throw するため、state 反映済みの reject は握り潰す。
    void recomputeMutation.trigger({ aliasId }).catch(() => {});
  };
  const [undoState, setUndoState] = useState<UndoState>({ kind: "hidden" });
  const [historyAliases, setHistoryAliases] = useState<ResolvedAliasItem[]>(
    () => [...(resolvedAliases ?? initial.resolvedAliases ?? [])],
  );
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const startUndoTimer = (alias: ResolvedAliasItem) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoState({ kind: "available", alias, expiresAt: Date.now() + UNDO_WINDOW_MS });
    undoTimerRef.current = setTimeout(() => {
      setUndoState({ kind: "hidden" });
    }, UNDO_WINDOW_MS);
  };

  const performRollback = async (alias: ResolvedAliasItem): Promise<RollbackSchemaAliasResult | null> => {
    setRollbackState({ kind: "calling", alias });
    try {
      const result = await rollbackSchemaAlias({
        aliasId: alias.id,
        version: alias.version,
      });
      // 履歴から該当 alias を除去
      setHistoryAliases((prev) => prev.filter((a) => a.id !== alias.id));
      setRollbackState({ kind: "idle" });
      setUndoState({ kind: "hidden" });
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (result.impact.recomputeRequired) {
        setPostRollbackRecompute({
          aliasId: result.aliasId,
          aliasLabel: alias.aliasLabel,
          processedCount: null,
        });
        setRecomputeStatus("idle");
        setRecomputeError(null);
      } else {
        setPostRollbackRecompute(null);
      }
      setFeedback({
        kind: "success",
        label: `resolve を取消しました（影響件数: ${result.impact.affectedResponseCount}${result.impact.recomputeRequired ? " / 再集計推奨" : ""}）`,
      });
      router.refresh();
      return result;
    } catch (e) {
      if (e instanceof RollbackApiError) {
        setRollbackState({
          kind: "error",
          alias,
          status: e.status,
          message: e.message,
        });
      } else {
        setRollbackState({
          kind: "error",
          alias,
          status: 0,
          message: e instanceof Error ? e.message : "unknown error",
        });
      }
      return null;
    }
  };

  const onConfirmRollback = async () => {
    if (rollbackState.kind !== "confirm") return;
    await performRollback(rollbackState.alias);
  };

  const onUndo = async () => {
    if (undoState.kind !== "available") return;
    await performRollback(undoState.alias);
  };

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

  const [bulkRollbackMode, setBulkRollbackMode] = useState(false);
  const bulkRollback = useSchemaDiffBulkRollbackSelection({
    rollbackSchemaAliasBulk,
    onRowsSucceeded: (aliasIds) => {
      setHistoryAliases((prev) => prev.filter((alias) => !aliasIds.includes(alias.id)));
      setFeedback({
        kind: "success",
        label: `resolve を ${aliasIds.length} 件取消しました`,
      });
      router.refresh();
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
    let body: SchemaAliasApplyBody;
    try {
      body = await schemaAliasMutation.trigger({
        diffId: active.diffId,
        questionId: active.questionId,
        stableKey: trimmedKey,
      });
    } catch (e) {
      setBusy(false);
      if (e instanceof FetchAuthedError && e.status === 422) {
        setFeedback({
          kind: "validation_error",
          label: `入力内容に誤りがあります: ${e.bodyText}`,
        });
        return;
      }
      if (e instanceof FetchAuthedError && e.status === 409) {
        setFeedback({
          kind: "conflict_error",
          label: `他の操作と競合しました: ${e.bodyText}`,
        });
        return;
      }
      setFeedback({
        kind: "error",
        label: `失敗: ${getSchemaAliasErrorMessage(e)}`,
      });
      return;
    }
    setBusy(false);

    if (
      body.mode === "apply" &&
      body.backfill?.status === "exhausted" &&
      body.backfill.retryable === true &&
      body.backfill.code === "backfill_cpu_budget_exhausted"
    ) {
      setFeedback({
        kind: "retryable",
        label: "Back-fill 再試行可能（続きから処理できます）",
        detail: "もう一度「割当」を押すと続きから処理されます。",
      });
      return;
    }

    setFeedback({ kind: "success", label: "alias を割当てました" });
    // Issue #778: resolve 直後の undo toast を 5 分間表示。
    // undo は実 alias id + version が返った場合だけ有効化する。
    if (active && active.questionId && body.mode === "apply" && body.alias) {
      const newAlias: ResolvedAliasItem = {
        id: body.alias.id,
        revisionId: body.alias.revisionId,
        stableKey: trimmedKey,
        aliasQuestionId: body.alias.aliasQuestionId,
        aliasLabel: body.alias.aliasLabel ?? active.label,
        resolvedAt: body.alias.resolvedAt ?? new Date().toISOString(),
        resolvedBy: body.alias.resolvedBy ?? actorEmail ?? "you",
        version: body.alias.version,
        impact: { affectedResponseCount: 0, recomputeRequired: false },
      };
      setHistoryAliases((prev) => [newAlias, ...prev.filter((a) => a.id !== newAlias.id)].slice(0, 10));
      startUndoTimer(newAlias);
    }
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

  const bulkRollbackLimitExceeded = bulkRollback.selectedCount > BULK_LIMIT;
  const onConfirmBulkRollback = () => {
    if (bulkRollback.selectedCount === 0 || bulkRollbackLimitExceeded) return;
    const aliases = historyAliases.filter((alias) =>
      bulkRollback.selectedIds.has(alias.id),
    );
    bulkRollback.openModal(aliases);
  };

  return (
    <section aria-labelledby="schema-diff-h" className="ui-card card-pad-lg">
      <div className="row-between">
        <div>
          <div className="eyebrow">DIFF ITEMS</div>
          <h2 id="schema-diff-h" className="h-section">
            項目別の差分
          </h2>
        </div>
        {!hideInlineStats && <p className="muted">{initial.total} 件</p>}
      </div>
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
      {postRollbackRecompute && (
        <div className="recompute-action" data-role="recompute-action">
          <p>
            alias「{postRollbackRecompute.aliasLabel}」の rollback 後再集計
          </p>
          <button
            type="button"
            data-role="recompute-trigger"
            disabled={recomputeStatus === "submitting"}
            aria-disabled={recomputeStatus === "submitting"}
            onClick={() => handleRecompute(postRollbackRecompute.aliasId)}
          >
            {RECOMPUTE_BUTTON_LABEL[recomputeStatus]}
          </button>
          <span
            data-role="recompute-status"
            data-status={recomputeStatus}
            role="status"
            aria-live="polite"
          >
            {RECOMPUTE_STATUS_LABEL[recomputeStatus]}
          </span>
          {postRollbackRecompute.processedCount !== null && (
            <span data-role="recompute-processed-count">
              処理件数: {postRollbackRecompute.processedCount}
            </span>
          )}
          {recomputeStatus === "failed" && recomputeError && (
            <p data-role="recompute-error">{recomputeError}</p>
          )}
        </div>
      )}

      <div className="schema-grid">
        {TYPES.map((t) => {
          const typeDescription = describeDiffType(t);
          const showCheckbox = bulkMode && bulkEligible(t);
          const eligibleIds = grouped[t]
            .filter((it) => it.questionId)
            .map((it) => it.diffId);
          const allSelectedInCat =
            eligibleIds.length > 0 &&
            eligibleIds.every((id) => bulk.selectedIds.has(id));
          return (
          <div key={t} aria-labelledby={`pane-${t}`}>
            <div className="schema-diff-pane-header">
              <h2 id={`pane-${t}`}>{typeDescription.label}</h2>
              <p className="muted">
                {typeDescription.description} {typeDescription.actionHint}
              </p>
            </div>
            {grouped[t].length === 0 ? (
              <EmptyState
                title={t === "unresolved" ? "差分はありません" : "なし"}
                {...(t === "unresolved"
                  ? { description: "フォームとデータベースが一致した良い状態です。" }
                  : {})}
                role="presentation"
              />
            ) : (
              <div className="stack-sm">
                {showCheckbox && (
                  <label className="schema-field-card">
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
                    <span>全選択 {TYPE_LABELS[t]}</span>
                  </label>
                )}
                {grouped[t].map((it) => (
                  <div key={it.diffId} className={`schema-field-card diff-${it.type}`}>
                    {showCheckbox && it.questionId && (
                      <input
                        type="checkbox"
                        aria-label={`select diff ${it.questionId}`}
                        checked={bulk.selectedIds.has(it.diffId)}
                        onChange={() => bulk.toggle(it.diffId)}
                      />
                    )}
                    <div>
                      <div className="row">
                        <span className="chip-row">
                          <Chip tone={TYPE_CHIP_TONE[it.type]}>{TYPE_LABELS[it.type]}</Chip>
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelect(it)}
                          aria-pressed={active?.diffId === it.diffId}
                        >
                          {it.label}
                        </button>
                      </div>
                      <p className="muted mono">
                        questionId: {it.questionId ?? "(no questionId)"}
                        {it.stableKey ? ` · stableKey: ${it.stableKey}` : ""}
                      </p>
                      <p className="muted">{describeSchemaStatus(it.status)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {active && active.questionId && (
        <form onSubmit={onSubmit} aria-label="stableKey alias 割当">
          <h3>{active.label}</h3>
          <p>questionId: <code>{active.questionId}</code></p>
          <div className="schema-assignment-outcome">
            <strong>対応づけると起きること</strong>
            <p>
              この設問の回答が項目キー <code>{trimmedKey || "stableKey"}</code> に結びつき、
              会員一覧・詳細・マイページで同じ項目として表示されます。対応づけ後は backfill が走り、
              必要な場合は5分以内に取消できます。
            </p>
          </div>
          <FormField name="schema-stableKey" label="新しい stableKey" required>
            <Input
              ref={stableKeyInputRef}
              type="text"
              value={stableKey}
              onChange={(e) => setStableKey(e.target.value)}
              required
              pattern="[A-Za-z][A-Za-z0-9_]*"
              aria-invalid={trimmedKey.length > 0 && !isValidStableKey}
              aria-describedby={describedBy}
            />
          </FormField>
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

      <HistoryPane
        aliases={historyAliases}
        onRequestRollback={(alias) => {
          setRecomputeStatus("idle");
          setRecomputeError(null);
          setRollbackState({ kind: "confirm", alias });
        }}
        bulkRollbackMode={bulkRollbackMode}
        selectedIds={bulkRollback.selectedIds}
        selectedCount={bulkRollback.selectedCount}
        bulkLimitExceeded={bulkRollbackLimitExceeded}
        onToggleBulkRollbackMode={() => {
          setBulkRollbackMode((value) => !value);
          if (bulkRollbackMode) bulkRollback.clearSelection();
        }}
        onToggleBulkRollbackAlias={bulkRollback.toggle}
        onSelectAllBulkRollbackAliases={bulkRollback.selectAll}
        onConfirmBulkRollback={onConfirmBulkRollback}
      />

      {(rollbackState.kind === "confirm" ||
        rollbackState.kind === "calling" ||
        rollbackState.kind === "error") && (
        <RollbackConfirmModal
          alias={rollbackState.alias}
          actorEmail={actorEmail ?? null}
          busy={rollbackState.kind === "calling"}
          errorMessage={
            rollbackState.kind === "error"
              ? `失敗 (${rollbackState.status}): ${rollbackState.message}`
              : null
          }
          onCancel={() => setRollbackState({ kind: "idle" })}
          onConfirm={onConfirmRollback}
        />
      )}

      {undoState.kind === "available" && (
        <UndoToast
          alias={undoState.alias}
          onUndo={onUndo}
          onDismiss={() => {
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            setUndoState({ kind: "hidden" });
          }}
        />
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
      <SchemaDiffBulkRollbackModal
        open={bulkRollback.modalOpen}
        rows={bulkRollback.rows}
        summary={bulkRollback.summary}
        isSubmitting={bulkRollback.isSubmitting}
        onSubmit={() => {
          void bulkRollback.submit();
        }}
        onClose={bulkRollback.closeModal}
      />
    </section>
  );
}
