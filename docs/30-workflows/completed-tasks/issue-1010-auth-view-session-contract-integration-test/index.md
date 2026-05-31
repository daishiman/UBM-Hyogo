# issue-1010-auth-view-session-contract-integration-test

**[実装区分: 実装仕様書]**

> 区分判定根拠: 本タスクの成果物は新規テストファイル `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` の追加であり、コード変更（テストコード追加）を伴う。docs-only ではなく実装仕様書として作成する（CONST_004）。production コード（`apps/web/src/lib/auth.ts` / `auth-view/*`）の変更は伴わないが、テスト追加はコード変更に該当する。

## 概要

`getAuthView()` が解決する `AuthView`（guest / member / admin）の判定は、実 auth module
（`apps/web/src/lib/auth.ts` の `buildAuthConfig().callbacks.session`）が生成する `session.user` の
shape（`memberId` / `isAdmin`）に依存している。現状この 2 側は**独立にテストされており**、
両者を橋渡しする契約テストが存在しない。Auth.js session augmentation や session callback が
`memberId` / `isAdmin` の field 名・型を変えた場合、両側の単体テストは緑のまま production だけが壊れ、
ログイン済み member/admin が公開ヘッダーで `guest` 表示（=`マイページ` / `管理画面` 導線消失）に倒れる。

本タスクは、**実 session callback の出力を `resolveAuthView()` / `getAuthView()` に連鎖させる
integration-level 契約テスト**を 1 ファイル追加し、この drift をローカル CI で早期検知する。

## Issue 最適化メモ（最新コード整合）

- GitHub Issue #1010 は close-out 時点で GitHub 上 **CLOSED**（FU-001 consumed 由来）。本タスクは Issue の state を変更せず（reopen しない）、CLOSED のまま完了タスクとして記録する。
- Issue 原文 Phase 2 は「session object fixture を `getAuthView()` に流す」案だが、これは既存 mock テスト `getAuthView.spec.ts` と重複し drift 検知価値が薄い。
- 最新コードでは `buildAuthConfig`（`apps/web/src/lib/auth.ts:174`）が **export 済**であり、`auth.spec.ts` が `callbacks.session`（token → session.user）を既にテストしている。本仕様は **実 session callback の出力を `resolveAuthView()` に連鎖**させる契約テストへ最適化し、Issue 原案の重複を解消して根本（契約 drift 検知）を解決する。
- production コード変更は不要（`buildAuthConfig` は既に export されており、testability 改修は発生しない）。

## メタ情報

| 項目                | 値                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------- |
| workflow_id         | `issue-1010-auth-view-session-contract-integration-test`                                     |
| issue_number        | 1010（GitHub state: CLOSED・本タスクで変更しない）                                          |
| parent_workflow     | `public-header-logged-in-nav-cleanup`（FU-001 / Phase 10 M-01 由来）                         |
| source_task         | `public-header-session-aware-auth-view-base` Phase 10 M-01 / Phase 12 unassigned FU-001       |
| implementation_mode | `new`（新規テストファイル追加）                                                              |
| workflow_state      | `implemented_local_evidence_captured`                                                        |
| task_classification | NON_VISUAL（テスト追加のみ。UI レイアウト変更なし）                                          |
| visual_evidence     | NON_VISUAL                                                                                   |
| primary_evidence    | `outputs/phase-11/manual-test-result.md`（focused Vitest 4 files / 61 tests PASS）            |
| created_at          | 2026-05-30                                                                                   |
| owner               | daishiman                                                                                    |

## スコープ

### in scope

- `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` 新規追加
- 実 `buildAuthConfig().callbacks.session` の出力（token → `session.user`）を `resolveAuthView()` / `getAuthView()` に連鎖させる契約テスト
- session augmentation が `memberId` / `isAdmin` を欠落させた場合の guest fail-closed regression assertion
- `public-header-session-aware-auth-view-base` の FU-001 consumed trace 更新（Phase 12 ドキュメント同期）

### out of scope

- `apps/web/src/lib/auth.ts` / `auth-view/*` の production コード変更（`buildAuthConfig` は既に export 済）
- Auth.js provider 設定変更・Google OAuth 実ログイン smoke
- staging authenticated runtime screenshot 取得（user-gated boundary）
- `PublicHeader` / `MemberHeader` の UI 変更
- commit / push / PR 作成（user-gated）

## 不変条件整合

- 不変条件 #5（`apps/web` から D1 直接アクセス禁止）: テストは session object fixture のみ使用し D1 にアクセスしない。
- 不変条件 #11（fail-closed）: `memberId` 欠落時 guest へ倒す挙動を assertion として固定する。

## Phase 一覧

| Phase | 名称             | 成果物                                                                  | 状態        |
| ----- | ---------------- | ----------------------------------------------------------------------- | ----------- |
| 1     | 要件定義         | `outputs/phase-1/phase-1.md`                                            | completed |
| 2     | 設計             | `outputs/phase-2/phase-2.md`                                            | completed |
| 3     | 設計レビュー     | `outputs/phase-3/phase-3.md`                                            | completed |
| 4     | テスト作成       | `outputs/phase-4/phase-4.md`                                            | completed |
| 5     | 実装             | `outputs/phase-5/phase-5.md`                                            | completed |
| 6     | テスト拡充       | `outputs/phase-6/phase-6.md`                                            | completed |
| 7     | カバレッジ確認   | `outputs/phase-7/phase-7.md`                                            | completed |
| 8     | リファクタリング | `outputs/phase-8/phase-8.md`                                            | completed |
| 9     | 品質保証         | `outputs/phase-9/phase-9.md`                                            | completed |
| 10    | 最終レビュー     | `outputs/phase-10/phase-10.md`                                          | completed |
| 11    | 手動テスト       | `outputs/phase-11/phase-11.md`, `outputs/phase-11/manual-test-result.md` | completed |
| 12    | ドキュメント同期 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | completed |
| 13    | PR作成           | `outputs/phase-13/phase-13.md`                                          | pending_user_approval |

## 完了条件（workflow 全体 DoD）

- [x] member session（実 session callback 出力）→ `{ kind: "member", profileHref: "/profile" }` 解決
- [x] admin session → `{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }` 解決
- [x] `memberId` 欠落 session → `{ kind: "guest" }` fail-closed
- [x] 実 `buildAuthConfig().callbacks.session({ token })` の出力 shape が `resolveAuthView` の読む field と一致することを assertion
- [x] focused Vitest（新規 integration + 既存 getAuthView + resolveAuthView + auth.spec）が exit 0
- [x] `pnpm --filter @ubm-hyogo/web typecheck` が exit 0
- [x] 既存 PublicHeader / resolveAuthView / getAuthView / auth.spec の regression なし

## 検証コマンド

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts \
  apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts \
  apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  apps/web/src/lib/auth.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```
