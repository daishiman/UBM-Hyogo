# Phase 5: 実装手順

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)。関数シグネチャ・データ構造・行番号の正本は §5 / §6。設計は [`phase-2-design.md`](./phase-2-design.md)、テストは [`phase-4-test-plan.md`](./phase-4-test-plan.md)。

## 0. 変更対象ファイル一覧（[Feedback RT-03]）

| # | Path | 種別 | Lane | 操作 |
|---|------|------|------|------|
| 1 | `apps/web/src/lib/admin/api.ts` | 編集 | A | `AppliedFiltersZ`（行 582-592）に `batchId: z.string().nullable()` 追加 + `defaultAppliedFilters()`（行 623-633）に `batchId: null` 追加 |
| 2 | `apps/web/src/lib/admin/schemaHistoryError.ts` | 新規 | B | `formatSchemaHistoryError(e: unknown): string` 純関数 |
| 3 | `apps/web/src/lib/admin/schemaHistoryGlossary.ts` | 新規 | C | `schemaHistoryGlossary` / `schemaHistoryPurposeSteps` 純データ + 型 |
| 4 | `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx` | 新規 | C | 目的説明パネル component |
| 5 | `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | 編集 | A/B/C/D | `EMPTY_RESPONSE` に batchId / catch を formatter 化 / alert に class / explainer 組込 / table→card |
| 6 | `apps/web/app/(admin)/admin/schema/history/page.tsx` | 編集 | C | `AdminPageHeader` の title/description/breadcrumb 平易化 |
| 7 | `apps/web/src/styles/globals.css` | 編集 | B/D | `.schema-history-error` + `.schema-history-list` / `.schema-history-card` 系（OKLch token のみ） |
| 8 | `apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts` | 新規 | E | error formatter unit（Phase 4 §3） |
| 9 | `apps/web/src/lib/admin/__tests__/api.spec.ts` | 追記 | E | batchId parse 回帰（Phase 4 §4） |
| 10 | `apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | 新規 | E | explainer 描画回帰（Phase 4 §5） |
| 11 | `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx` | 編集 | E | human-readable error / card / explainer 追記（Phase 4 §6） |

> **非接触（不変条件 #5）**: `apps/api/**` / `apps/api/migrations/**` / Google Form schema は一切編集しない。実装後 `git diff origin/dev...HEAD -- apps/api apps/api/migrations` が空であることを AC-9 で確認する。
>
> **canUseTool / IPC Bridge / Preload API について**: 本タスクは Cloudflare Workers + Next.js の web 表現層改修であり、Electron preload / IPC / `canUseTool` のような bridge 機構は **本タスクに無関係なため該当なし**。

## 0-1. 実装順序

SSOT §4 の通り全 Lane を 1 実装サイクル（同一 wave）で完了する（CONST_007）。推奨着手順は依存関係に沿って **Lane A → B → C → D → E**。E（テスト）は各 Lane と並走して TDD で書いてよいが、最終的に同一 wave 内で GREEN にする。

1. **Lane A**（#1, #5 の EMPTY_RESPONSE 部分）= 機能バグ根治。最優先。
2. **Lane B**（#2, #5 の catch/alert, #7 の error class）= エラー堅牢化。
3. **Lane C**（#3, #4, #5 の explainer 組込, #6）= 目的説明UI。
4. **Lane D**（#5 の table→card, #7 の card class）= カード整合。
5. **Lane E**（#8〜#11）= 回帰テスト GREEN 化。

---

## 1. Lane A — zod batchId 受理（#1, #5）

### 1-1. `apps/web/src/lib/admin/api.ts` — `AppliedFiltersZ`（行 582-592）

`to` と `limit` の間に `batchId: z.string().nullable()` を追加する。`.strict()` は**維持**（想定外キーの早期検出を残す最小修正）。

