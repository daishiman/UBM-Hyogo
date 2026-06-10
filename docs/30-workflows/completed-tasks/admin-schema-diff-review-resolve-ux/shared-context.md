# shared-context.md — admin-schema-diff-review-resolve-ux（SSOT）

本ファイルは Phase 4-11 を並列執筆する SubAgent の単一の正本（SSOT）。各 SubAgent はここに記された設計・命名・制約から逸脱しない。

---

## 0. タスク要旨

- **workflow_id**: `admin-schema-diff-review-resolve-ux`
- **taskId**: `TASK-ADMIN-SCHEMA-DIFF-REVIEW-RESOLVE-UX-001`
- **status**: `implemented_local_evidence_captured`（apps/web 実装・focused tests・typecheck・design-token検証完了。staging visual / commit / PR は user-gated）
- **visualEvidence**: `VISUAL_ON_EXECUTION`（local focused evidence captured・staging PNG は user-gated）
- **対象**: `apps/web` 表現層のみ（API/D1/Form/endpoint 不変）
- **route**: `/admin/schema`（`apps/web/app/(admin)/admin/schema/page.tsx`）

### 真因（apps/web 表現層の情報設計欠如・機能/API は完成済み）

1. **因果不可視**: 差分カードのラベルボタン（`onSelect`）をクリックすると割当フォームが `SchemaDiffPanel` の `.schema-grid` の**後ろ（パネル最下部）**に描画され、クリック位置から離れる。ユーザーには「IDをクリックしたら下に何か出たが何が起きたか分からない」。
2. **用語無説明**: `stableKey` / `questionId` / `alias` / `resolve` / `unresolved` / `added` / `changed` / `removed` / `backfill` / `recompute` / `rollback` / `revision` が無説明。
3. **文脈ヘルプ欠如**: 「割り当てると過去回答が新設問に対応づく」という達成価値が画面に書かれていない。

### ユーザー確定（AskUserQuestion 2026-06-09）

1. 割当フォーム位置 = **クリックしたカード直下にインライン展開**。
2. 用語 = **やさしい日本語を主・技術名を併記**。
3. 目的説明 = **含める（目的説明 + 各操作の文脈ヘルプ）**。

---

## 1. 既存実装の事実（裏取り済み）

### `apps/web/src/components/admin/SchemaDiffPanel.tsx`（1049 行・既存）

- `"use client"`。不変条件 #14 で `page.tsx` 以外 import 禁止。
- `DiffType = "added" | "changed" | "removed" | "unresolved"`。
- 既存ラベル定数:
  - `TYPE_LABELS = { added:"追加", changed:"変更", removed:"削除", unresolved:"未解決" }`
  - `STATUS_LABELS = { queued:"未解決", resolved:"解決済み" }`
  - `TYPE_CHIP_TONE = { added:"green", changed:"amber", removed:"red", unresolved:"cool" }`
- 描画構造（現状）:
  - `.schema-grid` で `TYPES.map((t) => ...)` の 4 ペイン。各ペインは `grouped[t].map((it) => <div className="schema-field-card diff-{type}">...)`。
  - カード内: Chip + `<button onClick={() => onSelect(it)} aria-pressed={active?.diffId === it.diffId}>{it.label}</button>` + `questionId:` 行 + `STATUS_LABELS[it.status]`。
  - **割当フォームは `.schema-grid` の後**（`{active && active.questionId && (<form onSubmit={onSubmit} aria-label="stableKey alias 割当">...)}`）。`<h3>{active.label}</h3>`, `questionId: <code>`, `FormField name="schema-stableKey" label="新しい stableKey"`, `<Input ref=stableKeyInputRef pattern="[A-Za-z][A-Za-z0-9_]*">`, hint `id="schema-alias-stableKey-hint"`「英字で始まり、英数字と _ のみ使用できます。」, `<button type="submit">割当</button>`, `<button type="button" onClick={() => setActive(null)}>閉じる</button>`。
  - `active && !active.questionId` のとき: `<p role="alert">この diff には questionId がないため alias 割当はできません。</p>`。
- state: `active`（選択中 diff）, `stableKey`, `busy`, `feedback`, bulk/rollback/undo/recompute 各種。
- `onSelect(it)` は `setActive(it)` + `setStableKey(suggested ?? stableKey ?? "")` + `setFeedback(null)`。
- `useEffect([active])` で `active.questionId` あれば `stableKeyInputRef.current?.focus()`。
- bulk resolve（`SchemaDiffBulkResolveModal`）/ rollback / undo（`UndoToast`）/ recompute（`postRollbackRecompute`）/ `HistoryPane`（resolve 履歴）は**動作ロジック不変**。
- API: `useAdminMutation("/api/admin/schema/aliases","POST")` 経由 `postSchemaAlias`。HTTP 202 retryable continuation 分岐あり（変更禁止）。

