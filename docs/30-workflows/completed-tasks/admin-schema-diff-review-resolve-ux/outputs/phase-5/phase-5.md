# Phase 5: 実装（手順・差分方針の記述） — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書 / implemented_local_evidence_captured]`

> 本 Phase は **実装手順・差分方針を記述**する。コードは実装済み・テスト実行・commit もしない（実装は本 wave で完了）。
> 各手順・各判定行に状態 suffix `implemented_local_evidence_captured` を付す。

---

## 0. 新規/修正ファイル一覧表（Feedback RT-03・見落とし防止）

shared-context §2 のファイル表をそのまま実装手順へ展開する。

| # | ファイル | 種別 | Lane | 役割 | 状態 |
|---|---------|------|------|------|------|
| A | `apps/web/src/components/admin/schemaReviewTerms.ts` | 新規 | A | 技術名→やさしい日本語 SSOT 純データ + `plainLabel` / `termDescription` | `implemented_local_evidence_captured` |
| B | `apps/web/src/components/admin/SchemaReviewGuide.tsx` | 新規 | B | ページ冒頭の目的説明（3 ステップ + 用語ミニ集・props なし） | `implemented_local_evidence_captured` |
| C | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | A | 割当フォームのインライン化・文脈ヘルプ・ペイン平易化 | `implemented_local_evidence_captured` |
| D | `apps/web/app/(admin)/admin/schema/page.tsx` | 編集 | B | `SchemaReviewGuide` 統合・description 平易化 | `implemented_local_evidence_captured` |
| E | `apps/web/src/styles/globals.css` | 編集 | C | インラインフォーム/guide/glossary/help スタイル追記（`var(--ubm-color-*)` のみ） | `implemented_local_evidence_captured` |
| T1 | `apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts` | 新規 | C | Phase 4 §2 のケース | `implemented_local_evidence_captured` |
| T2 | `apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx` | 新規 | C | Phase 4 §3 のケース | `implemented_local_evidence_captured` |
| T3 | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 編集 | C | Phase 4 §4 のケース（追加 + 既存セレクタ追従） | `implemented_local_evidence_captured` |

---

## 1. ファイル A: `schemaReviewTerms.ts`（新規・純データ SSOT + ヘルパ）

- **対象**: 新規ファイル `apps/web/src/components/admin/schemaReviewTerms.ts`
- **変更種別**: 新規作成（副作用なし純モジュール・client/server 両用可）
- **具体的差分方針** `implemented_local_evidence_captured`:
  1. `export interface SchemaReviewTerm { technical: string; plain: string; description: string; }` を定義（shared-context §2-A 逐語）。
  2. `export const SCHEMA_REVIEW_TERMS: Record<string, SchemaReviewTerm>` を **12 語**で定義。各エントリは shared-context §2-A の表を**逐語**で写す（key = technical 名）:
     - `stableKey`: plain `永続的な名前` / description `フォームの設問が文言変更されても変わらない、設問を一意に識別するための名前です。`
     - `questionId`: plain `設問の元ID` / description `Googleフォーム側が設問に自動で振る識別子です。文言を変えると変わることがあります。`
     - `alias`: plain `名前の対応づけ` / description `設問の元IDに永続的な名前を結びつけた対応関係です。`
     - `resolve`: plain `名前を割り当てる` / description `新しい設問に永続的な名前をつけて、過去の回答と新しい設問を対応づける操作です。`
     - `unresolved`: plain `名前が未割当` / description `まだ永続的な名前がついていない設問です。割り当てると過去回答と繋がります。`
     - `added`: plain `新しく増えた設問` / description `前回との比較で新しく追加された設問です。`
     - `changed`: plain `文言や型が変わった設問` / description `前回から文言や回答形式が変わった設問です。`
     - `removed`: plain `なくなった設問` / description `前回はあったが今回なくなった設問です。`
     - `revision`: plain `取り込んだ版` / description `ある時点で取り込んだフォーム構成のバージョンです。`
     - `backfill`: plain `過去回答への反映` / description `割り当てた名前を、過去の回答データへさかのぼって反映する処理です。`
     - `recompute`: plain `再集計` / description `取り消し後にデータの対応づけを計算し直す処理です。`
     - `rollback`: plain `割り当ての取り消し` / description `一度割り当てた名前を元に戻す操作です。`
  3. `export function plainLabel(technical: string): string`:
     - 登録キーなら `` `${term.plain}（技術名: ${term.technical}）` `` を返す（全角括弧 U+FF08/U+FF09・`技術名:` は半角コロン+半角スペース）。
     - **未登録は `technical` を原文返却**（例外を投げない・WEEKGRD-02 純粋関数ガード）。
  4. `export function termDescription(technical: string): string`:
     - 登録キーなら `term.description` を返す。
     - **未登録は `""`（空文字）を返す**（例外を投げない・防御的）。
  5. import 副作用・I/O・乱数なし（決定的純関数）。