変更前（行 582-592）:
```ts
const AppliedFiltersZ = z
  .object({
    action: z.string().nullable(),
    actorEmail: z.string().nullable(),
    targetType: z.string().nullable(),
    targetId: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string().nullable(),
    limit: z.number(),
  })
  .strict();
```
変更後:
```ts
const AppliedFiltersZ = z
  .object({
    action: z.string().nullable(),
    actorEmail: z.string().nullable(),
    targetType: z.string().nullable(),
    targetId: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string().nullable(),
    batchId: z.string().nullable(), // ← 追加。API generic audit endpoint が返す相関キー。schema history では常に null
    limit: z.number(),
  })
  .strict();
```
> 型 `SchemaAliasHistoryResponse`（`z.infer`、行 602）が自動的に `appliedFilters.batchId` を含むようになる。

### 1-2. `apps/web/src/lib/admin/api.ts` — `defaultAppliedFilters()`（行 623-633）

> **重要**: `fetchSchemaAliasHistory` は API 生レスポンスを直接 parse せず、`projectAuditRowsToHistory` → `normalizeAppliedFilters`（`defaultAppliedFilters()` を base にスプレッド、行 635-643）を通した `projected` を parse する（行 703-704）。`batchId` を **`defaultAppliedFilters()` にも追加**しないと、API が batchId を返しても normalize で base に存在せず、かつ batchId 必須化で型不整合となる。Phase 4 TC-A-FETCH-03 の根拠。

変更前（行 623-633）:
```ts
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
```
変更後（`to` と `limit` の間に `batchId: null` を追加）:
```ts
function defaultAppliedFilters(): SchemaAliasHistoryResponse["appliedFilters"] {
  return {
    action: SCHEMA_ALIAS_RESOLVE_ACTION,
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    batchId: null,
    limit: SCHEMA_ALIAS_HISTORY_LIMIT,
  };
}
```
> `normalizeAppliedFilters`（行 635-643）はスプレッドで全キーを通すため追加修正不要。API が `appliedFilters.batchId` を返せばその値が、欠落していれば default の `null` が入る。

### 1-3. `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` — `EMPTY_RESPONSE`（行 31-44）

`appliedFilters` の `to` と `limit` の間に `batchId: null` を追加（型 `SchemaAliasHistoryResponse` 整合）。

変更後（SSOT §6 逐語）:
```ts
const EMPTY_RESPONSE: SchemaAliasHistoryResponse = {
  ok: true,
  items: [],
  nextCursor: null,
  appliedFilters: {
    action: "schema_diff.alias_assigned",
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    batchId: null, // ← 追加（型 SchemaAliasHistoryResponse に整合）
    limit: 50,
  },
};
```

---

## 2. Lane B — エラー表示の堅牢化（#2, #5, #7）

### 2-1. `apps/web/src/lib/admin/schemaHistoryError.ts`（新規・#2）

SSOT §6 を逐語で実装。`ZodError` を `zod` から named import。判定順序は **ZodError を先**（`Error` サブクラスのため）。

```ts
import { ZodError } from "zod";

/**
 * 履歴取得時の例外を、画面表示に適した日本語メッセージへ変換する純関数。
 * raw JSON（ZodError.message）をそのまま UI へ出さないための堅牢化。
 * - ZodError: データ形式不一致
 * - HTTP ステータス系 Error: サーバー応答エラー
 * - その他: 汎用失敗メッセージ
 */
export function formatSchemaHistoryError(e: unknown): string {
  if (e instanceof ZodError) {
    return "履歴データの形式が想定と一致しませんでした。時間をおいて再度お試しください。";
  }
  if (e instanceof Error) {
    if (/HTTP\s*\d{3}/.test(e.message)) {
      return "履歴の取得に失敗しました（サーバー応答エラー）。時間をおいて再度お試しください。";
    }
    return "履歴の取得に失敗しました。時間をおいて再度お試しください。";
  }
  return "履歴の取得に失敗しました。";
}
```
> 入力 `unknown`（catch 節の例外）・出力 日本語 string・副作用なしの純関数。Phase 4 §3 の 4 分岐（TC-E-ERR-01〜04）を満たす。

