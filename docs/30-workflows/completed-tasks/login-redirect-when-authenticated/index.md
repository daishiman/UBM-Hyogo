# login-redirect-when-authenticated

**[実装区分: 実装仕様書]**

## 概要

ログイン済みユーザーが `/login` に到達した場合、即座に `/profile`（または `searchParams.next` が安全なら `next`）へリダイレクトする。これにより「ログイン状態と UI 状態の整合」を `/login` 画面側からも保証する。

## メタ情報

| 項目                  | 値                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| workflow_id           | `login-redirect-when-authenticated`                                                               |
| parent_workflow       | `public-header-logged-in-nav-cleanup`                                                             |
| source_task_spec      | `docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-d-login-redirect-when-authenticated.md` |
| implementation_mode   | `new`                                                                                             |
| workflow_state        | `implemented_local_evidence_captured`                                                             |
| task_classification   | NON_VISUAL（server-side redirect + 純関数 unit test。UI レイアウト変更なし）                      |
| visual_evidence       | N/A（既存 LoginCard の描画 regression は spec 内で snapshot 比較ではなく `getSession=null` ケースのレンダリング確認で代替） |
| primary_evidence      | `outputs/phase-11/manual-test-result.md` （focused Vitest 22 件 PASS）                            |
| created_at            | 2026-05-28                                                                                        |
| owner                 | daishiman                                                                                         |

## スコープ

### in scope
- `apps/web/src/lib/url/safe-next.ts` 新規（純関数 + 16 ケース unit test）
- `apps/web/app/login/page.tsx` を編集し `getSession()` 取得 + ログイン済み時 `redirect()`
- `/login` page server-side redirect の vitest 追加

### out of scope
- `safe-redirect.ts`（既存）の削除・統合（既存 predicate を再利用し、削除は行わない）
- middleware 層での redirect（page 内で完結）
- client-side guard（既存の middleware/session 経路は変更しない）

## Phase 一覧

| Phase | 名称                 | 成果物                                                                                          | 状態  |
| ----- | -------------------- | ----------------------------------------------------------------------------------------------- | ----- |
| 1     | 要件定義             | `outputs/phase-1/phase-1.md`                                                                    | completed |
| 2     | 設計                 | `outputs/phase-2/phase-2.md`                                                                    | completed |
| 3     | 設計レビュー         | `outputs/phase-3/phase-3.md`                                                                    | completed |
| 4     | テスト作成           | `outputs/phase-4/phase-4.md`                                                                    | completed |
| 5     | 実装                 | `outputs/phase-5/phase-5.md`                                                                    | completed |
| 6     | テスト拡充           | `outputs/phase-6/phase-6.md`                                                                    | completed |
| 7     | カバレッジ確認       | `outputs/phase-7/phase-7.md`                                                                    | completed |
| 8     | リファクタリング     | `outputs/phase-8/phase-8.md`                                                                    | completed |
| 9     | 品質保証             | `outputs/phase-9/phase-9.md`                                                                    | completed |
| 10    | 最終レビュー         | `outputs/phase-10/phase-10.md`                                                                  | completed |
| 11    | 手動テスト           | `outputs/phase-11/phase-11.md`, `outputs/phase-11/manual-test-result.md`                        | completed |
| 12    | ドキュメント更新     | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | completed |
| 13    | PR作成               | `outputs/phase-13/phase-13.md`                                                                  | pending_user_approval |

## 完了条件（workflow 全体 DoD）

- [x] `safeNext` 16 ケース pass
- [x] `/login` ログイン済み + next なし → `/profile` redirect
- [x] `/login` ログイン済み + 安全 next → `next` redirect
- [x] `/login` ログイン済み + 不正 next → `/profile` fallback
- [x] `/login` 未ログイン → 既存 LoginCard 描画（regression なし）
- [x] `/login` 自己ループ next → `/profile` fallback
- [x] typecheck / lint green
- [x] Phase 12 strict 7 成果物 完備

## 参照
- 親 workflow: `docs/30-workflows/public-header-logged-in-nav-cleanup/`
- 元タスク仕様: 上記 `tasks/task-d-login-redirect-when-authenticated.md`
- 既存類似関数: `apps/web/src/lib/url/safe-redirect.ts`（`isSafeInternalRedirect` を再利用）
