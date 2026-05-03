"use client";
// 06c: SchemaDiffPanel — added/changed/removed/unresolved の 4 ペイン + alias 割当 form
// 不変条件 #14: 本コンポーネントは /admin/schema/page.tsx 以外で import しない
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { postSchemaAlias } from "../../lib/admin/api";

export type DiffType = "added" | "changed" | "removed" | "unresolved";

export interface SchemaDiffItem {
  diffId: string;
  revisionId: string;
  type: DiffType;
  questionId: string | null;
  stableKey: string | null;
  label: string;
  suggestedStableKey?: string | null;
  recommendedStableKeys?: string[];
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
const PROTECTED_STABLE_KEYS = new Set(["publicConsent", "rulesConsent", "responseEmail"]);

interface DryRunPreview {
  affectedResponseFields: number;
  currentStableKeyCount: number;
  conflictExists: boolean;
}

const getRecommendedStableKeys = (it: SchemaDiffItem): string[] =>
  it.recommendedStableKeys ?? (it.suggestedStableKey ? [it.suggestedStableKey] : []);

const formatCreatedAt = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

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
  const [toast, setToast] = useState<string | null>(null);
  const [dryRunPreview, setDryRunPreview] = useState<DryRunPreview | null>(null);

  const onSelect = (it: SchemaDiffItem) => {
    setActive(it);
    setStableKey(getRecommendedStableKeys(it)[0] ?? it.stableKey ?? "");
    setDryRunPreview(null);
    setToast(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !active.questionId || !stableKey.trim()) return;
    if (PROTECTED_STABLE_KEYS.has(stableKey.trim())) {
      setToast("失敗: protected stableKey cannot be assigned");
      return;
    }
    setBusy(true);
    const r = await postSchemaAlias({
      diffId: active.diffId,
      questionId: active.questionId,
      stableKey: stableKey.trim(),
      dryRun: dryRunPreview === null,
    });
    setBusy(false);
    if (!r.ok) {
      setToast(`失敗: ${r.error}`);
      return;
    }
    const data = r.data as { mode?: string } & DryRunPreview;
    if (data.mode === "dryRun") {
      setDryRunPreview({
        affectedResponseFields: data.affectedResponseFields,
        currentStableKeyCount: data.currentStableKeyCount,
        conflictExists: data.conflictExists,
      });
      setToast("dryRun を確認しました");
      return;
    }
    setToast("alias を割当てました");
    setActive(null);
    setDryRunPreview(null);
    router.refresh();
  };

  return (
    <section aria-labelledby="schema-diff-h">
      <h1 id="schema-diff-h">schema 差分</h1>
      <p>{initial.total} 件</p>
      {toast && <p role="status">{toast}</p>}

      <div className="schema-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {TYPES.map((t) => (
          <div key={t} aria-labelledby={`pane-${t}`} data-testid="admin-schema-section">
            <h2 id={`pane-${t}`}>{t}</h2>
            <ul>
              {grouped[t].length === 0 && <li>なし</li>}
              {grouped[t].map((it) => (
                <li key={it.diffId}>
                  <button
                    type="button"
                    onClick={() => onSelect(it)}
                    aria-pressed={active?.diffId === it.diffId}
                  >
                    {it.label}
                    <br />
                    <small>
                      type: {it.type} / questionId: {it.questionId ?? "(no questionId)"} / stableKey:{" "}
                      {it.stableKey ?? "(unknown)"} / status: {it.status} / createdAt:{" "}
                      <time dateTime={it.createdAt}>{formatCreatedAt(it.createdAt)}</time>
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {active && active.questionId && (
        <form onSubmit={onSubmit} aria-label="stableKey alias 割当">
          <h3>{active.label}</h3>
          <p>questionId: <code>{active.questionId}</code></p>
          {getRecommendedStableKeys(active).length > 0 && (
            <div aria-label="recommended stableKeys">
              <p>候補 stableKey</p>
              <ul>
                {getRecommendedStableKeys(active).map((key) => (
                  <li key={key}>
                    <button type="button" onClick={() => {
                      setStableKey(key);
                      setDryRunPreview(null);
                    }}>
                      {key}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <label>
            新しい stableKey
            <input
              type="text"
              value={stableKey}
              onChange={(e) => {
                setStableKey(e.target.value);
                setDryRunPreview(null);
              }}
              required
            />
          </label>
          {dryRunPreview && (
            <dl aria-label="dryRun result">
              <dt>影響回答数</dt>
              <dd>{dryRunPreview.affectedResponseFields}</dd>
              <dt>現在の stableKey 件数</dt>
              <dd>{dryRunPreview.currentStableKeyCount}</dd>
              <dt>衝突</dt>
              <dd>{dryRunPreview.conflictExists ? "あり" : "なし"}</dd>
            </dl>
          )}
          <button type="submit" disabled={busy || !stableKey.trim()}>
            {dryRunPreview ? "適用" : "dryRun"}
          </button>
          <button type="button" onClick={() => {
            setActive(null);
            setDryRunPreview(null);
          }}>閉じる</button>
        </form>
      )}
      {active && !active.questionId && (
        <p role="alert">この diff には questionId がないため alias 割当はできません。</p>
      )}
    </section>
  );
}