### 2-2. `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` — catch 2 箇所

`formatSchemaHistoryError` を import に追加:
```ts
import { formatSchemaHistoryError } from "../../lib/admin/schemaHistoryError";
```

`load` 内 catch（行 80-81）:
```ts
// 変更前
} catch (e) {
  setError(e instanceof Error ? e.message : "履歴の取得に失敗しました");
}
// 変更後
} catch (e) {
  setError(formatSchemaHistoryError(e));
}
```

`onNext` 内 catch（行 119-120）も同様に置換:
```ts
// 変更後
} catch (e) {
  setError(formatSchemaHistoryError(e));
}
```

### 2-3. `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` — alert 描画（行 185）

```tsx
// 変更前
{error ? <p role="alert">{error}</p> : null}
// 変更後
{error ? <p role="alert" className="schema-history-error">{error}</p> : null}
```

### 2-4. `apps/web/src/styles/globals.css` — `.schema-history-error`（#7）

SSOT §6 / §2.5 の色トークン表に従い、OKLch token のみで追加（HEX 直書き禁止）。**実装時に `apps/web/src/styles/tokens.css` / `globals.css` を grep し、`--ubm-color-danger-soft` / `--ubm-color-danger` / `--ubm-text-sm` の実在を確認**してから使用すること（変数名ドリフト対策）。実在しない場合は同義の実在 token に読み替える。

```css
/* schema history: error alert（raw JSON の不格好表示を解消） */
.schema-history-error {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--ubm-color-danger-soft);
  color: var(--ubm-color-danger);
  border: 1px solid var(--ubm-color-danger);
  font-size: var(--ubm-text-sm);
}
```

---

## 3. Lane C — 目的説明UI / 用途明確化（#3, #4, #5, #6）

### 3-1. `apps/web/src/lib/admin/schemaHistoryGlossary.ts`（新規・#3）

SSOT §6 を逐語で実装（純データ・型 export 含む）。

```ts
export interface SchemaHistoryGlossaryTerm {
  readonly term: string;   // 技術名（併記用）
  readonly plain: string;  // やさしい言い換え
}

export interface SchemaHistoryPurposeStep {
  readonly order: number;
  readonly label: string;  // 流れの 1 ステップ
}

export const schemaHistoryGlossary: readonly SchemaHistoryGlossaryTerm[] = [
  { term: "alias resolve（エイリアス解決）", plain: "新しくなった設問を、過去のどの設問と同じ扱いにするか紐付ける作業" },
  { term: "stableKey", plain: "設問につける変わらない名札。フォームの文言が変わっても同じ回答だと分かる目印" },
  { term: "audit（監査ログ）", plain: "誰がいつ何をしたかを記録した操作の履歴" },
  { term: "question text", plain: "Google フォームに表示される設問の文章" },
];

export const schemaHistoryPurposeSteps: readonly SchemaHistoryPurposeStep[] = [
  { order: 1, label: "Google フォームの設問が追加・変更される" },
  { order: 2, label: "「スキーマ差分のレビュー」画面で新旧の設問を照合し stableKey を紐付ける（alias resolve）" },
  { order: 3, label: "紐付けた操作がここに「誰がいつどの設問をどう解決したか」として記録される" },
];
```

### 3-2. `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx`（新規・#4）

SSOT §6 を逐語で実装。root に `data-testid="schema-history-purpose-explainer"`。props なし・状態なしの純表示。色は OKLch token / class のみ（HEX 直書き禁止）。