---

## 2. ファイル B: `SchemaReviewGuide.tsx`（新規・目的説明）

- **対象**: 新規ファイル `apps/web/src/components/admin/SchemaReviewGuide.tsx`
- **変更種別**: 新規作成（**props なし**・プロトタイプ primitive のみ・新規 primitive を生やさない / 不変条件 #9）
- **具体的差分方針** `implemented_local_evidence_captured`:
  1. ルート: `<section className="ui-card card-pad-lg" aria-labelledby="schema-guide-h">`。
  2. eyebrow: `<p className="eyebrow">このページでできること</p>`（既存 primitive クラス）。
  3. 見出し: `<h2 id="schema-guide-h" className="h-section">フォームの設問変更を、過去データと繋げて整理します</h2>`。
  4. **3 ステップの流れ**（`<ol data-component="schema-review-guide-flow" className="schema-review-guide-flow">`・番号付き）:
     1. `フォームの設問が増減・変更されたことを自動で見つけます`
     2. `新しい設問に「永続的な名前」を割り当てます（技術名: stableKey）`
     3. `割り当てると、過去の回答が新しい設問に自動で対応づきます`
  5. **用語ミニ集**（`<dl data-component="schema-review-glossary" className="schema-review-glossary">`）:
     - 主要 4-6 語（最低 `stableKey` / `resolve` / `unresolved` / `questionId`）を `SCHEMA_REVIEW_TERMS` から取り、`<dt>{plainLabel(key)}</dt><dd>{termDescription(key)}</dd>` で表示（SSOT 連動・ハードコード禁止）。
     - import: `import { SCHEMA_REVIEW_TERMS, plainLabel, termDescription } from "./schemaReviewTerms";`。
  6. **文言のみ**。state / 副作用 / mutation / fetch なし。

---

## 3. ファイル C: `SchemaDiffPanel.tsx`（編集・インライン化 + 文脈ヘルプ + ペイン平易化）

- **対象**: `apps/web/src/components/admin/SchemaDiffPanel.tsx`（1049 行・既存）
- **変更種別**: 編集（**描画位置の移動 + 表示テキスト変更 + 補助 `<p>` 追加のみ**。ハンドラ・state・機械可読 id・API contract は不変）
- **import 追加**: `import { plainLabel, termDescription } from "./schemaReviewTerms";` `implemented_local_evidence_captured`

### 3.1 割当フォームのインライン化（AC-1）`implemented_local_evidence_captured`

1. 現在 `.schema-grid` の**後**にある割当フォームブロック（`{active && active.questionId && (<form aria-label="stableKey alias 割当">...)}` と `active && !active.questionId` の `<p role="alert">`）を**削除**する。
2. 削除したフォーム JSX を、各ペインの `grouped[t].map((it) => ...)` 内、当該カード `<div className="schema-field-card diff-...">` の**末尾子要素**として条件描画へ移設:
   ```
   {active?.diffId === it.diffId && active.questionId && (
     <div data-component="schema-assign-inline-form" className="schema-assign-inline-form"> … 移設したフォーム … </div>
   )}
   {active?.diffId === it.diffId && !active.questionId && (
     <p role="alert"> … alias 割当はできません … </p>
   )}
   ```
3. **フォーム内 JSX とハンドラは現行を完全再利用**（`onSubmit` / `stableKey` state / `busy` / `feedback` / `stableKeyInputRef` / `isValidStableKey` / `describedBy` / hint `id="schema-alias-stableKey-hint"` / validation feedback `schema-alias-validation-feedback`）。**配置だけ移動**。
4. form 要素の `aria-label="stableKey alias 割当"` は**維持**（機械可読属性不変・AC-6）。`data-component="schema-assign-inline-form"` を付与してカード子孫であることをテスト可能にする。
5. `useEffect([active])` の focus（`active.questionId` あれば `stableKeyInputRef.current?.focus()`）は**維持**（インライン化後も focus）。

### 3.2 文脈ヘルプ（AC-2）`implemented_local_evidence_captured`

1. インラインフォーム冒頭に説明文を追加:
   `<p data-role="assign-help">この設問に永続的な名前（技術名: stableKey）をつけると、過去のフォーム回答が新しい設問に自動で対応づきます。</p>`
