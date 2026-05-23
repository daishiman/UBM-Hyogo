# Phase 5: 実装手順

## 0. 事前確認（§2.5 / §2.6 判断点の確定）

実装着手前に以下を実行し、結果を本ファイル末尾の §10 に追記する。

```bash
mise exec -- node -v   # v24.15.0

# (a) schema_diff.alias_assigned の action 識別子 / payload column を確認
grep -rnE "schema_diff.alias_assigned|schema_alias|aliasResolve" \
  apps/api/src/routes/admin/ apps/api/src/repository/

# (b) audit payload に before/after stableKey / questionText が含まれるかを確認
grep -rnE "beforeStableKey|afterStableKey|questionText|stableKey" \
  apps/api/src/routes/admin/schema.ts apps/api/src/repository/

# (c) audit endpoint の zod schema を確認（AdminAuditListItemZ の現在形）
grep -nE "AdminAuditListItemZ|maskedBefore|maskedAfter" \
  apps/api/src/routes/admin/audit.ts

# (d) shared primitive の存在確認
test -f apps/web/src/components/ui/Pagination.tsx
test -f apps/web/src/components/ui/FormField.tsx
test -f apps/web/src/components/ui/Breadcrumb.tsx
test -f apps/web/src/components/ui/EmptyState.tsx

# (e) data-page / route 命名衝突確認
grep -rn "data-page=\"admin-schema-history\"" apps/web 2>/dev/null
test ! -e apps/web/app/\(admin\)/admin/schema/history
```

判定:

| 条件 | 採用 |
|---|---|
| (a) `action = "schema_diff.alias_assigned"` が grep でヒット かつ (b) `maskedBefore` / `maskedAfter` 内に before/after stableKey と questionText が含まれる | **案 A**（既存 `/admin/audit?action=schema_diff.alias_assigned`） |
| 上記が満たされない | **案 B**（`/admin/schema/history` 新設、本 spec § と並行して `apps/api/src/routes/admin/schema.ts` 拡張仕様を別途追加） |

原則 **案 A 採用** を前提に以下手順を記述する。案 B 昇格時は §10 でその旨を明記し、helper の URL とレスポンス parser を案 B 用に置き換える。

---

## 1. 実装順序（DoD ベース）

1. zod schema `SchemaAliasHistoryItemZ` + helper `fetchSchemaAliasHistory` を `apps/web/src/lib/admin/api.ts` に追加
2. helper unit spec を `apps/web/src/lib/admin/__tests__/api.spec.ts` に追加（Phase 4 §4 の TC-H-01〜09）
3. `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` を新規作成（client component）
4. component spec を `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx` に新規作成（Phase 4 §3 の TC-C-01〜09）
5. route page `apps/web/app/(admin)/admin/schema/history/page.tsx` を新規作成（thin server wrapper, search params を client component に渡す）
6. 既存 `apps/web/app/(admin)/admin/schema/page.tsx` に history へのリンク 1 箇所を追加
7. `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test` を pass まで反復
8. HEX 直書き grep（§5）/ design-tokens gate 先回り確認

---

## 2. ファイル別の変更内容

### 2.1 `apps/web/src/lib/admin/api.ts`（変更）

末尾に以下を追加する。

