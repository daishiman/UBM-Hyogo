# Phase 7: カバレッジ

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)。対象範囲・関数シグネチャ・AC の正本は §5/§6/§8。

## 1. カバレッジ対象範囲の明示 [Feedback BEFORE-QUIT-002][Feedback 5]

本タスクは **apps/web 表現層 / adapter 層のみ**を変更する最小実装である。カバレッジは「本サイクルで新規作成・編集した関数 / ブロック」のみを対象とし、変更外ファイルは対象外と明記する。

### 1-1. カバレッジ対象（本サイクルで触れたもののみ）

| ID | 対象 | Lane | カバレッジ種別 | 検証 spec |
|----|------|------|----------------|-----------|
| COV-A1 | `AppliedFiltersZ`（`apps/web/src/lib/admin/api.ts` 行 582-592）の `batchId` 受理経路 | A | branch（batchId = string / null の双方が parse 成功） | `api.spec.ts` |
| COV-A2 | `SchemaAliasHistoryResponseZ.parse(projected)`（api.ts 行 704）が batchId 含む response を reject しないこと | A | line / branch（成功パス） | `api.spec.ts` |
| COV-A3 | `EMPTY_RESPONSE.appliedFilters.batchId = null`（`SchemaDiffHistoryPanel.tsx` 行 31-44）の型整合 | A | typecheck（`SchemaAliasHistoryResponse` 整合） | `pnpm typecheck` |
| COV-B1 | `formatSchemaHistoryError(e: unknown): string`（`schemaHistoryError.ts`）の全分岐 | B | **line 100% / branch 100%**（下表 1-2） | `schemaHistoryError.spec.ts` |
| COV-B2 | panel catch（`load` 行 80-81 / `onNext` 行 119-120）が `formatSchemaHistoryError(e)` を通すこと | B | branch（error state 経路） | `SchemaDiffHistoryPanel.component.spec.tsx` |
| COV-B3 | error 描画ブロック（行 185）に `.schema-history-error` class が付与されること | B | line（描画分岐 `error ? ... : null` の truthy） | `SchemaDiffHistoryPanel.component.spec.tsx` |
| COV-C1 | `SchemaHistoryPurposeExplainer` の描画（見出し / 1 文要約 / 流れ 3 ステップ / 用語集） | C | line（純表示の全要素） | `SchemaHistoryPurposeExplainer.component.spec.tsx` |
| COV-C2 | `schemaHistoryGlossary` / `schemaHistoryPurposeSteps`（純データ）の件数・形 | C | データ整合（用語 4 件 / 流れ 3 件） | `SchemaHistoryPurposeExplainer.component.spec.tsx` |
| COV-D1 | panel の card 分岐（行 187-224）: `displayItems.length === 0` → EmptyState / else → `.schema-history-card` リスト | D | branch（0 件 / 1 件以上の双方） | `SchemaDiffHistoryPanel.component.spec.tsx` |

### 1-2. `formatSchemaHistoryError` 全分岐の line / branch カバレッジ

> SSOT §6 のシグネチャを逐語で踏襲。4 分岐すべてを `schemaHistoryError.spec.ts` で保護する。

| 分岐 | 入力例 | 期待出力（逐語） | line | branch |
|------|--------|------------------|------|--------|
| ① `e instanceof ZodError` | `new ZodError([...])` | `"履歴データの形式が想定と一致しませんでした。時間をおいて再度お試しください。"` | covered | covered |
| ② `e instanceof Error` かつ `/HTTP\s*\d{3}/` | `new Error("HTTP 500")` | `"履歴の取得に失敗しました（サーバー応答エラー）。時間をおいて再度お試しください。"` | covered | covered |
| ③ `e instanceof Error`（HTTP コードなし） | `new Error("network down")` | `"履歴の取得に失敗しました。時間をおいて再度お試しください。"` | covered | covered |
| ④ 非 Error | `"raw string"` / `null` / `undefined` | `"履歴の取得に失敗しました。"` | covered | covered |

> branch 100% の要件: 分岐 ② は「`Error` だが HTTP コード非該当」=分岐 ③ への falsy 経路も必要なため、②③ を別 case で網羅する。分岐 ① の前段に ZodError を置くことで「ZodError は ① で捕捉され ②③④ に落ちない」順序も spec で固定する。

