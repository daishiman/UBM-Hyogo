# admin-schema-history-purpose-clarity-and-filter-fix

[実装区分: 実装仕様書]

> Source: staging 観察起点（ユーザー報告 2026-06-09 19:38）。relatedIssue = null。
> SSOT: [`shared-context.md`](./shared-context.md)（全 Phase / outputs はこれを正本とする）
> 実装区分: **実装仕様書**（CONST_005 必須項目すべてを含む / CONST_007 1サイクル完了スコープ）
> workflow_state: `implemented_local_evidence_captured`（apps/web 実装・focused evidence 完了。staging visual / commit / PR は user-gated）

## 概要

staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/schema/history`（「alias resolve 履歴」）で観測された 3 つの問題を 1 実装サイクルで解消する実装仕様。

- **RC-1 / Lane A（機能バグ・最重要）**: 「絞り込み」を押すと `[ { "code": "unrecognized_keys", "keys": [ "batchId" ], ... } ]` が画面下部に raw JSON 表示。真因は web `apps/web/src/lib/admin/api.ts` の `AppliedFiltersZ`（`.strict()`）に `batchId` フィールドが欠落し、API generic audit endpoint が返す `appliedFilters.batchId` を `SchemaAliasHistoryResponseZ.parse` が reject すること。API・D1 は無罪。
- **RC-2 / Lane B（エラー堅牢化）**: ZodError の raw JSON をそのまま `<p role="alert">` に描画し、スタイルも無いためレイアウトが崩れる。human-readable な日本語メッセージへ変換 + OKLch token スタイル。
- **RC-3 / Lane C（用途明確化）**: 「何の画面か・何を解決した記録か・何が分かるか」が伝わらない情報設計欠如。目的説明UI + 用語集を追加し、タイトル/説明文を平易化。
- **RC-4 / Lane D（表示形式）**: 素の table をプロトタイプ `pages-admin.jsx` `SchemaDiffPage` の ALIAS HISTORY カード形式へ整合。
- **Lane E**: 上記すべてを回帰テストで保護。

すべて **apps/web 表現層 / adapter 層**で完結し、新 API endpoint・D1 schema 変更・Google Form 仕様変更を行わない（既存 `GET /admin/audit?action=schema_diff.alias_assigned` を再利用）。

## 正本順位（衝突時の優先度）

1. [`shared-context.md`](./shared-context.md)（本タスク SSOT）
2. `docs/00-getting-started-manual/specs/01-api-schema.md` §6.416（audit endpoint payload 形状）
3. `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`（admin schema 画面 blueprint）
4. プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` `SchemaDiffPage`（ALIAS HISTORY L633-652）

## 不変条件

1. 既存 API surface のみ利用（新 endpoint / D1 schema / Google Form 変更禁止）
2. OKLch tokens 正本化（HEX 直書き禁止・`verify-design-tokens` で fail）
3. プロトタイプ primitives 正本順位（新 primitive を生やさない）
4. D1 直接アクセス禁止（`apps/web` は API helper 経由のみ）
5. apps/api 非接触（`git diff origin/dev...HEAD -- apps/api` が空）

## Phase 一覧

| Phase | 名称 | 成果物 | 状態 |
|------|------|--------|------|
| 1 | 要件定義 | `phase-1-requirements.md` | completed |
| 2 | 設計 | `phase-2-design.md` | completed |
| 3 | 設計レビュー | `phase-3-design-review.md` | completed |
| 4 | テスト計画 | `phase-4-test-plan.md` | completed |
| 5 | 実装手順 | `phase-5-implementation.md` | completed |
| 6 | テスト追加 | `phase-6-test-additions.md` | completed |
| 7 | カバレッジ | `phase-7-coverage.md` | completed |
| 8 | リファクタ | `phase-8-refactor.md` | completed |
| 9 | QA | `phase-9-qa.md` | completed |
| 10 | 最終レビュー | `phase-10-final-review.md` | completed |
| 11 | 手動テスト | `phase-11-manual-test.md` | local_evidence_captured_staging_pending |
| 12 | ドキュメント同期 | `phase-12-documentation.md` | completed |
| 13 | PR 作成 | `phase-13-pr.md` | pending_user_approval |

> Phase 1-12 は local 実装・focused evidence まで完了している。staging deploy / authenticated screenshot 2 点 / commit / PR は user-gated。

## 対象ファイル（implementation_targets）

新規: `apps/web/src/lib/admin/schemaHistoryError.ts` / `schemaHistoryGlossary.ts` / `components/admin/SchemaHistoryPurposeExplainer.tsx` + 3 spec
編集: `apps/web/src/lib/admin/api.ts` / `components/admin/SchemaDiffHistoryPanel.tsx` / `app/(admin)/admin/schema/history/page.tsx` / `src/styles/globals.css` / 既存 panel spec

詳細は [`shared-context.md` §5](./shared-context.md)。

## DoD

[`shared-context.md` §9](./shared-context.md) を参照。AC-1〜AC-10 は local deterministic evidence で達成済み。staging visual と Phase 13 は user-gated。