```ts
import { z } from "zod";

// ---- schema alias resolve 履歴 (案 A: /admin/audit?action=schema_diff.alias_assigned) ----

export const SchemaAliasHistoryItemZ = z.object({
  auditId: z.string().min(1),
  actorEmail: z.string().nullable(),
  createdAt: z.string().min(1),
  beforeStableKey: z.string().nullable(),
  afterStableKey: z.string().nullable(),
  questionText: z.string().nullable(),
}).strict();
export type SchemaAliasHistoryItem = z.infer<typeof SchemaAliasHistoryItemZ>;

export const SchemaAliasHistoryResponseZ = z.object({
  ok: z.literal(true),
  items: z.array(SchemaAliasHistoryItemZ),
  nextCursor: z.string().nullable(),
  appliedFilters: z.object({
    action: z.string().nullable(),
    actorEmail: z.string().nullable(),
    targetType: z.string().nullable(),
    targetId: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string().nullable(),
    limit: z.number(),
  }),
}).strict();
export type SchemaAliasHistoryResponse = z.infer<typeof SchemaAliasHistoryResponseZ>;

export interface FetchSchemaAliasHistoryParams {
  actorEmail?: string;
  from?: string;
  to?: string;
  questionTextLike?: string;
  cursor?: string;
}

const SCHEMA_ALIAS_RESOLVE_ACTION = "schema_diff.alias_assigned";
const SCHEMA_ALIAS_HISTORY_LIMIT = 50;

export async function fetchSchemaAliasHistory(
  params: FetchSchemaAliasHistoryParams = {},
): Promise<SchemaAliasHistoryResponse> {
  const q = new URLSearchParams();
  q.set("action", SCHEMA_ALIAS_RESOLVE_ACTION);
  q.set("limit", String(SCHEMA_ALIAS_HISTORY_LIMIT));
  if (params.actorEmail) q.set("actorEmail", params.actorEmail.toLowerCase());
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  // questionTextLike is intentionally client-side only; do not send it to the audit endpoint.
  if (params.cursor) q.set("cursor", params.cursor);

  const res = await fetch(`/api/admin/audit?${q.toString()}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`fetchSchemaAliasHistory failed: HTTP ${res.status}`);
  }
  const raw = (await res.json()) as unknown;
  // audit endpoint の応答を schema alias history shape に投影
  // raw.items[].maskedBefore / maskedAfter から before/after stableKey と questionText を抽出
  const projected = projectAuditRowsToHistory(raw);
  return SchemaAliasHistoryResponseZ.parse(projected);
}

interface AuditRowLike {
  auditId: string;
  actorEmail: string | null;
  createdAt: string;
  maskedBefore: unknown;
  maskedAfter: unknown;
}

function readStringField(value: unknown, key: string): string | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = (value as Record<string, unknown>)[key];
    return typeof v === "string" ? v : null;
  }
  return null;
}

function defaultAppliedFilters(): SchemaAliasHistoryResponse["appliedFilters"] {
  return {
    action: SCHEMA_ALIAS_RESOLVE_ACTION,
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    limit: SCHEMA_ALIAS_HISTORY_LIMIT,
  };
}

function normalizeAppliedFilters(value: unknown): SchemaAliasHistoryResponse["appliedFilters"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultAppliedFilters();
  }
  return { ...defaultAppliedFilters(), ...(value as Partial<SchemaAliasHistoryResponse["appliedFilters"]>) };
}

function projectAuditRowsToHistory(raw: unknown): SchemaAliasHistoryResponse {
  if (!raw || typeof raw !== "object") {
    return { ok: true, items: [], nextCursor: null, appliedFilters: defaultAppliedFilters() };
  }
  const obj = raw as { items?: unknown; nextCursor?: unknown; appliedFilters?: unknown };
  const items = Array.isArray(obj.items) ? obj.items : [];
  const nextCursor =
    typeof obj.nextCursor === "string" || obj.nextCursor === null
      ? (obj.nextCursor as string | null)
      : null;
  return {
    ok: true,
    items: items
      .filter((row): row is AuditRowLike =>
        Boolean(row) && typeof row === "object" &&
        typeof (row as { auditId?: unknown }).auditId === "string",
      )
      .map((row) => ({
        auditId: row.auditId,
        actorEmail: row.actorEmail,
        createdAt: row.createdAt,
        beforeStableKey: readStringField(row.maskedBefore, "stableKey"),
        afterStableKey: readStringField(row.maskedAfter, "stableKey"),
        questionText:
          readStringField(row.maskedAfter, "questionText") ??
          readStringField(row.maskedBefore, "questionText"),
      })),
    nextCursor,
    appliedFilters: normalizeAppliedFilters(obj.appliedFilters),
  };
}
```

注:

- §0 (b) grep で `maskedBefore` / `maskedAfter` 内の column 名が異なる場合（例: `stable_key` / `question_text`）は `readStringField` の key を差し替える
- audit endpoint は `questionTextLike` query を持たないため、**client side filter**（取得後に `items.filter(it => it.questionText?.includes(q))`）で固定する。UI 上の表示件数が `limit` に満たない可能性を `FormField` helpText と documentation で明示する

### 2.2 `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx`（新規）

```tsx
"use client";
// issue-777: SchemaDiffHistoryPanel — schema alias resolve の過去履歴閲覧 UI
// 不変条件 #14 相当: 本コンポーネントは /admin/schema/history/page.tsx 以外で import しない
// 不変条件 #2 (OKLch token): 色は tokens.css 由来のみ。HEX 直書き禁止
import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchSchemaAliasHistory,
  type SchemaAliasHistoryItem,
  type SchemaAliasHistoryResponse,
} from "../../lib/admin/api";
import { Breadcrumb } from "../ui/Breadcrumb";
import { Pagination } from "../ui/Pagination";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";

