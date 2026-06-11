# Phase 1: 要件定義 — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書]`

## 1. タスク分類

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| タスク分類 | **UI task**（apps/web 表現層の情報設計 / UI 再構成） |
| visualEvidence | `VISUAL_ON_EXECUTION`（local evidence captured のため実 PNG は本 wave で取得） |
| implementation_mode | `new`（既存コンポーネントの構成変更 + 新規補助コンポーネント） |
| docs-only か | **No**（UI/UX 改善が目的でコード変更必須。CONST_004 デフォルトの実装仕様書） |

## 2. 主問題（1 文固定）

`/admin/schema`（スキーマ差分のレビュー）は機能・API が完成しているのに、**差分カードのラベルをクリックすると割当フォームが画面最下部の離れた位置に出る／専門用語が無説明／達成価値の文脈ヘルプが無い**ため、管理者が「何のためのページで、IDをクリックして下に出るものが何の役に立つのか」を理解できない。

> `what`: 差分レビューと stableKey 割り当ての操作 UX を直感化する。
> `how`: 割当フォームをクリックカード直下へインライン展開し、やさしい用語と文脈ヘルプ、ページ目的説明を追加する。
> `why now`: staging で実運用者（管理者）が操作意味を理解できず、スキーマ差分の解消が進まない。
> `why this way`: 機能は完成済みで API 変更は不要。真因は表現層の情報設計欠如なので、表現層のみの最小差分で解消できる。

## 3. スコープ

### 含む（apps/web 表現層のみ）

- 割当フォームのインライン展開化（`SchemaDiffPanel.tsx`）。
- 専門用語のやさしい日本語化 + 技術名併記（`schemaReviewTerms.ts` 新規 SSOT）。
- ページ冒頭の目的説明コンポーネント（`SchemaReviewGuide.tsx` 新規）と各操作の文脈ヘルプ。
- 上記のスタイル（`globals.css` 追記・OKLch token のみ）とテスト 3 ファイル。

### 含まない（明示的スコープ外）

- API / D1 schema / Google Form / endpoint surface の変更。
- bulk resolve / rollback / undo / recompute / HTTP 202 retryable continuation の**動作ロジック**変更。
- `SchemaDiffHistoryPanel`（`/admin/schema/history` 別ルート）の改修。
- 機械可読属性（`data-testid` / `aria-label` の id・role）の rename。

## 4. P50 前提確認チェック

| 確認項目 | 結果 |
|----------|------|
| current branch に実装が存在するか | **No** — 本タスクは新規 UI 再構成。通常の実装 Phase とする（実装は本 wave で完了） |
| upstream（dev）にマージ済みか | N/A（新規） |
| 前提タスク（依存タスク）が完了済みか | 依存なし。`/admin/schema` の機能・API は dev tip で完成済み（`SchemaDiffPanel.tsx` 1049 行 landed） |

> 関連: 別ブランチに未コミットの `admin-schema-page-purpose-clarity-ux`（ページ目的の説明 UI）が存在するが dev tip 未マージ。本タスクは **dev tip をベースライン**とし、差分レビュー操作 UX に焦点を当てる自己完結スコープ。重複回避のため、本タスクの目的説明は「差分レビュー操作の流れ」に特化し、汎用 page-purpose explainer の重複生成は避ける（命名も `SchemaReviewGuide` と差別化）。

## 5. 既存コードの命名規則（分析記録・FB-01/FB-SDK-07-4）

| 規則 | 実例 |
|------|------|
| コンポーネント | PascalCase `.tsx`（`SchemaDiffPanel`, `SchemaDiffBulkResolveModal`, `AdminPageHeader`） |
| 純データ/util | camelCase `.ts`（`schemaAliasValidation.ts`, `schema-diff-count.ts`） |
| テスト | `*.spec.ts(x)` のみ（不変条件 #8）。component test は `*.component.spec.tsx` |
| CSS クラス | kebab-case（`schema-field-card`, `schema-grid`, `diff-added`） |
| data 属性 | `data-component` / `data-role` / `data-testid` / `data-feedback-kind` |

> 新規命名はこの規則に整合: `SchemaReviewGuide.tsx`（Pascal）, `schemaReviewTerms.ts`（camel）, `.schema-assign-inline-form` / `.schema-review-guide-flow`（kebab）, `data-component="schema-assign-inline-form"`。

## 6. インベントリ（変更/新規ファイル）

| ファイル | 種別 | 役割 |
|----------|------|------|
| `apps/web/src/components/admin/schemaReviewTerms.ts` | 新規 | 技術名→やさしい日本語の SSOT 純データ + `plainLabel`/`termDescription` |
| `apps/web/src/components/admin/SchemaReviewGuide.tsx` | 新規 | ページ冒頭の目的説明（3 ステップ + 用語ミニ集） |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | 割当フォームのインライン化・文脈ヘルプ・ペイン平易化 |
| `apps/web/app/(admin)/admin/schema/page.tsx` | 編集 | `SchemaReviewGuide` 統合・description 平易化 |
| `apps/web/src/styles/globals.css` | 編集 | インラインフォーム/guide/glossary のスタイル追記（OKLch token のみ） |
| `apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts` | 新規 | 純データ/ヘルパのテスト |
| `apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx` | 新規 | guide のテスト |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 編集 | インライン展開・文脈ヘルプ・回帰のテスト |

## 7. targeted test 対象（FB-UI-02-2・メモリ制約対策）

全件 `pnpm test` ではなく、以下 3 ファイルを targeted run する（本 wave）:

```
apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts
apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx
apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
```

## 8. 受入条件（AC）

shared-context.md §5 の AC-1〜AC-9 を正本とする（本 Phase で確定）。

## 完了条件

- [x] タスク分類（UI task / 実装仕様書）を確定・記録した。
- [x] 主問題を 1 文で固定し、why now / why this way を仮説化した。
- [x] スコープ（含む/含まない）とインベントリを確定した。
- [x] 既存命名規則を分析し、新規命名の整合を確認した。
- [x] AC を shared-context へ確定リンクした。