2. Bulk Resolve トグル付近に補助文 `<p>複数の設問にまとめて名前を割り当てられます</p>` を追加（既存トグル動作は不変）。
3. `HistoryPane` 見出し付近に補助文 `<p>割り当てを取り消した記録です</p>` を追加（既存履歴動作は不変）。

### 3.3 やさしい用語（AC-3）`implemented_local_evidence_captured`

1. `FormField` の label を `新しい stableKey` → `新しい永続的な名前（技術名: stableKey）` へ変更（`plainLabel("stableKey")` 由来でも直書きでも整合させる。テスト TC-PANEL-HELP-02 は `/新しい永続的な名前/` で query）。
2. hint 文（pattern 説明「英字で始まり、英数字と _ のみ使用できます。」）は**そのまま維持**。
3. 送信ボタン文言 `割当` → `名前を割り当てる`（AC-3 / TC-PANEL-BTN-01）。`閉じる` ボタン文言は**維持**。

### 3.4 ペイン平易説明（AC-5）`implemented_local_evidence_captured`

1. 各ペイン見出し `<h2 id={\`pane-${t}\`}>{TYPE_LABELS[t]}</h2>` の**直下**に `<p className="muted">{termDescription(t)}</p>` を追加。
   - `t` は `"added" | "changed" | "removed" | "unresolved"`。`termDescription("unresolved")` 等が `SCHEMA_REVIEW_TERMS` に存在するため一文説明が出る。
   - `unresolved` ペインは特に「名前が未割当の設問です。割り当てると過去回答と繋がります。」（= `SCHEMA_REVIEW_TERMS.unresolved.description`）が表示される。

### 3.5 不変項目（AC-6 / 厳守）`implemented_local_evidence_captured`

- `data-testid`（`bulk-selection-summary`, `bulk-resolve-modal`, `bulk-rollback-selection-summary`, `bulk-rollback-modal` 等）・`aria-label`（`select diff ${questionId}`, `全選択 未解決`, `alias ... の resolve を取り消す`, `alias ... の割当を取消す` 等）・`data-role`（`recompute-trigger` / `recompute-status` / `recompute-error` / `modal-error` 等）・`data-component="undo-toast"` は**一切 rename しない**。
- bulk resolve / rollback / undo / recompute / HTTP 202 retryable continuation の**動作ロジック・分岐・API contract**（`postSchemaAlias` payload `{ diffId, questionId, stableKey }` 等）は不変。
- 追加するのは **表示テキスト変更・配置移動・補助 `<p>` の追加**のみ。

---

## 4. ファイル D: `page.tsx`（編集・guide 統合 + description 平易化）

- **対象**: `apps/web/app/(admin)/admin/schema/page.tsx`（173 行・既存）
- **変更種別**: 編集（import 追加 + JSX 1 行挿入 + 文字列 1 箇所変更）
- **具体的差分方針** `implemented_local_evidence_captured`:
  1. import 追加: `import { SchemaReviewGuide } from "../../../../src/components/admin/SchemaReviewGuide";`（相対パスは既存の `SchemaDiffPanel` import 規約に合わせる・不変条件 #14 で `page.tsx` から import）。
  2. `result.ok` ブロックの**先頭**（`<CurrentRevisionCard ...>` の前）に `<SchemaReviewGuide />` を挿入。
  3. `AdminPageHeader` の `description` を平易化:
     `Googleフォームの設問が増減・変更されたとき、新しい設問に永続的な名前をつけて、過去の回答と繋がりを保つ作業をします。`
  4. `eyebrow="ADMIN / SCHEMA"` / `title="スキーマ差分のレビュー"` は維持。「resolve 履歴を見る」リンクは維持（または「割り当ての履歴を見る」へ・テキストのみ・任意）。

---

## 5. ファイル E: `globals.css`（編集・スタイル追記）

- **対象**: `apps/web/src/styles/globals.css`
- **変更種別**: 編集（**追記のみ**・既存 `.schema-grid` / `.schema-field-card` は非破壊）
- **具体的差分方針**（`var(--ubm-color-*)` のみ・**raw HEX / `#xxx` / `bg-[#...]` 禁止** / AC-7）`implemented_local_evidence_captured`:
  1. `.schema-assign-inline-form`: カード直下のインラインフォーム枠。親カードとの従属を視覚化するため**左罫線**（`border-left: ... var(--ubm-color-border-*)` 系）+ 内側余白 + 背景（`var(--ubm-color-surface-panel-2)` 等）+ 上方向マージンでカード本文と分離。
  2. `.schema-review-guide-flow`: 番号付きステップの縦並び（`<ol>`）。番号装飾・行間・`var(--ubm-color-text-secondary)` 等の文字色。
  3. `.schema-review-glossary`: 用語ミニ集（`<dl>`）。`<dt>` 強調・`<dd>` muted（`var(--ubm-color-text-secondary)`）・行間レイアウト。既存 chip token を流用してよい。
  4. `[data-role="assign-help"]`（および補助 `<p>` / `p.muted`）: ヘルプ文の muted 文字色 `var(--ubm-color-text-secondary)`・小さめ字間。
  - すべて既存 token の参照のみ。新規 token・新規 HEX は追加しない。