export interface SchemaDiffHistoryPanelProps {
  readonly initial: SchemaAliasHistoryResponse;
  readonly initialFilters: {
    actorEmail: string;
    from: string;
    to: string;
    questionTextLike: string;
  };
}

export function SchemaDiffHistoryPanel({
  initial,
  initialFilters,
}: SchemaDiffHistoryPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initial.items);
  const [nextCursor, setNextCursor] = useState(initial.nextCursor);
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (filters.actorEmail) q.set("actorEmail", filters.actorEmail.trim().toLowerCase());
    if (filters.from) q.set("from", filters.from);
    if (filters.to) q.set("to", filters.to);
    // questionTextLike is intentionally client-side only; do not send it to the audit endpoint.
    startTransition(() => {
      router.replace(`/admin/schema/history?${q.toString()}`);
    });
  };

  const onNext = useCallback(async () => {
    if (!nextCursor) return;
    setError(null);
    try {
      const r = await fetchSchemaAliasHistory({
        actorEmail: filters.actorEmail || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        
        cursor: nextCursor,
      });
      setItems(r.items);
      setNextCursor(r.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "履歴の取得に失敗しました");
    }
  }, [nextCursor, filters]);

  return (
    <section aria-labelledby="schema-history-h" data-page="admin-schema-history">
      <Breadcrumb
        items={[
          { label: "admin", href: "/admin" },
          { label: "schema", href: "/admin/schema" },
          { label: "history" },
        ]}
      />
      <h1 id="schema-history-h">schema alias resolve 履歴</h1>

      <form role="search" aria-label="履歴フィルタ" onSubmit={applyFilters}>
        <FormField name="actorEmail" label="操作者 email">
          <Input
            type="email"
            value={filters.actorEmail}
            onChange={(e) => setFilters((f) => ({ ...f, actorEmail: e.target.value }))}
          />
        </FormField>
        <FormField name="from" label="期間（開始）">
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
        </FormField>
        <FormField name="to" label="期間（終了）">
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
        </FormField>
        <FormField name="questionTextLike" label="question 部分一致">
          <Input
            type="text"
            value={filters.questionTextLike}
            onChange={(e) =>
              setFilters((f) => ({ ...f, questionTextLike: e.target.value }))
            }
          />
        </FormField>
        <button type="submit" disabled={isPending}>絞り込み</button>
      </form>

      {error && <p role="alert">{error}</p>}

      {items.length === 0 ? (
        <EmptyState title="該当する履歴がありません" />
      ) : (
        <>
          <div aria-busy={isPending}>
            <table aria-label="resolve 履歴">
              <thead>
                <tr>
                  <th scope="col">操作日時</th>
                  <th scope="col">操作者 email</th>
                  <th scope="col">before stableKey</th>
                  <th scope="col">after stableKey</th>
                  <th scope="col">question text</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: SchemaAliasHistoryItem) => (
                  <tr key={it.auditId}>
                    <td>{it.createdAt}</td>
                    <td>{it.actorEmail ?? "(unknown)"}</td>
                    <td>{it.beforeStableKey ?? "—"}</td>
                    <td>{it.afterStableKey ?? "—"}</td>
                    <td>{it.questionText ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            hasNext={nextCursor !== null}
            onNext={onNext}
            nextLabel="次の 50 件"
          />
        </>
      )}
    </section>
  );
}
```

> `Pagination` primitive のシグネチャ（`hasNext` / `onNext` / `nextLabel`）は §0 (d) の存在確認時に実装に合わせて調整する。cursor base の `Pagination` が prev/next 両対応の場合は `onPrev` を `undefined` で渡し、disabled 表示にする。

### 2.3 `apps/web/app/(admin)/admin/schema/history/page.tsx`（新規）

```tsx
// issue-777: schema alias resolve 履歴閲覧 page
// 不変条件 #5 適用: web は API helper 経由で audit endpoint を呼ぶ（D1 直接アクセスなし）
// 不変条件 #2 (OKLch): tokens.css 由来の色のみ使用
import type { ReactElement } from "react";
import { SchemaDiffHistoryPanel } from "../../../../../src/components/admin/SchemaDiffHistoryPanel";