```tsx
import type { ReactElement } from "react";
import { schemaHistoryGlossary, schemaHistoryPurposeSteps } from "../../lib/admin/schemaHistoryGlossary";

/**
 * /admin/schema/history 冒頭に置く目的説明パネル。
 * 「何の画面か」「いつ使うか」「何が分かるか」+ 流れ + 用語集を平易な日本語で提示する。
 * 純表示（props なし・状態なし）。色は OKLch token のみ。
 */
export function SchemaHistoryPurposeExplainer(): ReactElement {
  return (
    <div data-testid="schema-history-purpose-explainer">
      {/* 見出し */}
      <h2>この画面でできること</h2>
      {/* 1 文要約 */}
      <p>Google フォームの設問を新旧で紐付け（alias resolve）した操作の履歴を確認できます</p>
      {/* 流れ: schemaHistoryPurposeSteps（番号付き） */}
      <ol>
        {schemaHistoryPurposeSteps.map((s) => (
          <li key={s.order}>{s.label}</li>
        ))}
      </ol>
      {/* 用語集: schemaHistoryGlossary（plain 主・term 併記） */}
      <dl>
        {schemaHistoryGlossary.map((g) => (
          <div key={g.term}>
            <dt>{g.plain}</dt>
            <dd>{g.term}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```
> マークアップの tag 構成は実装裁量だが、(a) root `data-testid="schema-history-purpose-explainer"`、(b) 見出し「この画面でできること」、(c) 1 文要約の逐語文、(d) 流れ 3 ステップ全描画、(e) 用語集 4 件の plain + term 両方描画、を満たすこと（Phase 4 §5 / AC-5）。スタイルは class 経由（OKLch token）。必要なら globals.css に explainer 用 class を OKLch token のみで追加してよい。

### 3-3. `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` — explainer 組込

import 追加:
```ts
import { SchemaHistoryPurposeExplainer } from "./SchemaHistoryPurposeExplainer";
```

マウント位置（[`phase-2-design.md`](./phase-2-design.md) §Lane C）: フィルタ `<form role="search">`（行 145）の**直前**、`showChrome` の h1 ブロック（行 132-143）直後に置く。

```tsx
      ) : null}

      <SchemaHistoryPurposeExplainer />

      <form role="search" aria-label="履歴フィルタ" onSubmit={applyFilters}>
```

### 3-4. `apps/web/app/(admin)/admin/schema/history/page.tsx`（#6）

`AdminPageHeader` の title / description / breadcrumb 末尾を SSOT §6 逐語で平易化する。

```tsx
<AdminPageHeader
  eyebrow="ADMIN / SCHEMA"
  title="設問の紐付け履歴"            // ← 旧「alias resolve 履歴」を平易化
  description="フォームの設問を新旧で紐付け（alias resolve）した操作の記録を、操作者・期間で絞り込んで確認できます" // ← 旧「過去の解消結果を audit 経由で閲覧」を平易化
  breadcrumbs={[
    { label: "管理", href: "/admin" },
    { label: "Form schema", href: "/admin/schema" },
    { label: "紐付け履歴" },          // ← 旧「履歴」
  ]}
/>
```
> 実装時に既存 `page.tsx` の `AdminPageHeader` 呼び出し（プロパティ名 `eyebrow` / `title` / `description` / `breadcrumbs` の実シグネチャ）を Read し、存在するプロパティ名に整合させる。`AdminPageHeader` を使っていない場合は、当該 page が render する見出し要素の title/description テキストを上記文言へ置換する（文言が正本、実装方法は既存構造に合わせる）。

---

## 4. Lane D — 履歴カード表示整合（#5, #7）

### 4-1. `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` — table → card（行 187-224）

`displayItems.length === 0` の EmptyState 分岐（行 187-188）は**維持**。else 側の `<table>` ブロック（行 190-214）を `<ul>` ベースのカードリストへ置換。`Pagination`（行 215-222）は現行のまま末尾維持。

