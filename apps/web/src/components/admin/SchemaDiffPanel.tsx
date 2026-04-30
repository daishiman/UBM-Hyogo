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

  const onSelect = (it: SchemaDiffItem) => {
    setActive(it);
    setStableKey(it.suggestedStableKey ?? it.stableKey ?? "");
    setToast(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !active.questionId || !stableKey.trim()) return;
    setBusy(true);
    const r = await postSchemaAlias({
      diffId: active.diffId,
      questionId: active.questionId,
      stableKey: stableKey.trim(),
    });
    setBusy(false);
    if (!r.ok) {
      setToast(`失敗: ${r.error}`);
      return;
    }
    setToast("alias を割当てました");
    setActive(null);
    router.refresh();
  };

  return (
    <section aria-labelledby="schema-diff-h">
      <h1 id="schema-diff-h">schema 差分</h1>
      <p>{initial.total} 件</p>
      {toast && <p role="status">{toast}</p>}

      <div className="schema-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {TYPES.map((t) => (
          <div key={t} aria-labelledby={`pane-${t}`}>
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
                    <small>{it.questionId ?? "(no questionId)"} — {it.status}</small>
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
          <label>
            新しい stableKey
            <input
              type="text"
              value={stableKey}
              onChange={(e) => setStableKey(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={busy || !stableKey.trim()}>割当</button>
          <button type="button" onClick={() => setActive(null)}>閉じる</button>
        </form>
      )}
      {active && !active.questionId && (
        <p role="alert">この diff には questionId がないため alias 割当はできません。</p>
      )}
    </section>
  );
}