export const dynamic = "force-dynamic";

interface SearchParams {
  actorEmail?: string;
  from?: string;
  to?: string;
  questionTextLike?: string;
  cursor?: string;
}

export default async function SchemaHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<ReactElement> {
  const sp = await searchParams;
  return (
    <SchemaDiffHistoryPanel
      initialFilters={{
        actorEmail: sp.actorEmail ?? "",
        from: sp.from ?? "",
        to: sp.to ?? "",
        questionTextLike: sp.questionTextLike ?? "",
      }}
      initialCursor={sp.cursor ?? null}
    />
  );
}
```

> 初回 fetch は `SchemaDiffHistoryPanel` が `useEffect` で `fetchSchemaAliasHistory()` を呼び出す。既存 `apps/web/src/lib/admin/api.ts` は同一 origin client helper なので、server wrapper から直接呼ばない。

### 2.4 `apps/web/app/(admin)/admin/schema/page.tsx`（変更: 1 箇所）

既存 page の上部に history へのリンクを 1 行追加する。

```tsx
import Link from "next/link";
// ...既存 import...

<nav aria-label="schema sub navigation">
  <Link href="/admin/schema/history">resolve 履歴を見る</Link>
</nav>
```

配置位置は既存 `<SchemaDiffPanel initial={...} />` の直前。既存の `SchemaDiffPanel` 仕様は変更しない。

### 2.5 `apps/web/src/lib/admin/__tests__/api.spec.ts`（変更）

Phase 4 §4 / Phase 6 §2 の describe ブロックを既存ファイル末尾に追加する。`#11 / #13` 不変条件テストには影響しない（`fetchSchemaAliasHistory` は `profile` / `tag` pattern にマッチしない）。

### 2.6 `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx`（新規）

Phase 6 §1 で確定する describe / it ツリーをそのまま実装する。

---

## 3. 型シグネチャ要約

```ts
// helper
export function fetchSchemaAliasHistory(
  params?: FetchSchemaAliasHistoryParams,
): Promise<SchemaAliasHistoryResponse>;

export interface FetchSchemaAliasHistoryParams {
  actorEmail?: string;
  from?: string;
  to?: string;
  questionTextLike?: string;
  cursor?: string;
}

// zod から派生する型
export type SchemaAliasHistoryItem = {
  auditId: string;
  actorEmail: string | null;
  createdAt: string;
  beforeStableKey: string | null;
  afterStableKey: string | null;
  questionText: string | null;
};

export type SchemaAliasHistoryResponse = {
  items: SchemaAliasHistoryItem[];
  nextCursor: string | null;
};

// component
export function SchemaDiffHistoryPanel(props: {
  readonly initial: SchemaAliasHistoryResponse;
  readonly initialFilters: {
    actorEmail: string;
    from: string;
    to: string;
    questionTextLike: string;
  };
}): JSX.Element;
```

---

## 4. server / client 分離方針

