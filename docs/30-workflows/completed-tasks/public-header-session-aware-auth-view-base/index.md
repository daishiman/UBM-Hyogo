# public-header-session-aware-auth-view-base

**[実装区分: 実装仕様書]**

**状態: `implemented_local_evidence_captured / implementation / VISUAL`**

## 概要

`PublicHeader` を async server component 化し、ログイン状態に応じて auth CTA（guest/member/admin）を出し分ける。後続タスク（B/C/E/G）が共有する `AuthView` 型・`resolveAuthView()` 純関数・`getAuthView()` 取得ヘルパを基盤として整備する。

元タスク: `docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-a-public-header-session-aware.md`

## メタ

| 項目 | 値 |
|------|----|
| taskId | TASK-PUBHDR-SESSION-AWARE-AUTHVIEW-BASE-001 |
| taskType | implementation |
| implementation_mode | `new` |
| visualEvidence | VISUAL |
| scope | `apps/web` PublicHeader async 化 + auth-view 基盤 + `(public)/layout.tsx` 配線 |
| 親 workflow | public-header-logged-in-nav-cleanup |

## 変更対象ファイル

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/src/lib/auth-view/types.ts` | 新規 |
| 2 | `apps/web/src/lib/auth-view/resolveAuthView.ts` | 新規 |
| 3 | `apps/web/src/lib/auth-view/getAuthView.ts` | 新規 |
| 4 | `apps/web/src/lib/auth-view/index.ts` | 新規（barrel） |
| 5 | `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | 新規 |
| 6 | `apps/web/src/components/public/PublicHeader.tsx` | 編集（async 化） |
| 7 | `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` | 編集 |
| 8 | `apps/web/app/(public)/layout.tsx` | 編集（async + authView 配信） |
| 9 | `apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts` | 新規 |
| 10 | `apps/web/app/(public)/layout.spec.tsx` | 編集 |

## Phase 一覧

| Phase | 名称 | 出力 | 状態 |
|------|------|------|------|
| 1 | 要件定義 | phase-1-requirements.md | completed |
| 2 | 設計 | phase-2-design.md | completed |
| 3 | 設計レビュー | phase-3-design-review.md | completed |
| 4 | テスト計画 | phase-4-test-plan.md | completed |
| 5 | 実装手順 | phase-5-implementation.md | completed |
| 6 | テスト追加 | phase-6-test-additions.md | completed |
| 7 | カバレッジ | phase-7-coverage.md | completed |
| 8 | リファクタ | phase-8-refactor.md | completed |
| 9 | QA | phase-9-qa.md | completed |
| 10 | 最終レビュー | phase-10-final-review.md | completed |
| 11 | 手動テスト | phase-11-manual-test.md | completed |
| 12 | ドキュメント同期 | phase-12-documentation.md | completed |
| 13 | PR 作成 | phase-13-pr.md | pending_user_approval |

## DoD（全 Phase 横断）

- 10 ファイル変更完了
- `pnpm typecheck` / `pnpm lint` green
- focused vitest 24 ケース pass（resolveAuthView 9 + getAuthView 4 + PublicHeader 8 + PublicLayout 3）
- `(public)/layout.tsx` が async 化、`<PublicHeader authView />` で配信
- HEX 直書きなし（`rg "#[0-9a-fA-F]{6}" apps/web/src/components/public/PublicHeader.tsx` 0 hit）
- `<header data-auth-state>` が `guest|member|admin` のリテラルのみ
