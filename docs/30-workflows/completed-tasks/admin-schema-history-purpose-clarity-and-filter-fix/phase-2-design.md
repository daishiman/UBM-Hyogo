# Phase 2: 設計

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)。関数シグネチャ・データ構造の正本は §6。

## 1. トポロジー（責務境界・状態所有権）

```
app/(admin)/admin/schema/history/page.tsx   ← Server Component。AdminPageHeader（title/desc 平易化）+ SchemaDiffHistoryPanel をマウント。状態を持たない
  └─ components/admin/SchemaDiffHistoryPanel.tsx   ← Client Component。filters / response / error state の唯一の所有者
        ├─ components/admin/SchemaHistoryPurposeExplainer.tsx (新)  ← 純表示（state なし）。冒頭の目的説明UI
        ├─ lib/admin/schemaHistoryGlossary.ts (新)                 ← 純データ（用語集・流れ）。UI から分離
        ├─ lib/admin/schemaHistoryError.ts (新)                    ← 純関数。例外→日本語メッセージ。副作用なし
        └─ lib/admin/api.ts (編集)                                 ← fetch + zod parse の adapter 層。AppliedFiltersZ に batchId 追加
```

状態所有権:
- フィルタ・取得結果・エラー文字列は `SchemaDiffHistoryPanel` のみが所有（変更なし）。
- `SchemaHistoryPurposeExplainer` / glossary / error formatter は **状態を持たない**（テスト容易・再利用容易）。
- zod parse の境界は `api.ts` の `fetchSchemaAliasHistory` に閉じる（変更なし。schema 定義のみ修正）。

## 2. 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 部品 | 再利用 / 新規 | 根拠 |
|------|-------------|------|
| `AdminPageHeader` | 再利用 | title/description/breadcrumbs を props で差し替えるだけ |
| `EmptyState` | 再利用 | 0 件表示は現行のまま |
| `Pagination` | 再利用 | ページングロジック不変 |
| `FormField` / `Input` | 再利用 | フィルタフォーム不変（不変条件 #7） |
| 目的説明パネル | 新規 `SchemaHistoryPurposeExplainer` | 既存に同等 primitive なし。先例 `admin-schema-page-purpose-clarity-ux` の `SchemaPurposeExplainer` は `/admin/schema` 専用かつ本 worktree 未マージのため流用不可 |
| 用語集データ | 新規 `schemaHistoryGlossary` | 純データ SSOT を UI から分離（先例 `schemaGlossary` と同じ設計思想） |
| error formatter | 新規 `schemaHistoryError` | raw JSON 抑止のための純関数。既存になし |
| 履歴カード | 新規 markup（primitive ではない） | プロトタイプ ALIAS HISTORY を素の HTML + OKLch class で表現。新 primitive component は作らない（不変条件 #3） |

## 3. Lane 別設計

### Lane A — zod batchId 受理（機能バグ根治）

- `apps/web/src/lib/admin/api.ts` の `AppliedFiltersZ`（行 582-592）に `batchId: z.string().nullable()` を `to` と `limit` の間へ追加。`.strict()` は維持（想定外キーの早期検出を残す最小修正）。
- 型 `SchemaAliasHistoryResponse`（`z.infer`）が自動的に `appliedFilters.batchId` を含むようになる。
- `SchemaDiffHistoryPanel.tsx` の `EMPTY_RESPONSE.appliedFilters`（行 31-44）に `batchId: null` を追加（型整合）。
- `normalizeAppliedFilters`（api.ts 行 635 付近）はスプレッドで全キーを通すため追加修正不要。zod が batchId を許容すれば parse 成功。

> 設計判断: API 側を `.passthrough()` 化する案は採らない。strict を維持し、既知の batchId だけ明示許容することで、将来の想定外キーは引き続き検出できる（防御性を落とさない）。

### Lane B — エラー表示の堅牢化

- 新規 `apps/web/src/lib/admin/schemaHistoryError.ts` に純関数 `formatSchemaHistoryError(e: unknown): string` を定義（[`shared-context.md` §6](./shared-context.md) のシグネチャを逐語使用）。
  - `e instanceof ZodError` → データ形式不一致メッセージ
  - `e instanceof Error` かつ `/HTTP\s*\d{3}/` → サーバー応答エラーメッセージ
  - それ以外の `Error` → 汎用失敗メッセージ
  - 非 Error → 汎用失敗メッセージ
- `SchemaDiffHistoryPanel.tsx` の 2 箇所の catch（`load` 内 行 80-81 / `onNext` 内 行 119-120）を `setError(formatSchemaHistoryError(e))` に置換。
- 行 185 の error 描画を `<p role="alert" className="schema-history-error">{error}</p>` に変更。
- `globals.css` に `.schema-history-error`（OKLch token のみ）を追加。