| 層 | 配置 | 責務 |
|---|---|---|
| server wrapper (`page.tsx`) | `apps/web/app/(admin)/admin/schema/history/page.tsx` | URL search params を読み、serializable props として client component に渡す |
| client component (`SchemaDiffHistoryPanel.tsx`) | `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | 初回 fetch、filter state、pagination state、error feedback の表示。filter 確定時は `router.replace(...)` で URL に反映 |

URL search params で filter state を保持することで:

- ブラウザリロードで filter 維持
- 共有 URL で同じ filter を再現
- back/forward navigation で状態整合

---

## 5. error handling 方針

| 経路 | 動作 |
|---|---|
| 初回 client fetch 失敗 | `SchemaDiffHistoryPanel` 内 try/catch、`role="alert"` で「履歴の取得に失敗しました」を表示し、retry 可能な空状態を維持 |
| 次ページ fetch 失敗（client） | `SchemaDiffHistoryPanel` 内 try/catch、`role="alert"` で「履歴の取得に失敗しました」を表示し、既存 items を保持（fail-soft） |
| zod parse error | helper が throw → client alert |
| network error (fetch reject) | helper が catch せず throw（既存 `call()` と異なり history は read-only のため `Error` を直接 throw する） |

---

## 6. design tokens / Tailwind utility ガード

- 色は `apps/web/src/styles/tokens.css` の OKLch token のみ
- `bg-[#...]` / `text-[#...]` / HEX 直書き 全面禁止
- table の row hover や cursor pagination の活性色は既存 `bg-surface-2` / `text-foreground-secondary` 系 token を使用
- before/after stableKey の差分強調（任意）は `--color-info` / `--color-warning` token のみ

```bash
# 実装後に必ず実行する grep gate
grep -nE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" \
  apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx \
  apps/web/app/\(admin\)/admin/schema/history/page.tsx
```

ヒット 0 件を確認してから commit する。

---

## 7. 検証コマンド（実装中 / 完了時）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx \
  src/lib/admin/__tests__/api.spec.ts
```

3 サイクル以内で全 PASS に収束させる（CONST_007 範囲）。

---

## 8. DoD（Definition of Done）

- [ ] §0 grep 結果が §10 に追記され、案 A / 案 B 判定が確定している
- [ ] `fetchSchemaAliasHistory` が `apps/web/src/lib/admin/api.ts` に追加され、zod schema 込みで型が公開されている
- [ ] `SchemaDiffHistoryPanel.tsx` が新規作成され、shared primitive (Breadcrumb / FormField / Pagination / EmptyState) のみで構成されている
- [ ] `apps/web/app/(admin)/admin/schema/history/page.tsx` が新規作成され、URL search params から filter を受ける
- [ ] `apps/web/app/(admin)/admin/schema/page.tsx` に history へのリンクが 1 箇所追加されている
- [ ] helper unit spec が Phase 4 §4 / Phase 6 §2 の TC-H-01〜09 を網羅する
- [ ] component spec が Phase 4 §3 / Phase 6 §1 の TC-C-01〜09 を網羅する
- [ ] HEX 直書き grep ヒット 0 件
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] 既存 `apps/web/src/lib/admin/__tests__/api.spec.ts` の不変条件テスト（#11 / #13）が pass のまま
- [ ] `Phase 7` の coverage 目標を満たす
- [ ] `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` §3 を consumed に更新（Phase 9 で実施）

---

## 9. 既知のリスク / 後続課題

| 項目 | 内容 | 対応 |
|---|---|---|
| audit endpoint の `questionTextLike` 非対応 | 現行 `ListAuditQueryZ` が非対応 | client side filter で固定、helpText に現 page 内 filter と明記 |
| `maskedBefore` / `maskedAfter` の column 名差異 | `stableKey` ではなく `stable_key` 等の場合 | `readStringField` の key を実 payload に合わせて差し替え |
| Pagination primitive API 差異 | `hasNext` ではなく `nextDisabled` 等の場合 | primitive 実装に合わせ component 側を調整 |
| rollback (followup-004) からの導線 | 本タスクでは「履歴表示」のみで rollback 実装はしない | row に `data-audit-id` を付与し、followup-004 の起点を選択可能にする |

---

## 10. §0 grep 結果記録（実装着手時に追記する）

```
# 実装着手時にここへ追記
# (a) action 識別子: 
# (b) payload column 名:
# (c) audit endpoint zod schema 状態:
# (d) primitive 存在:
# 採用案: A / B
# questionTextLike は client side filter 固定
```
