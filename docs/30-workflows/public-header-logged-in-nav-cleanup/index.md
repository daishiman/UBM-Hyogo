# public-header-logged-in-nav-cleanup

## 概要

ログイン済みユーザーに対しても公開層ヘッダが「ログイン」CTA を出し続ける UX 不整合を、**全ページにまたがる横断対応**として解消する。「ログイン状態と UI 状態の整合」を全 19 routes で取り、ログイン後の主要動線（マイページ・管理・ログアウト）を共通シェル経由で提供する。

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`
- implementation_status: `implementation_spec_ready_pending_code`
- Phase 12 strict 7: `outputs/phase-12/` に配置済み
- Phase 13: commit / push / PR は user-gated

- staging URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/`
- 観測症状（2026-05-28）: セッション cookie 保持時もトップ `/` 右上に「ログイン」CTA。
- ユーザー要求要約: 「ログインしているのにログインボタンがあるのは不整合。マイページ・プロフィール・編集等へ飛べる導線にしてほしい。UI/UX を整える」

## スコープ（7 タスク）

| Task | 対象 | 区分 | 仕様書 |
|------|------|------|--------|
| A | 公開ヘッダ本体 (`PublicHeader.tsx`) の session 認識化 | 実装仕様書 | `tasks/task-a-public-header-session-aware.md` |
| B | Root `/` (`app/page.tsx`) で async `PublicHeader` を mount 整合 | 実装仕様書 | `tasks/task-b-root-page-public-header-async.md` |
| C | `/privacy`, `/terms` を公開シェル (`PublicHeader` + `PublicFooter`) に統一 | 実装仕様書 | `tasks/task-c-privacy-terms-public-shell.md` |
| D | `/login` でログイン済みなら `/profile` へリダイレクト | 実装仕様書 | `tasks/task-d-login-redirect-when-authenticated.md` |
| E | `MemberHeader` に管理者リンク + session fail-closed | 実装仕様書 | `tasks/task-e-member-header-admin-link.md` |
| F | `AdminSidebar` の auth 動線整合（差分なし検証 + 「公開サイトに戻る」追加） | 実装仕様書 | `tasks/task-f-admin-sidebar-public-return.md` |
| G | 横断 e2e（Playwright で 3 状態 × 7 routes の auth slot 検証） | 実装仕様書 | `tasks/task-g-auth-slot-e2e.md` |

> 全タスクは **1 サイクル / 1 PR で完了する** スコープに設計（CONST_007）。先送りなし。

## 不変条件（全タスク共通）

1. **既存 API のみ接続**: 認証状態は `apps/web/src/lib/auth.ts` の `getAuth().auth()`、または `apps/web/src/lib/session.ts` の `getSession()` 経由のみ。新 endpoint 追加禁止。
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding を触らない。
3. **OKLch トークン正本化**: 色は `apps/web/src/styles/tokens.css` の `var(--ubm-color-*)` 経由のみ。HEX 直書き禁止。
4. **Server/Client 境界**: ヘッダ本体は Server Component、ログアウトのみ既存 `SignOutButton` (client island) を再利用。
5. **fail-closed**: `auth()` / `getSession()` が throw / 不定の場合は **未ログイン扱い**で描画する。
6. **PII 非露出**: DOM / log に `memberId` / `email` を直接出さない。`data-auth-state` は `"guest"|"member"|"admin"` の 3 値リテラルのみ。
7. **既存命名規約**: テストは `*.spec.{ts,tsx}` のみ (`*.test.*` 禁止)。
8. **正本順位衝突時**: 既存プロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/`) の primitives + tokens を変更しない。

## 実装区分

- 7 タスク全て **[実装区分: 実装仕様書]**。コード変更を伴う。各タスクの `## DoD` セクションに CONST_005 必須項目を完備。
- Task F のみ「差分なしの場合は docs-only 認定」を内部判定条件で許容するが、**観測時点で「公開サイトに戻る」リンクが AdminSidebar に存在しないため**、実装が必要と判定（実装仕様書として作成）。

## Phase 構成

| Phase | ファイル | 内容 |
|-------|---------|------|
| 1 | `phase-1-requirements.md` | 全画面の症状調査・期待振る舞い・AC 一覧 |
| 2 | `phase-2-design.md` | 共通コンポーネント設計（`AuthView` / `resolveAuthView`）・各画面適用方針 |
| 3 | `phase-3-design-review.md` | 不変条件適合・既存資産衝突マトリクス |
| 4 | `phase-4-test-plan.md` | Vitest / Playwright / grep gate の計画 |
| 5 | `phase-5-implementation.md` + `tasks/task-a..g-*.md` | 各タスクの実装仕様（CONST_005 完備） |
| 6 | `phase-6-test-additions.md` | 追加テスト一覧 |
| 7 | `phase-7-coverage.md` | coverage / route matrix |
| 8 | `phase-8-refactor.md` | 過剰設計排除・破棄判断 |
| 9 | `phase-9-qa.md` | 品質保証 gate |
| 10 | `phase-10-final-review.md` | 30種思考法 compact evidence + 4条件 |
| 11 | `outputs/phase-11/manual-test-result.md` | runtime pending 境界 |
| 12 | `outputs/phase-12/*` | strict 7 |
| 13 | `outputs/phase-13/pr-creation-result.md` | user-gated PR 境界 |

Phase 4/6-13 は本改善サイクルで追加済み。親 workflow 全体は「仕様書作成完了 / 大半の実装未着手」だが、Task D `/login` redirect は `docs/30-workflows/completed-tasks/login-redirect-when-authenticated/` で `implemented_local_evidence_captured` まで進行済み。残タスクのコード実装・runtime visual・commit / push / PR は後続の明示実行時に行う。

## 並列実行戦略

- **直列前提**: Task A は B/C/G の前提（async `PublicHeader` の API 確定が必要）
- **並列可能**: Task A 完了後、B / C / D / E は並列実装可
- **最後**: Task G（e2e）は A-F の DOM 契約 (`data-auth-state` 等) 確定後に実装

## 参照

- `apps/web/src/components/public/PublicHeader.tsx`
- `apps/web/src/components/layout/MemberHeader.tsx`
- `apps/web/src/components/layout/AdminSidebar.tsx`
- `apps/web/app/(public)/layout.tsx`, `apps/web/app/(member)/layout.tsx`, `apps/web/app/(admin)/layout.tsx`
- `apps/web/app/page.tsx`, `apps/web/app/login/page.tsx`, `apps/web/app/privacy/page.tsx`, `apps/web/app/terms/page.tsx`
- `apps/web/src/lib/auth.ts`（`getAuth().auth()`）
- `apps/web/src/lib/session.ts`（`getSession()`）
- `apps/web/src/components/auth/SignOutButton.tsx`
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/claude-design-prototype/`