### `apps/web/app/(admin)/admin/schema/page.tsx`（173 行・既存）

- `AdminPageHeader`（eyebrow="ADMIN / SCHEMA", title="スキーマ差分のレビュー", description="Googleフォームの設問変更を照合し、stableKey の割り当てと履歴確認を行います。"）。
- `CurrentRevisionCard` / `SchemaDiffStatsGrid`（Unresolved/Added/Changed/Removed の `AdminStat`）/ `<SchemaDiffPanel initial={...} hideInlineStats />` / `RevisionAndAliasHistory`。
- `safeServerFetch<FullDiff>("/admin/schema/diff")`。
- `dynamic = "force-dynamic"`。

### CSS: `apps/web/src/styles/globals.css`

- 既存セレクタ: `.schema-grid`（L1425）, `.schema-field-card`（L1431）, `.schema-field-card.diff-added`（L1443）, `.diff-changed`/`.diff-unresolved`（L1447-48）, `.diff-removed`（L1452）。
- 色は `apps/web/src/styles/tokens.css` の `var(--ubm-color-*)` を参照（例 `--ubm-color-surface-panel`, `--ubm-color-text-secondary`, `--ubm-color-accent`, `--ubm-color-link-default`）。**新規 CSS で raw HEX / `#xxx` を書かない**（`verify-design-tokens` gate）。

---

## 2. 確定実装設計（全 Lane 共通の正本）

### 新規ファイル

#### A) `apps/web/src/components/admin/schemaReviewTerms.ts`（純データ SSOT + ヘルパ）

```ts
export interface SchemaReviewTerm {
  /** 技術名（コード/API 上の語） */
  technical: string;
  /** やさしい日本語の主ラベル */
  plain: string;
  /** 一文の平易な説明（「何のためか」を先に） */
  description: string;
}

// key は technical 名（小文字 or キャメル原文）。UI から technical 名で引く。
export const SCHEMA_REVIEW_TERMS: Record<string, SchemaReviewTerm> = {
  stableKey:   { technical: "stableKey",   plain: "永続的な名前",       description: "フォームの設問が文言変更されても変わらない、設問を一意に識別するための名前です。" },
  questionId:  { technical: "questionId",  plain: "設問の元ID",         description: "Googleフォーム側が設問に自動で振る識別子です。文言を変えると変わることがあります。" },
  alias:       { technical: "alias",       plain: "名前の対応づけ",     description: "設問の元IDに永続的な名前を結びつけた対応関係です。" },
  resolve:     { technical: "resolve",     plain: "名前を割り当てる",   description: "新しい設問に永続的な名前をつけて、過去の回答と新しい設問を対応づける操作です。" },
  unresolved:  { technical: "unresolved",  plain: "名前が未割当",       description: "まだ永続的な名前がついていない設問です。割り当てると過去回答と繋がります。" },
  added:       { technical: "added",       plain: "新しく増えた設問",   description: "前回との比較で新しく追加された設問です。" },
  changed:     { technical: "changed",     plain: "文言や型が変わった設問", description: "前回から文言や回答形式が変わった設問です。" },
  removed:     { technical: "removed",     plain: "なくなった設問",     description: "前回はあったが今回なくなった設問です。" },
  revision:    { technical: "revision",    plain: "取り込んだ版",       description: "ある時点で取り込んだフォーム構成のバージョンです。" },
  backfill:    { technical: "backfill",    plain: "過去回答への反映",   description: "割り当てた名前を、過去の回答データへさかのぼって反映する処理です。" },
  recompute:   { technical: "recompute",   plain: "再集計",             description: "取り消し後にデータの対応づけを計算し直す処理です。" },
  rollback:    { technical: "rollback",    plain: "割り当ての取り消し", description: "一度割り当てた名前を元に戻す操作です。" },
};

/** technical 名から「やさしい日本語（技術名: xxx）」形式の主ラベルを返す。未登録は technical をそのまま返す。 */
export function plainLabel(technical: string): string { /* 例: `${plain}（技術名: ${technical}）` / 未登録は technical */ }

/** technical 名から平易な一文説明を返す。未登録は空文字。 */
export function termDescription(technical: string): string { /* 未登録は "" を返す（防御的・例外を投げない） */ }
```

- **設計原則**: lookup は登録キーのみ。未登録 technical 名は `plainLabel` で原文を保持し、`termDescription` は空文字を返す（例外を投げない・WEEKGRD-02 純粋関数ガード方針）。

#### B) `apps/web/src/components/admin/SchemaReviewGuide.tsx`（目的説明・新規 client/server どちらでも可・props なし）

