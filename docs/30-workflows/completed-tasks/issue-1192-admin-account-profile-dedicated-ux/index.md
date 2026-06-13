---
task_id: issue-1192-admin-account-profile-dedicated-ux
spec_classification: implementation_spec
state: implemented_local_evidence_captured
created_at: 2026-06-12
task_type: implementation
visual_category: VISUAL
implementation_mode: new
parent_workflow: docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/
source_request: Issue #1192（CLOSED）の current-code 再スコープ実装仕様化（ユーザー直接依頼）
branch: docs/issue-1192-admin-account-profile-ux-spec
---

# 管理者アカウントの /profile 専用 UX（Issue #1192 再スコープ） タスク仕様書

- **実装区分: `[実装区分: 実装仕様書]`**（CONST_004: コード変更が目的達成に必須。判定根拠は `phase-1-requirements.md` §実装区分の判定根拠）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`
- workflow_state: `implemented_local_evidence_captured`（実装・ローカルテスト完了。commit・PR・staging 認証 screenshot はユーザー明示承認後）
- 元 Issue: [#1192](https://github.com/daishiman/UBM-Hyogo/issues/1192) — **CLOSED のまま維持**し、本ワークフローを canonical な実装仕様とする

---

## 1. 背景 / 元依頼

Issue #1192（親 WF `profile-session-fetch-failure-investigation` の未タスク C-4）は「管理者アカウントが `/profile` にアクセスしたとき何を見せるべきかの UX が未定義」を扱う。元 Issue は「AC-2 結論（管理者が member identity/status を持つか）の D1 read-only 確認待ちで着手不可」とされていた。

### 現状調査の結論（2026-06-12・origin/dev = `82971d195`）

| 論点 | 結論 |
|------|------|
| 既に他タスクで解決済みか | **NO**。`/profile`（`apps/web/app/(member)/profile/page.tsx`）に `isAdmin` 参照は 0 箇所。PR #1194/#1209/#1213/#1214 のいずれも管理者分岐を追加していない |
| AC-2 前提（着手ブロッカー） | **コード事実で代替確定**。`resolveSession`（`apps/api/src/use-cases/auth/resolve-session.ts`）は member identity 解決必須＝**ログイン済み管理者は構造的に必ず member identity を持つ**。D1 データ確認を待つ必要なし |
| 採用する分岐 | **(b) member プロフィール表示 + 管理者補助導線**（構造的必然。(a)/(c) が想定した「member を持たない管理者の `/profile` 到達」は session 不発行のため到達不能） |

詳細は `phase-1-requirements.md` §P50 前提確認チェック。

---

## 2. ゴール

`/profile` 認証成功描画に、`me.user.isAdmin === true` のときのみ管理者向け案内カード **`AdminAccessNotice`**（「管理者メニュー」+ `/admin` への導線「管理画面を開く」）を表示する。member プロフィール本体・非管理者の描画・認証境界（api 所有）は一切変えない。

### 変更ファイル（実装済み差分）

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx` | 新規 |
| 2 | `apps/web/app/(member)/profile/page.tsx` | 編集（import 1 行 + 条件描画 1 行） |
| 3 | `apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | 新規 |
| 4 | `apps/web/app/(member)/profile/page.spec.tsx` | 編集（テスト 3 件追加） |

`apps/api` / `packages/` / D1 / Google Form / CSS トークンは差分ゼロ。

---

## 3. スコープ（CONST_007: 単一サイクル・分割なし）

- 新規テスト 6 件（T-C1〜T-C3 / T-P1〜T-P3）を含む全変更を 1 実装サイクル・単一 PR で完了する。未タスク分離 0 件（`outputs/phase-12/unassigned-task-detection.md`）。
- スコープ外（先送りではなく本 Issue の課題外）: D1 drift 時の 401 redirect 挙動（全 member 共通の既存挙動）・`/me` status 体系・member 側 UX・管理画面側。根拠は `phase-1-requirements.md` §スコープ境界。

---

## 4. Phase 一覧

| Phase | ファイル | 内容 |
|-------|---------|------|
| 1 | `phase-1-requirements.md` | 要件定義・Issue 再スコープ（P50）・AC-1〜AC-9 |
| 2 | `phase-2-design.md` | `AdminAccessNotice` シグネチャ・DOM 契約・文言・配置 |
| 3 | `phase-3-design-review.md` | 4 条件評価・命名衝突検査・GO 判定 |
| 4 | `phase-4-test-plan.md` | テスト 6 件・AC↔テスト対応表・fixture 設計 |
| 5 | `phase-5-implementation.md` | 実装手順・コード例・DoD（CONST_005） |
| 6 | `phase-6-test-additions.md` | テスト実装例コード |
| 7 | `phase-7-coverage.md` | focused coverage 運用 |
| 8 | `phase-8-refactor.md` | リファクタ観点（極小差分） |
| 9 | `phase-9-qa.md` | 検証コマンド・grep gate |
| 10 | `phase-10-final-review.md` | AC 突合・最終レビュー |
| 11 | `phase-11-manual-test.md` | two-tier evidence（jsdom 一次 / staging user-gated） |
| 12 | `phase-12-documentation.md` | strict 7 outputs・ドキュメント同期 |
| 13 | `phase-13-pr.md` | user-gated commit/push/PR（base=dev） |

## 5. 検証コマンド（正本）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api packages
```

## 6. user-gated 境界

| 操作 | 状態 |
|------|------|
| コード実装・focused テスト実行 | 完了（local Vitest PASS） |
| staging 認証 runtime screenshot | user-gated（Claude Code は staging 認証ログインしない） |
| commit / push / PR（base=dev） | user-gated（CONST_002） |
| Issue #1192 の state 変更 | 行わない（CLOSED のまま維持） |