## 2. concern と dependency edge の coverage 可視化

> Phase 2 §1 のトポロジー（責務境界・状態所有権）に対応させ、各 concern と依存エッジが回帰で守られているかを可視化する。

### 2-1. concern 別

| concern（責務） | 所有 module | 状態 | カバー spec | カバレッジ |
|------------------|-------------|------|-------------|------------|
| zod parse 境界 | `api.ts`（`fetchSchemaAliasHistory`） | 無状態（schema 定義） | `api.spec.ts` | ✅ branch |
| 例外→日本語変換 | `schemaHistoryError.ts` | 純関数 | `schemaHistoryError.spec.ts` | ✅ line/branch 100% |
| 用語・流れデータ | `schemaHistoryGlossary.ts` | 純データ | `SchemaHistoryPurposeExplainer.component.spec.tsx` | ✅ データ整合 |
| 目的説明描画 | `SchemaHistoryPurposeExplainer.tsx` | 純表示 | `SchemaHistoryPurposeExplainer.component.spec.tsx` | ✅ line |
| フィルタ / 取得 / error state 所有 | `SchemaDiffHistoryPanel.tsx` | 状態所有者 | `SchemaDiffHistoryPanel.component.spec.tsx` | ✅ branch（error / card / explainer） |
| page mount（title/desc 平易化） | `history/page.tsx` | 無状態（Server Component） | `pnpm typecheck` + Phase 11 visual（user-gated） | ✅ 型 / 視覚 |

### 2-2. dependency edge 別（Phase 2 §1 のエッジ）

| エッジ | カバー手段 | 状態 |
|--------|------------|------|
| `page.tsx` → `SchemaDiffHistoryPanel` | typecheck（props 整合）+ Phase 11 visual | ✅ |
| `SchemaDiffHistoryPanel` → `SchemaHistoryPurposeExplainer` | `SchemaDiffHistoryPanel.component.spec.tsx`（`data-testid="schema-history-purpose-explainer"` 表示確認） | ✅ |
| `SchemaDiffHistoryPanel` → `schemaHistoryError`（catch 経由） | `SchemaDiffHistoryPanel.component.spec.tsx`（error 文言が日本語であることを確認） | ✅ |
| `SchemaHistoryPurposeExplainer` → `schemaHistoryGlossary` | `SchemaHistoryPurposeExplainer.component.spec.tsx`（用語 4 件 / 流れ 3 件描画） | ✅ |
| `SchemaDiffHistoryPanel` → `api.ts`（`fetchSchemaAliasHistory`） | `api.spec.ts`（batchId parse 回帰） | ✅ |

## 3. 変更外ファイル（カバレッジ対象外）

> 本サイクルで触れないため、カバレッジ目標・spec 追加の対象外と明記する（[Feedback 5] スコープ越境防止）。

- `apps/api/**`（API 無罪。`git diff origin/dev...HEAD -- apps/api` が空 = AC-9）
- `apps/api/migrations/**`（D1 schema 不変）
- `apps/web/src/lib/admin/api.ts` の `AppliedFiltersZ` 以外の既存 schema / helper（`normalizeAppliedFilters` 等。spread で全キー通過するため追加修正なし。回帰範囲外）
- `AdminPageHeader` / `EmptyState` / `Pagination` / `FormField` / `Input`（再利用のみ・改変なし）
- Google Form schema

## 4. カバレッジ判定基準

- `formatSchemaHistoryError`: **line / branch 100%**（4 分岐すべて）。
- `AppliedFiltersZ` の batchId 経路: string / null の両 branch が parse 成功すること。
- panel の error / card 分岐: error 表示（日本語 + `.schema-history-error`）と card / EmptyState の双方を描画 spec で確認。
- explainer: 流れ 3 ステップ + 用語集の描画を確認。
- 検証は SSOT §11 の対象 spec 群（`pnpm --filter @ubm-hyogo/web test --run ...`）で実行する。**新規追加分のみ**を coverage 評価対象とし、変更外ファイルの既存カバレッジ低下は本サイクルのスコープ外。
