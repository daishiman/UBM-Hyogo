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
} from "../../lib/admin/api";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
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

export function SchemaDiffPanel({ initial }: { readonly initial: SchemaDiffListView }) {
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
    </section>
  );
}