---

## 6. テストファイル T1-T3（実装手順・本 waveで実行済み）`implemented_local_evidence_captured`

- T1 `schemaReviewTerms.spec.ts`: Phase 4 §2 の TC-TERMS-01..10 を実装（新規）。
- T2 `SchemaReviewGuide.spec.tsx`: Phase 4 §3 の TC-GUIDE-01..08 を実装（新規）。
- T3 `SchemaDiffPanel.component.spec.tsx`: Phase 4 §4.1/§4.2 の新規ケース追加 + §4.3 の既存セレクタ追従（`/新しい stableKey/` → `/新しい永続的な名前/`、`"割当"` → `"名前を割り当てる"`、form は role 取得維持 + カード子孫検証の二段構え）。

---

## 7. DoD（Definition of Done・shared-context §3・本 wave 用）

| # | 項目 | 判定方法 | 状態 |
|---|------|---------|------|
| DoD-1 | typecheck clean | `pnpm --filter @ubm-hyogo/web typecheck` exit 0 | `implemented_local_evidence_captured` |
| DoD-2 | lint clean | `pnpm lint` exit 0 | `implemented_local_evidence_captured` |
| DoD-3 | targeted vitest PASS | 下記 3 spec が全 PASS（新規 + 回帰） | `implemented_local_evidence_captured` |
| DoD-4 | design-tokens HEX 0 | `pnpm verify:tokens` で HEX 直書き 0（AC-7） | `implemented_local_evidence_captured` |
| DoD-5 | apps/api 非接触 | `git diff --quiet -- apps/api` exit 0（AC-8） | `implemented_local_evidence_captured` |
| DoD-6 | import 境界 | `SchemaDiffPanel` / `SchemaReviewGuide` が `page.tsx` 以外から import されない（不変条件 #14 / AC-9） | `implemented_local_evidence_captured` |
| DoD-7 | staging 目視 3 点 | (1) カードクリックで直下にフォーム展開 (2) やさしい用語表示 (3) 目的説明表示（screenshot は user-gated） | `implemented_local_evidence_captured` |

---

## 8. 検証コマンドブロック（本 wave で実行）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
mise exec -- pnpm verify:tokens   # HEX 直書き 0 を確認（AC-7）
git diff --quiet -- apps/api             # apps/api 非接触（exit 0 期待・AC-8）
```

> staging `/admin/schema` の目視 3 点と screenshot 取得は **user-gated**（local evidence captured のため本 wave では取得しない・Phase 11 計画参照） `implemented_local_evidence_captured`。

---

## 完了条件

- [x] 新規/修正ファイル一覧表（A-E + T1-T3）を提示した（Feedback RT-03）`implemented_local_evidence_captured`
- [x] ファイル A `schemaReviewTerms.ts` の interface / 12 語逐語 / `plainLabel` / `termDescription`（未登録防御）手順を記述した `implemented_local_evidence_captured`
- [x] ファイル B `SchemaReviewGuide.tsx` の section 構成 / 3 ステップ / 用語ミニ集 / props なしを記述した `implemented_local_evidence_captured`
- [x] ファイル C `SchemaDiffPanel.tsx` のインライン化（カード直下移設）/ 旧ブロック削除 / 文脈ヘルプ `assign-help` / label・ボタン文言 / ペイン平易説明 / **機械可読 id・API contract 不変**を記述した `implemented_local_evidence_captured`
- [x] ファイル D `page.tsx` の import / `result.ok` 先頭挿入 / description 平易化を記述した `implemented_local_evidence_captured`
- [x] ファイル E `globals.css` の 4 セレクタ追記（`var(--ubm-color-*)` のみ・HEX 禁止）を記述した `implemented_local_evidence_captured`
- [x] DoD（typecheck/lint/vitest/design-tokens/apps-api 非接触/import 境界/staging 目視）を定義した `implemented_local_evidence_captured`
- [x] 検証コマンドブロックを明記した（本 waveで実行済み）`implemented_local_evidence_captured`