> ZodError は `Error` のサブクラスで `e.message` が JSON 文字列だが、`instanceof ZodError` を `instanceof Error` より先に判定するため raw JSON は UI に出ない。Lane A で batchId エラー自体は解消するが、Lane B は「将来別キーが増えても raw JSON を出さない」防御層として独立した価値を持つ（AskUser Q2 = human-readable へ変換）。

### Lane C — 目的説明UI / 用途明確化

- 新規 `apps/web/src/lib/admin/schemaHistoryGlossary.ts`（純データ）: `schemaHistoryGlossary`（用語 4 件）+ `schemaHistoryPurposeSteps`（流れ 3 件）。型は `SchemaHistoryGlossaryTerm` / `SchemaHistoryPurposeStep`。
- 新規 `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx`: root に `data-testid="schema-history-purpose-explainer"`。
  - 見出し「この画面でできること」
  - 1 文要約「Google フォームの設問を新旧で紐付け（alias resolve）した操作の履歴を確認できます」
  - 流れ: `schemaHistoryPurposeSteps` を番号付きリストで
  - 用語集: `schemaHistoryGlossary` を `plain`（主）+ `term`（併記）で
  - 色は OKLch token のみ（HEX 直書き禁止）
- `SchemaDiffHistoryPanel.tsx`: フィルタ form の直前（`<section>` 冒頭、`showChrome` の h1 ブロック直後）に `<SchemaHistoryPurposeExplainer />` をマウント。
- `app/(admin)/admin/schema/history/page.tsx`: `AdminPageHeader` の title を「設問の紐付け履歴」、description を平易文、breadcrumb 末尾を「紐付け履歴」へ（[`shared-context.md` §6](./shared-context.md)）。

### Lane D — 履歴カード表示整合

- `SchemaDiffHistoryPanel.tsx` 行 187-224 の分岐:
  - `displayItems.length === 0` → 既存 `<EmptyState title="該当する履歴がありません" />` 維持
  - else → `<ul className="schema-history-list" aria-busy={isFetching} aria-label="resolve 履歴">` + 各 `<li className="schema-history-card" data-audit-id={it.auditId}>`。
    - stableKey（mono 強調）: `it.afterStableKey ?? it.beforeStableKey ?? "—"`
    - 紐付け遷移: `it.beforeStableKey ?? "—"` → `it.afterStableKey ?? "—"`
    - question: `it.questionText ?? "—"`
    - 操作日時 `it.createdAt` / 操作者 `it.actorEmail ?? "(unknown)"`
  - `<Pagination ... />` は現行のまま末尾に維持
- `globals.css` に `.schema-history-list` / `.schema-history-card`（OKLch token のみ）を追加。
- `data-audit-id` を `<li>` に残し、既存 component spec の参照互換を保つ。

### Lane E — 回帰テスト

[`phase-4-test-plan.md`](./phase-4-test-plan.md) を正本とする。新規 3 spec + 既存 panel spec 追記。

## 4. データフロー（batchId の通り道）

```
API GET /admin/audit?action=schema_diff.alias_assigned
  → response.appliedFilters = { action, actorEmail, targetType, targetId, from, to, batchId(=null), limit }
  → web fetchSchemaAliasHistory: projectAuditRowsToHistory → normalizeAppliedFilters（全キー spread）
  → SchemaAliasHistoryResponseZ.parse(projected)
       現状: AppliedFiltersZ.strict() が batchId を unrecognized_keys で reject → ZodError throw
       修正後: AppliedFiltersZ に batchId 定義 → parse 成功 → 正常表示
```

## 5. 色・トークン参照表（HEX 直書き 0 のため）

| 用途 | token |
|------|-------|
| error 背景 | `var(--ubm-color-danger-soft)` |
| error 文字 / 枠 | `var(--ubm-color-danger)` |
| カード背景 | `var(--ubm-color-surface-panel)` |
| カード枠 | `var(--ubm-color-border-default)` |
| 説明文字 | `var(--ubm-color-text-secondary)` / `--ubm-color-text-muted` |
| アクセント（流れ番号 等） | `var(--ubm-color-accent)` |
| フォントサイズ | `var(--ubm-text-sm)` / `--ubm-text-xs` |

> 使用 token は `apps/web/src/styles/tokens.css` / `globals.css` に実在するもののみ。新規 token は追加しない。実装時に変数名の存在を grep で確認すること。

## 6. リスクと対策

| リスク | 対策 |
|--------|------|
| 既存 panel spec が `<table>`/`role="table"` を前提 | Lane E で card 構造へ spec を更新（同一 wave。`data-audit-id` は保持して差分最小化） |
| `schemaHistoryGlossary` が将来 `/admin/schema` の `schemaGlossary`（先例・未マージ）と重複 | history 専用 SSOT として分離。将来マージ時の統合候補を Phase 12 unassigned に記録 |
| OKLch token 変数名のドリフト | 実装時に `tokens.css`/`globals.css` を grep し実在変数のみ使用。`verify-design-tokens` で最終 gate |
| ZodError import 経路 | `zod` から `ZodError` を named import（既存 `api.ts` も `z` を import 済み） |
