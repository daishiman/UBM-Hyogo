"use client";
// 06c: SchemaDiffPanel — added/changed/removed/unresolved の 4 ペイン + alias 割当 form
// 不変条件 #14: 本コンポーネントは /admin/schema/page.tsx 以外で import しない
// UT-07B-FU-02: HTTP 202 retryable continuation を「失敗」と区別して表示する。
//   API contract（/schema/aliases の 200/202 分岐）は変更せず、表示分岐のみで運用者に伝える。
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  postSchemaAlias,
  isSchemaAliasRetryableContinuation,
  rollbackSchemaAlias,
  RollbackApiError,
  type RollbackSchemaAliasResult,
} from "../../lib/admin/api";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
import { isBrowser } from "../../lib/is-browser";
import { AdminMutationError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";

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
const STATUS_LABELS: Record<SchemaDiffItem["status"], string> = {
  queued: "未解決",
  resolved: "解決済み",
};

const STABLE_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
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
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
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
      <p className="warning-text" data-role="recompute-warning">
        ⚠ 関連する response_fields の再集計が必要になる可能性があります。
        再集計実行は本タスク外です（別途運用フォロー）。
      </p>
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
}

function HistoryPane(props: HistoryPaneProps) {
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
      <ul role="list" data-component="schema-alias-history">
        {props.aliases.slice(0, 10).map((a) => (
          <li key={a.id} data-alias-id={a.id}>
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
}

export function SchemaDiffPanel({ initial, resolvedAliases, actorEmail }: SchemaDiffPanelProps) {
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
        throw new AdminMutationError(r.status, message);
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

  const onSelect = (it: SchemaDiffItem) => {
    setActive(it);
    setStableKey(it.suggestedStableKey ?? it.stableKey ?? "");
    setFeedback(null);
  };

  const trimmedKey = stableKey.trim();
  const isValidStableKey = STABLE_KEY_PATTERN.test(trimmedKey);
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
        label:
          "stableKey は英字で始まり、英数字と _ のみ使用できます（例: fullName）。",
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
      if (e instanceof AdminMutationError && e.status === 422) {
        setFeedback({
          kind: "validation_error",
          label: `入力内容に誤りがあります: ${e.message}`,
        });
        return;
      }
      if (e instanceof AdminMutationError && e.status === 409) {
        setFeedback({
          kind: "conflict_error",
          label: `他の操作と競合しました: ${e.message}`,
        });
        return;
      }
      setFeedback({
        kind: "error",
        label: `失敗: ${e instanceof Error ? e.message : "unknown error"}`,
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

  return (
    <section aria-labelledby="schema-diff-h">
      <h1 id="schema-diff-h">schema 差分</h1>
      <p>{initial.total} 件</p>
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
        {TYPES.map((t) => (
          <div key={t} aria-labelledby={`pane-${t}`}>
            <h2 id={`pane-${t}`}>{TYPE_LABELS[t]}</h2>
            {grouped[t].length === 0 ? (
              <EmptyState title="なし" role="presentation" />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th scope="col">質問</th>
                    <th scope="col">questionId</th>
                    <th scope="col">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[t].map((it) => (
                    <tr key={it.diffId}>
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
        ))}
      </div>

      {active && active.questionId && (
        <form onSubmit={onSubmit} aria-label="stableKey alias 割当">
          <h3>{active.label}</h3>
          <p>questionId: <code>{active.questionId}</code></p>
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
        onRequestRollback={(alias) =>
          setRollbackState({ kind: "confirm", alias })
        }
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
    </section>
  );
}
