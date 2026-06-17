# Phase 1 — spec-extraction-map（ユーザー要望 → 真因 → AC → 変更ファイル）

> ユーザー要望（staging UI/UX 観察起点）を、真因 R-1〜R-5・受入条件 AC・変更ファイルへ 1:1 でトレースする。
> 「どの不満を、どの真因の解消で、どの AC として、どのファイルで満たすか」を Phase 2 設計の入力として固定する。

## A. ユーザー要望 → 真因 → AC → 変更ファイル（トレース表）

| ユーザー要望 | 真因（`_shared-context.md` §2） | 対応 AC | 変更ファイル（concern） |
| --- | --- | --- | --- |
| 「フィルタの項目名が英語で分からない」 | **R-1**: `AuditLogPanel.tsx` の `FormField` `label` に技術キー（`action` / `actorEmail` / `targetType` / `targetId` / `from (JST)` / `to (JST)` / `batchId` / `limit`）を直接渡している | AC-1 | `AuditLogPanel.tsx`（C2）+ `auditGlossary.ts`（C1: `AUDIT_FIELD_LABELS` / `describeAuditField`） |
| 「適用中の絞り込みタグが英語」 | **R-2**: `auditAppliedFilters.ts` の `chips.push({ label: "action", ... })` 等が英語ラベル固定 | AC-4 | `auditAppliedFilters.ts`（C1: describe helper 経由） |
| 「操作の名前がコードのまま（`attendance.add` 等）で意味不明」 | **R-3**: `AuditLogCard.tsx` が `item.action` / `item.targetType` を変換なしで生表示。datalist プリセットも生コード | AC-3 | `AuditLogCard.tsx`（C1/C3）+ `auditGlossary.ts`（C1: `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS`） |
| 「`auditId` や `batch-id (uuid)` 等の英語表記が分かりにくい」 | **R-4**: `AuditLogCard.tsx` の `auditId` ラベル生表示 + datalist placeholder が英語キー丸出し | AC-5 | `AuditLogCard.tsx`（C1/C3）+ `AuditLogPanel.tsx`（C2: placeholder 日本語化） |
| 「カードがくっつく/はみ出す・フィルタ項目が多すぎて初見で迷う」 | **R-5**: `.chip-row`（wrap 未指定）/ `.admin-audit-glossary`（minmax 不均等）/ `.admin-audit-card__meta`（幅不定 truncate）/ フィルタ 8 項目フラット | AC-2 / AC-7 | `globals.css`（C3: flex-wrap / grid 整列 / `.admin-audit-filter-advanced`）+ `AuditLogPanel.tsx`（C2: 2 層段階開示）+ `AuditPurposeGuide.tsx`（C3 軽微） |

## B. 横断 AC（要望に直接対応しないが守る条件）

| AC | 内容 | 守る anchor | 守り方 |
| --- | --- | --- | --- |
| AC-6 | `auditGlossary.ts` に 3 ラベルマップ + 3 describe helper（raw fallback） | `auditGlossary.ts` | C1 で SSOT 化。未登録コードは生コード fallback（情報欠落防止） |
| AC-8 | 全色 OKLch トークン経由・HEX ゼロ | `globals.css` / 各コンポーネント | `var(--ubm-color-*)` のみ。`verify-design-tokens` gate |
| AC-9 | API / D1 / Form / shared 型変更ゼロ・query param キー不変 | `apps/api` / `packages/shared` / `<input name>` | diff ゼロ。describe helper は表示専用。name 属性英語維持 |
| AC-10 | 新規 primitive 追加ゼロ | `apps/web/src/components/ui/` | 既存 `Card` / `FormField` / `Input` / `Select` / `Button` / `Chip` / native `<details>` のみ |
| AC-11 | アクセシビリティ維持 | `FormField` / `<details>` / 適用フィルタ | label 関連付け・キーボード操作・`aria-label` を維持 |
| AC-12 | 既存挙動温存 | 検索 / リセット / ページネーション / PII マスク / JSON 開示 / エラー文言 | 表現層のみ変更し挙動ロジックに触れない |

## C. system spec ↔ current code anchor（1:1 対応）

| system spec 正本 | 規定内容 | 対応 current anchor | 再構成方針 |
| --- | --- | --- | --- |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | OKLch token 値 JSON / HEX 禁止 | 全 `.admin-audit-*` / `.chip-row` クラス | 色は `var(--ubm-color-*)`、余白は `var(--ubm-space-*)`（AC-8） |
| `docs/00-getting-started-manual/specs/09c-primitives.md` | primitive catalog（`Card` / `FormField` / `Input` / `Select` / `Button` / `Chip`） | フィルタフォーム（`FormField`）/ 適用チップ（`Chip`）/ カード（`Card`） | 既存 primitive のみ再利用（AC-10）。`apps/web/src/components/ui/`（PascalCase パス） |
| audit endpoint surface（参照のみ） | query param キー（`action`/`actorEmail`/`targetType`/`targetId`/`from`/`to`/`batchId`/`cursor`/`limit`） | `AuditLogPanel.tsx` の `<input name>` / datalist `id` | キー名を変更しない。UI ラベルのみ日本語化（AC-1/AC-9） |

## D. 不変条件 ↔ anchor（守る場所）

| 不変条件 / AC | 守る anchor | 守り方 |
| --- | --- | --- |
| #5（D1 直接禁止） | `safeServerFetch` 経由のデータ取得 | D1 binding 不使用 |
| #8（test 命名） | `__tests__/*.spec.{ts,tsx}` | 新規 test は `*.spec.{ts,tsx}` のみ |
| #9（FormField 経由） | `AuditLogPanel.tsx` | 直接 `<input>` を増やさず `FormField` 維持 |
| ui-prototype #1 / AC-9 | `apps/api/` / `packages/shared/` | diff ゼロ。endpoint surface・query param キー不変 |
| ui-prototype #2 / AC-8 | `globals.css` / 各コンポーネント | `var(--ubm-color-*)` のみ。HEX ゼロ |
| ui-prototype #3 / AC-10 | `apps/web/src/components/ui/` | 新規 primitive ファイル追加ゼロ |

## E. パッケージ名・コマンド前提

| 項目 | 実値 |
| --- | --- |
| web パッケージ名 | `@ubm-hyogo/web`（`apps/web/package.json#name`） |
| token gate | `grep -rnE "#[0-9a-fA-F]{3,6}\|bg-\[#\|text-\[#" apps/web/src/components/admin apps/web/src/styles/globals.css` が 0 件 |
| vitest（対象限定） | `_shared-context.md` §9 のコマンド（4 spec をフルパス指定） |
| AC-9 diff gate | `git diff --name-only -- apps/api packages/shared` が空 |
