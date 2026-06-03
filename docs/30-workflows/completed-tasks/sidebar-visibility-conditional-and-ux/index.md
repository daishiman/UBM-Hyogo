# サイドバー表示条件の正本化 & UI/UX 改善 — タスク仕様書

> **実装区分: 実装仕様書**（CONST_004）。route topology / middleware / shell コンポーネントへのコード変更を伴う。
> **workflow_state: implemented_local_evidence_captured**。実コード・direct focused tests・typecheck・lint・local screenshot 4 PNG まで完了。admin/staging screenshot・commit・PR は user-gated（CONST_002 / CONST_006）。

## 概要

「ログイン前のログイン画面にもサイドバーが表示される」現象を起点に、**サイドバーの表示条件（route × 認証状態 × role）を単一正本へ整理** し、未ログイン/会員/管理それぞれのサイドバー UI/UX を改善する実装仕様書。

正本仕様 `09h-shell-and-fixtures.md §1.6` の「`/login` は shell 外 bare」に実装を一致させ、route group `(auth)` を正本マトリクスへ明示した **spec drift 解消** タスク。

## スコープ（バグ修正 + 核心 UX・ユーザー承認済）

| # | 内容 |
|---|------|
| 1 | `/login` を `(auth)` route group へ移動し bare 化（サイドバー非表示） |
| 2 | 表示条件マトリクス（route group = 表示/非表示の単一正本）の確定と 09h への反映 + invariant test |
| 3 | middleware `x-pathname` 注入 → 全 layout の SSR active 表示を正確化（admin の `/admin` ハードコード撤廃） |
| 4 | 未ログイン(viewer) identity を「ゲスト/未ログイン」+ ログイン CTA へ明確化 |
| 5 | member/admin の active 表示・admin schema badge の視認性改善 |

含まない: 色/余白の全面リデザイン（広範な視覚再設計）。

## 実装タスク分解（全て1サイクル内・CONST_007）

| Task | 責務 | 主変更ファイル |
|------|------|---------------|
| **T1** route topology | login bare 化 + 表示条件マトリクス正本化 + invariant test | `app/(auth)/layout.tsx`(新), `app/(auth)/login/**`(git mv), `09h-shell-and-fixtures.md`, `src/__tests__/sidebar-shell-route-topology.spec.ts`(新) |
| **T2** SSR active | middleware x-pathname 注入 + 全 layout activePath 正確化 | `middleware.ts`, `app/(admin)/layout.tsx` |
| **T3** shell UX | viewer=ゲスト/ログインCTA + active/badge 視認性 | `SidebarUserMenu.tsx`, `SidebarUserAvatar.tsx`, `SidebarNavItem.tsx` |

## 表示条件マトリクス（正本）

| route group | route | shell | サイドバー | role |
|-------------|-------|-------|-----------|------|
| `(auth)` | `/login` | bare | **非表示** | 不問 |
| `(public)` | `/`・`/members`・`/members/[id]`・`/register`・`/privacy`・`/terms` | SidebarShell | 表示 | viewer=PUBLIC のみ / member=+MEMBERS / admin=+ADMIN |
| `(member)` | `/profile` | SidebarShell | 表示 | member/admin（middleware guard） |
| `(admin)` | `/admin`・`/admin/{...}` | SidebarShell | 表示 | admin（二段防御） |

## Phase 一覧

| Phase | ファイル | 状態 |
|-------|---------|------|
| 1 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) | completed |
| 2 設計 | [phase-2-design.md](phase-2-design.md) | completed |
| 3 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | completed |
| 4 テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) | completed |
| 5 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) | completed |
| 6 テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) | completed |
| 7 カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) | completed |
| 8 リファクタ | [phase-8-refactor.md](phase-8-refactor.md) | completed |
| 9 QA | [phase-9-qa.md](phase-9-qa.md) | completed |
| 10 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) | completed |
| 11 手動テスト | [phase-11-manual-test.md](phase-11-manual-test.md) | local_evidence_captured（pixel pending・user-gated） |
| 12 ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) | completed |
| 13 PR | [phase-13-pr.md](phase-13-pr.md) | pending_user_approval |

## Phase 12 成果物（strict 7）

- [outputs/phase-12/main.md](outputs/phase-12/main.md)
- [outputs/phase-12/implementation-guide.md](outputs/phase-12/implementation-guide.md)
- [outputs/phase-12/system-spec-update-summary.md](outputs/phase-12/system-spec-update-summary.md)
- [outputs/phase-12/documentation-changelog.md](outputs/phase-12/documentation-changelog.md)
- [outputs/phase-12/unassigned-task-detection.md](outputs/phase-12/unassigned-task-detection.md)
- [outputs/phase-12/skill-feedback-report.md](outputs/phase-12/skill-feedback-report.md)
- [outputs/phase-12/phase12-task-spec-compliance-check.md](outputs/phase-12/phase12-task-spec-compliance-check.md)

## 不変条件（遵守）

- 既存 API endpoint surface のみ（新 endpoint / D1 schema / Google Form 変更禁止）
- OKLch トークン正本のみ（HEX 直書き禁止・`verify-design-tokens` gate）
- 新規 primitive を生やさない（既存 shell primitives の分岐拡張に閉じる）
- `apps/web` から D1 直接アクセス禁止 / admin・profile の fail-closed 二段防御を非破壊（不変条件 #5・#11）

## 参照

- 正本: `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` §1.2 / §1.6
- 認証: `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md`
- トークン: `docs/00-getting-started-manual/specs/09b-design-tokens.md`
