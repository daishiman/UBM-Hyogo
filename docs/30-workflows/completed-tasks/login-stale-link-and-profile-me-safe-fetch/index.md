# login-stale-link-and-profile-me-safe-fetch

[実装区分: 実装仕様書]

ユーザーが docs-only ではなく実装必須を明示。コード変更を伴う実装 workflow として local 実装・focused regression tests まで同一 cycle で反映する。

## 背景

staging (`https://ubm-hyogo-web-staging.daishimanju.workers.dev/`) で報告された2件のランタイム問題を1サイクル内で解消する。

1. **`GET /[object%20Object] 404 (Not Found)`**
   - ログインページ表示時に発生。リンク／画像 src／router.push に object が渡って `String(obj) = "[object Object]"` に coerce されている。
   - リンク／画像／プリフェッチの発生源を特定し、type-safe な URL 文字列に置換する。

2. **`/profile` 等の Server Components render error (digest: `94450799`, scope: `profile`)**
   - production build では原因メッセージが隠匿される digest-only 失敗。
   - 直近で `safeServerFetch` 化は `/me/profile` フェッチに限られており、先行する `fetchAuthed<MeSessionResponse>("/me")` は `AuthRequiredError` 以外で throw → Server Components render error に直結する。
   - bare `/me` fetch を `safeServerFetch` でラップし、5xx / network 失敗を `SectionError` UI に降ろす。あわせて `app/(member)/profile/error.tsx` が digest を ID として保持できるよう既存ロガーへの記録経路を点検する。

## スコープ

| 含む | 含まない |
|------|---------|
| `[object Object]` リンクの発生源特定と修正（Task A） | API Worker (`apps/api/`) 側の挙動変更 |
| `/profile` page.tsx の `/me` 取得を `safeServerFetch` 化、error UI 強化（Task B） | 新規 D1 migration、新規 endpoint 追加 |
| 上記2件に対する vitest 回帰テスト追加 | UI デザイントークン変更、新規 primitive 追加 |
| `apps/web/app/login/error.tsx` の digest 表示見直し（小） | NextAuth provider 設定の変更 |

## 不変条件

- `apps/web` から D1 直接アクセス禁止（CLAUDE.md #5）
- env 参照は `apps/web/src/lib/env.ts` の公開アクセサのみ（task-02 invariant）
- OKLch tokens 経由のみ（HEX 直書き禁止）
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ

## タスク一覧

| Task | 責務 | 主担当ファイル | 仕様書 |
|------|------|---------------|-------|
| A | `[object Object]` 404 リンク発生源の特定と type-safe 化 | `apps/web/app/**`, `apps/web/src/**` | [tasks/task-A.md](tasks/task-A.md) |
| B | `/profile` page.tsx の `/me` 取得 safeServerFetch 化＋error UI 強化 | `apps/web/app/(member)/profile/page.tsx`, `apps/web/app/(member)/profile/error.tsx` | [tasks/task-B.md](tasks/task-B.md) |

両タスクは同一ブランチ・同一 PR で1サイクル完了する（CONST_007）。

## Phase 一覧

| Phase | 状態 | 成果物 |
|-------|------|-------|
| 1 要件定義 | spec_created | outputs/phase-1/requirements.md |
| 2 設計 | spec_created | outputs/phase-2/design.md |
| 3 設計レビュー | spec_created | outputs/phase-3/design-review.md |
| 4 テスト作成 | implemented_local_evidence_captured | outputs/phase-4/test-plan.md |
| 5 実装 | implemented_local_evidence_captured | outputs/phase-5/implementation-plan.md |
| 6 テスト拡充 | implemented_local_evidence_captured | outputs/phase-6/expanded-tests.md |
| 7 カバレッジ | implemented_local_evidence_captured | outputs/phase-7/coverage-report.md |
| 8 リファクタ | implemented_local_evidence_captured | outputs/phase-8/refactor-notes.md |
| 9 品質保証 | implemented_local_evidence_captured | outputs/phase-9/qa-summary.md |
| 10 最終レビュー | implemented_local_evidence_captured | outputs/phase-10/final-review.md |
| 11 手動テスト | runtime_pending | outputs/phase-11/manual-test-result.md |
| 12 ドキュメント更新 | implemented_local_evidence_captured | outputs/phase-12/*.md（strict 7） |
| 13 PR作成 | blocked | user 明示承認後 |

## ブランチ

`fix/login-stale-link-and-profile-me-safe-fetch`（dev 派生）