- ページ冒頭（`AdminPageHeader` の直後）に置く「このページでできること」セクション。
- 構成（プロトタイプ primitives のみ）:
  - `<section className="ui-card card-pad-lg" aria-labelledby="schema-guide-h">`
  - `eyebrow`「このページでできること」+ `<h2 id="schema-guide-h" className="h-section">` 例「フォームの設問変更を、過去データと繋げて整理します」
  - **3 ステップの流れ**（番号付き・`data-component="schema-review-guide-flow"`）:
    1. フォームの設問が増減・変更されたことを自動で見つけます
    2. 新しい設問に「永続的な名前」を割り当てます（技術名: stableKey）
    3. 割り当てると、過去の回答が新しい設問に自動で対応づきます
  - **用語ミニ集**（`SCHEMA_REVIEW_TERMS` から主要 4-6 語を `dl`/chip で表示・`data-component="schema-review-glossary"`）。
- 文言のみ。操作ロジックなし。

### 修正ファイル

#### C) `apps/web/src/components/admin/SchemaDiffPanel.tsx`

1. **割当フォームをインライン化**: 現在 `.schema-grid` の後にある `<form>` を、各カードの `grouped[t].map((it) => ...)` 内、当該カード `<div className="schema-field-card ...">` の**直下**に `{active?.diffId === it.diffId && active.questionId && (<form ...>)}` として描画する。`.schema-grid` 後の旧フォームブロックは削除。`active && !active.questionId` の alert もカード直下に移す（または当該カード直下に出す）。
   - フォーム JSX とハンドラ（`onSubmit`, `stableKey`, `busy`, `feedback`, `stableKeyInputRef`, validation）は**現行のものを再利用**。位置だけ移動。
   - インラインフォームは `data-component="schema-assign-inline-form"` を付け、`active.diffId` に紐づくことをテスト可能にする。
2. **文脈ヘルプ追加**（やさしい用語・`schemaReviewTerms` 利用）:
   - インラインフォーム冒頭に説明 `<p data-role="assign-help">この設問に永続的な名前（技術名: stableKey）をつけると、過去のフォーム回答が新しい設問に自動で対応づきます。</p>`。
   - `FormField` の label を「新しい stableKey」→「新しい永続的な名前（技術名: stableKey）」。hint 文はそのまま（pattern 説明）。
   - 送信ボタン「割当」→「名前を割り当てる」。`閉じる` は維持。
   - Bulk Resolve トグル付近に補助 `<p>` 「複数の設問にまとめて名前を割り当てられます」。
   - `HistoryPane` 見出し付近に補助文「割り当て済みの記録です。必要に応じて取り消せます。」。
3. **ペイン見出しの補強**: `<h2 id={pane-${t}}>{TYPE_LABELS[t]}</h2>` の直下に各ペインの平易な一文（`termDescription(t)`）を `<p className="muted">` で表示。`unresolved` ペインは特に「名前が未割当の設問。割り当てると過去回答と繋がります」。
4. **挙動・機械可読属性は不変**: `data-testid` / `aria-label`（`select diff ${questionId}` 等）/ bulk・rollback・recompute の各 id・role・API contract は変更しない。表示テキストと配置と補助 `<p>` の追加のみ。

> 注意: 既存テスト（`SchemaDiffPanel.component.spec.tsx`）がフォームをパネル末尾から query している場合、インライン化で DOM 位置が変わる。Lane C（Phase 4/6）でテストを「クリックしたカードの**直下**にフォームが出る」検証へ更新する。

#### D) `apps/web/app/(admin)/admin/schema/page.tsx`

- `import { SchemaReviewGuide } from "../../../../src/components/admin/SchemaReviewGuide";`
- `result.ok` ブロックの先頭（`<CurrentRevisionCard ...>` の前）に `<SchemaReviewGuide />` を挿入。
- `AdminPageHeader` の `description` を平易化: 「Googleフォームの設問が増減・変更されたとき、新しい設問に永続的な名前をつけて、過去の回答と繋がりを保つ作業をします。」
- 「resolve 履歴を見る」リンク文言は維持（または「割り当ての履歴を見る」へ・テキストのみ）。

#### E) `apps/web/src/styles/globals.css`

- 追記（`var(--ubm-color-*)` のみ・HEX 禁止）:
  - `.schema-assign-inline-form`（カード直下のインラインフォーム枠・余白・左罫線で親カードとの従属を視覚化）
  - `.schema-review-guide-flow`（番号付きステップの縦並び/装飾）
  - `.schema-review-glossary`（用語ミニ集の `dl`/chip レイアウト）
  - `[data-role="assign-help"]` 等のヘルプ文の muted 文字色（`var(--ubm-color-text-secondary)`）