変更後（SSOT §6 / [`phase-2-design.md`](./phase-2-design.md) §Lane D）:
```tsx
{displayItems.length === 0 ? (
  <EmptyState title="該当する履歴がありません" />
) : (
  <>
    <ul
      className="schema-history-list"
      aria-busy={isFetching}
      aria-label="resolve 履歴"
    >
      {displayItems.map((it) => (
        <li
          key={it.auditId}
          className="schema-history-card"
          data-audit-id={it.auditId}
        >
          {/* stableKey（mono 強調） */}
          <span className="schema-history-card__key">
            {it.afterStableKey ?? it.beforeStableKey ?? "—"}
          </span>
          {/* 紐付け遷移 旧→新 */}
          <span className="schema-history-card__transition">
            {it.beforeStableKey ?? "—"} → {it.afterStableKey ?? "—"}
          </span>
          {/* question text */}
          <span className="schema-history-card__question">
            {it.questionText ?? "—"}
          </span>
          {/* 操作日時・操作者 */}
          <span className="schema-history-card__meta">
            {it.createdAt} ・ {it.actorEmail ?? "(unknown)"}
          </span>
        </li>
      ))}
    </ul>
    <Pagination
      current={1}
      hasNext={response.nextCursor !== null}
      hasPrev={false}
      onNext={onNext}
      nextLabel="次の 50 件"
      nextAriaLabel="次の 50 件"
    />
  </>
)}
```
> - 各 `<li>` に `data-audit-id={it.auditId}` を**保持**（既存 spec / Phase 4 TC-C-CARD-02 互換）。
> - class 名（`schema-history-card__key` 等）は実装裁量。Phase 4 で参照するのは `.schema-history-card` / `data-audit-id` / 表示テキスト（stableKey / 旧→新 / question / 日時 / 操作者）。
> - 不変条件 #3: 新 primitive component は作らず、素の HTML + OKLch class で表現する。

### 4-2. `apps/web/src/styles/globals.css` — card 系（#7）

SSOT §6 / §2.5 トークン表に従い OKLch token のみで追加（HEX 直書き禁止）。実在 token を grep 確認。

```css
/* schema history: alias resolve カード（プロトタイプ ALIAS HISTORY 準拠） */
.schema-history-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
}
.schema-history-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--ubm-color-surface-panel);
  border: 1px solid var(--ubm-color-border-default);
}
.schema-history-card__key {
  font-family: var(--ubm-font-mono, monospace);
  font-weight: 600;
}
.schema-history-card__meta {
  font-size: var(--ubm-text-xs);
  color: var(--ubm-color-text-muted);
}
```
> 補助 class（`__transition` / `__question`）にも色を当てる場合は §2.5 表の `--ubm-color-text-secondary` / `--ubm-color-text-muted` / `--ubm-color-accent` から実在するもののみ使用。`--ubm-font-mono` が無ければ `monospace` フォールバックのみで可（HEX は使わない）。

---

## 5. Lane E — 回帰テスト（#8〜#11）

[`phase-4-test-plan.md`](./phase-4-test-plan.md) を正本に新規 3 spec を作成し、既存 panel spec を追記更新する。

- #8 `schemaHistoryError.spec.ts` = Phase 4 §3（TC-E-ERR-01〜04）
- #9 `api.spec.ts` = Phase 4 §4（TC-A-PARSE / TC-A-FETCH 群。fetch は `global.fetch` を `vi.fn()` で差し替え）
- #10 `SchemaHistoryPurposeExplainer.component.spec.tsx` = Phase 4 §5（TC-C-EXP-01〜05）
- #11 `SchemaDiffHistoryPanel.component.spec.tsx` 追記 = Phase 4 §6（既存 TC の card 化更新 + TC-C-ERR / TC-C-CARD / TC-C-EXP-IN 追記）

> 既存 spec の `okResp` ヘルパの `appliedFilters` に `batchId: null` を追加して型整合させる（Lane A 反映）。

---

## 6. 実装後の検証（SSOT §11）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  src/lib/admin/__tests__/schemaHistoryError.spec.ts \
  apps/web/src/lib/admin/__tests__/api.spec.ts \
  src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx \
  src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
git diff origin/dev...HEAD -- apps/api apps/api/migrations   # 空であること（AC-9）
```

> commit / push / PR は Phase 13（user-gated）。staging 反映後の screenshot 取得は Phase 11（user-gated）。
