# admin-tag-management-clarity-and-code-autogen

[実装区分: 実装仕様書]

> Source: staging 観察起点 + ユーザー報告（2026-06-11 06:44 / `/admin/tag-master`・`/admin/tags`）。relatedIssue = null。
> SSOT: [`shared-context.md`](./shared-context.md)（全 Phase / outputs はこれを正本とする）
> 実装区分: **実装仕様書（VISUAL）**（CONST_005 必須項目すべてを含む / CONST_007 1 サイクル完了スコープ）
> workflow_state: `implemented_local_evidence_captured`（apps/web 実装・local evidence 取得済み。commit / PR / staging visual は user-gated）

## 概要

非エンジニアの管理者が操作する前提で、タグ管理 2 画面（`/admin/tag-master`「タグ定義」・`/admin/tags`「タグ割当」）の直感性を 1 本サイクルで改善する実装仕様。すべて **apps/web 表現層**で完結し、新 API endpoint・D1 schema 変更・Google Form 仕様変更を行わない（既存 API surface のみ利用）。

- **C1（コード自動生成）**: タグ定義フォームの `コード`（現状 `a-z0-9_` 手動入力）を**表示名から自動生成**（手動上書き可）。新規純関数 `tagCodeAutogen.ts`。
- **C2（命名統一）**: サイドバー label「タグキュー」をページ内タイトルと同じ**「タグ割当」**へ統一。
- **C3（関係の可視化）**: 2 画面の役割（**定義** = 語彙を作る / **割当** = 語彙をメンバーに付与）を説明する `TagManagementGuide` と用語集 SSOT `tagManagementGlossary.ts` を追加し、画面間を相互リンク。
- **C4（文言平易化）**: "tag master API" 等の技術文言を用語集経由で非エンジニア向けに平易化。
- **C5**: 上記すべてを回帰テストで保護。

## 正本順位（衝突時の優先度）

1. [`shared-context.md`](./shared-context.md)（本タスク SSOT）
2. `docs/00-getting-started-manual/specs/01-api-schema.md`（タグ schema・項目定義）
3. `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`（admin 画面 blueprint・存在する場合）
4. プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`（admin primitives）

## 不変条件

1. 既存 API surface のみ利用（新 endpoint / D1 schema / Google Form 変更禁止）
2. OKLch tokens 正本化（HEX 直書き禁止・`verify-design-tokens` で fail）
3. プロトタイプ primitives 正本順位（新 primitive を生やさない）
4. D1 直接アクセス禁止（`apps/web` は API helper 経由のみ）
5. apps/api 非接触（`git diff origin/dev...HEAD -- apps/api` が空）

## Phase 一覧

| Phase | 名称 | 成果物 | 状態 |
|------|------|--------|------|
| 1 | 要件定義 | [`phase-1-requirements.md`](./phase-1-requirements.md) | completed |
| 2 | 設計 | [`phase-2-design.md`](./phase-2-design.md) | completed |
| 3 | 設計レビュー | [`phase-3-design-review.md`](./phase-3-design-review.md) | completed |
| 4 | テスト計画 | [`phase-4-test-plan.md`](./phase-4-test-plan.md) | completed |
| 5 | 実装手順 | [`phase-5-implementation.md`](./phase-5-implementation.md) | completed |
| 6 | テスト追加 | [`phase-6-test-additions.md`](./phase-6-test-additions.md) | completed |
| 7 | カバレッジ | [`phase-7-coverage.md`](./phase-7-coverage.md) | completed |
| 8 | リファクタ | [`phase-8-refactor.md`](./phase-8-refactor.md) | completed |
| 9 | QA | [`phase-9-qa.md`](./phase-9-qa.md) | completed |
| 10 | 最終レビュー | [`phase-10-final-review.md`](./phase-10-final-review.md) | completed |
| 11 | 手動テスト | [`phase-11-manual-test.md`](./phase-11-manual-test.md) | implemented_local_evidence_captured |
| 12 | ドキュメント同期 | [`phase-12-documentation.md`](./phase-12-documentation.md) | completed |
| 13 | PR 作成 | [`phase-13-pr.md`](./phase-13-pr.md) | pending_user_approval |

> 本サイクルで apps/web 実装・local evidence を取得済み。staging visual・commit・PR は user-gated。

## 対象ファイル（implementation_targets）

新規（product 3 + spec 4）: `apps/web/src/lib/admin/tagCodeAutogen.ts` / `tagManagementGlossary.ts` / `components/admin/TagManagementGuide.tsx` + 4 spec
編集（product 6 + spec 2）: `components/admin/TagDefinitionCreateForm.tsx` / `components/admin/TagQueuePanel.tsx` / `features/admin/components/_members/MemberDrawer.tsx` / `components/shell/shell-config.ts` / `app/(admin)/admin/tag-master/page.tsx` / `app/(admin)/admin/tags/page.tsx` + 2 existing spec

詳細は [`shared-context.md` §5](./shared-context.md)。

## メタ

| 項目 | 値 |
|------|-----|
| タスク種別 | VISUAL（UI task） |
| relatedIssue | null |
| branch | `feat/admin-tag-management-clarity-and-code-autogen` |

## DoD

[`shared-context.md` §9](./shared-context.md) を参照。AC-1〜AC-12 を満たす実装手順を仕様化済み。実装・staging visual・Phase 13 は user-gated。