- 既存 `.schema-grid` / `.schema-field-card` は壊さない（追記のみ）。

### テストファイル（Lane C 設計・本 waveで実行済み）

- `apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts`（新規）: `plainLabel`/`termDescription` の登録キー・未登録キー（防御値）・全 12 語の整合。
- `apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx`（新規）: 3 ステップ見出し・用語ミニ集・`data-component` の存在。
- `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`（既存に追加）: (a) カードのラベルクリックでフォームが**当該カード直下**（`data-component="schema-assign-inline-form"` が当該 `schema-field-card` の子孫）に出る (b) 文脈ヘルプ `assign-help` 表示 (c) 「名前を割り当てる」ボタン文言 (d) 既存 bulk/rollback/undo の動作は不変（回帰）。

---

## 3. テスト・検証コマンド（本 wave 実行結果）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
mise exec -- pnpm verify:tokens   # HEX 直書き 0 を確認
git diff --quiet -- apps/api             # apps/api 非接触（exit 0 期待）
```

DoD（Definition of Done・local evidence）:
- targeted Vitest 3 files / 36 tests PASS。
- `@ubm-hyogo/web` typecheck PASS。
- `verify-design-tokens` 9 tests PASS（HEX 直書き 0）。
- `git diff --quiet -- apps/api` exit 0。
- staging `/admin/schema` で (1) カードクリックで直下にフォーム展開 (2) やさしい用語表示 (3) 目的説明表示 を目視確認する runtime visual は user-gated。

---

## 4. implemented_local_evidence_captured の Phase 読み替え（重要）

本タスクは**local evidence capturedでは閉じない**。CONST_004/005 と task-specification-creator の同一 cycle 実装原則に従い、apps/web 実コード・focused tests・Phase 12 strict outputs・aiworkflow 正本同期まで同一 wave で完了した。

- Phase 4（テスト作成）= 追加テスト 2 件 + 既存 `SchemaDiffPanel` 回帰テスト更新を実装済み。
- Phase 5（実装）= `schemaReviewTerms.ts` / `SchemaReviewGuide.tsx` 新規、`SchemaDiffPanel.tsx` / `page.tsx` / `globals.css` 修正済み。
- Phase 6-9 = focused tests / typecheck / design tokens / apps-api non-touch を local evidence として確認済み。
- Phase 10 = AC-1〜AC-9 は local evidence で PASS、staging visual のみ Gate-C user-gated。
- Phase 11 = local focused evidence captured。VISUAL_ON_EXECUTION の staging screenshots は user-gated で pending。
- Phase 13 = commit / push / PR はユーザー承認待ち。

---

## 5. 受入条件（AC）

| AC | 内容 |
|----|------|
| AC-1 | 差分カードのラベルクリックで、割当フォームが**当該カード直下にインライン展開**する（最下部から移動） |
| AC-2 | 割当フォーム内に「割り当てると過去回答が新設問に対応づく」旨の文脈ヘルプが表示される |
| AC-3 | 専門用語が「やさしい日本語（技術名: xxx）」形式で表示される（stableKey 等） |
| AC-4 | ページ冒頭に「何ができるか」の目的説明（3 ステップの流れ + 用語ミニ集）が表示される |
| AC-5 | 各差分ペイン（追加/変更/削除/名前が未割当）に平易な一文説明が付く |
| AC-6 | bulk resolve / rollback / undo / recompute / HTTP 202 retryable の**動作・API contract・機械可読 id** は不変 |
| AC-7 | 色は `var(--ubm-color-*)` のみ（HEX 直書き 0・`verify:tokens` PASS） |
| AC-8 | `apps/api` 非接触（`git diff --quiet -- apps/api` exit 0）。新 endpoint / D1 / Form 変更なし |
| AC-9 | `SchemaDiffPanel` / `SchemaReviewGuide` は `page.tsx` 以外から import されない（不変条件 #14） |

---

## 6. CI gate / artifacts 制約（SubAgent は触らないが理解する）

- gate-metadata: gates は zod schema 準拠。pending gate は `passed_at: null` 必須、passed gate は `passed_at` ISO datetime + evidence_path 実在。
- phase12-compliance: `outputs/phase-12/phase12-task-spec-compliance-check.md` に canonical 9 見出し（逐語・`workflow_state` はバッククォート込み）+ `## 4. Phase 11 evidence file inventory` に `| Classification | Path | Status |` 表（implemented_local_evidence_captured は `| manual test result | outputs/phase-11/manual-test-result.md | n/a |`）。
- これらは**オーケストレータが Phase 12 で執筆**。SubAgent（Phase 4-11）は `outputs/phase-N/phase-N.md`（+ Phase 11 は `manual-test-result.md`）のみ書く。
