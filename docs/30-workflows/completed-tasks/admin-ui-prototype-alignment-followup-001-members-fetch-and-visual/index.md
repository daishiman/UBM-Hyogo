---
workflow_id: admin-ui-prototype-alignment-followup-001-members-fetch-and-visual
workflow_state: implemented_local_runtime_pending
created_at: 2026-05-26
owner: daishiman
taskType: implementation
visualEvidence: VISUAL
implementation_mode: modify
parent_workflow: admin-ui-prototype-alignment
parent_workflow_state: implemented_local_runtime_pending
followup_id: followup-001
scope: /admin/members 一覧 + drawer をプロトタイプ準拠化し、ADMIN_FETCH_404 を解消する
---

# admin-ui-prototype-alignment follow-up 001 — `/admin/members` プロトタイプ準拠化 & 404 修復

[実装区分: 実装仕様書]

## 親 workflow trace

- 親: `docs/30-workflows/admin-ui-prototype-alignment/`（`implemented_local_runtime_pending`）
- 本 followup は親の Phase 11 runtime evidence 取得時にユーザーが staging で発見した 2 件の不適合（(a) `/admin/members` が `ADMIN_FETCH_404` で停止 / (b) 一覧 + drawer の UI がプロトタイプ `pages-admin.jsx` L162-366 と乖離）を解消するために新規発行された独立 workflow root。
- 親 workflow への変更は行わず、本 followup の workflow root で完結させる（親への mirror evidence 不要）。

## 0. 本仕様書の位置づけ

UBM 兵庫支部会 admin/members 画面において、以下 2 点を同 PR 内で解消する:

1. staging `/admin/members` が `読み込みに失敗 / admin api /admin/members failed: 404 / code ADMIN_FETCH_404` で停止している root cause を特定し fix する
2. `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366 (`AdminMembersPage`) と乖離している現行 UI（テーブル + drawer）をプロトタイプ準拠に置き換える

スコープは `/admin/members` 一覧 + drawer のみ。dashboard / tags / schema / meetings / requests / identity-conflicts / audit など他 admin route は本 followup の対象外。

## 1. 背景

### staging で観測された症状

| 観点 | 観測 |
|------|------|
| URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/members` |
| 観測者 | daishiman（プロジェクトオーナー） |
| 画面表示 | `AdminSectionErrorClient` 経由で `読み込みに失敗` / `admin api /admin/members failed: 404` / `code ADMIN_FETCH_404` |
| 一覧の状態 | テーブル本体は描画されない（fetch 失敗で early-return） |
| UI 設計 | 仮に fetch 成功しても、現行テーブル + drawer はプロトタイプから大きく乖離 |

### 現行実装 (`apps/web/src/features/admin/components/_members/`)

| ファイル | 行数 | 主な責務 | プロトタイプ gap |
|----------|------|---------|------------------|
| `MembersClientShell.tsx` | 90 | URL 同期 + selected set | 構造は流用可能 |
| `MembersTable.tsx` | 139 | 列 = checkbox / 氏名 / メール / 公開 / 同意 / 最終回答 のプレーンテーブル | avatar / chip / switch / tags chips / edit icon button なし |
| `MembersFilters.tsx` | 103 | search input + 3 `<select>` (zone / filter / sort) | pill-nav なし / count バッジなし / CSV・取り込み action 行なし |
| `MemberDrawer.tsx` | 203 | identity / status / audit を plain `<dl>` で表示 | VISIBILITY switch + memo / TAGS chip グループ / FORM RESPONSE KVList / DELETED ブロック なし |
| `BulkActionBar.tsx` | 75 | 一括操作 | 構造は流用可能（drawer 経由 mutation 不要時のみ表示） |

### 既存 API shape（`packages/shared/src/types/viewmodel/index.ts`）

- `AdminMemberListItem` = `{ memberId, responseEmail, fullName, publicConsent, rulesConsent, publishState, isDeleted, lastSubmittedAt }`
- `AdminMemberDetailView` = `{ identityMemberId, identityEmail, status:{publicConsent,rulesConsent,publishState,isDeleted,notificationOptOut}, profile, audit[] }`

プロトタイプ要求 field（`occupation` / `ubmZone` / `ubmMembershipType` / `tags` / `updatedAt` / `hue` / `businessOverview` / `location` / `responseId` / `submittedAt`）は API レスポンス本体 (`answers_json` + `profile` + tag store) から派生可能であり、新 endpoint は不要。

### 404 root cause 候補

1. (a) `safeServerFetch` の `baseUrl` 解決失敗（`INTERNAL_API_BASE_URL` 未設定 / staging で空文字 fallback）
2. (b) `apps/web/app/api/admin/[...path]/route.ts` の pass-through 不全（catch-all route の matching / method / Authorization header 転送）
3. (c) `require-admin` middleware の 401 → 404 マスク（auth fail を 404 で返す safety stub）
4. (d) `apps/api` の D1 binding 未配線（staging env で D1 binding が production と乖離）

Phase 5 T-5.1 で (a) → (b) → (c) → (d) の順に切り分け、原因に対応する最小修正を入れる。

## 2. スコープ

### 含む

- `/admin/members` 一覧（list + filters + page-head + action row）プロトタイプ準拠化
- `/admin/members` drawer（VISIBILITY / TAGS / FORM RESPONSE / DELETED block / footer）プロトタイプ準拠化
- `ADMIN_FETCH_404` root cause fix（4 仮説の切り分け + 修正）
- `AdminMemberListItem` / `AdminMemberDetailView` adapter 拡張（既存 endpoint レスポンスから派生フィールドを抽出。Zod schema は additive のみ）
- 不足 primitive 補充（`Chip` / `Avatar` / `Switch` / `KVList` は既存。`pill-nav` / `tag-pill` のうち未存在のみ最小追加）
- vitest unit spec + playwright visual baseline spec の追加
- staging deploy 後の runtime evidence 取得（Phase 11）

### 含まない

- dashboard / tags / schema / meetings / requests / identity-conflicts / audit の UI 変更（共有 primitive を新規追加した場合のみ最小限の influence）
- 新 API endpoint 追加 / D1 schema 変更 / Google Form 仕様変更（CLAUDE.md UI prototype alignment 不変条件 #1）
- production deploy（staging で AC 確認 → user-gated）
- `apps/web` から D1 直接アクセス（不変条件 #5）

## 3. 単一サイクル完結性（CONST_007）

本 followup は repo-local 実装・unit/visual test 追加・staging deploy 後 evidence 取得まで **1 サイクル内で完了させる**。先送り項目なし。
ただし以下は user-gated（外部 ops / mutation 操作）:

- staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` および apps/api 側も必要に応じて）
- visual baseline PNG の CI 生成 → commit
- commit / push / PR

## 4. 関連 spec / 参照

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366
- 既存実装: `apps/web/src/features/admin/components/_members/`
- API shape: `packages/shared/src/types/viewmodel/index.ts`
- API route: `apps/api/src/routes/admin/members.ts`
- Web proxy: `apps/web/app/api/admin/[...path]/route.ts`
- safeServerFetch: `apps/web/src/lib/admin/safe-server-fetch.ts`
- design tokens 正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- CLAUDE.md UI prototype alignment 不変条件
- skill: `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`

## 5. Phase 一覧

| Phase | ファイル | 概要 |
|-------|----------|------|
| 1 | `phase-1-requirements.md` | 要件・不変条件・受入条件 |
| 2 | `phase-2-design.md` | プロトタイプ抽出 UI 構成要素 + adapter 設計 + 404 切り分け設計 |
| 3 | `phase-3-design-review.md` | design review |
| 4 | `phase-4-test-plan.md` | vitest unit + playwright visual baseline テスト計画 |
| 5 | `phase-5-implementation.md` | T-5.1〜T-5.8 の並列 task 群（変更ファイル / シグネチャ / 入出力 / テスト / 実行コマンド / DoD） |
| 6 | `phase-6-test-additions.md` | テスト追加 |
| 7 | `phase-7-coverage.md` | coverage 確認 |
| 8 | `phase-8-refactor.md` | refactor |
| 9 | `phase-9-qa.md` | QA |
| 10 | `phase-10-final-review.md` | final review |
| 11 | `phase-11-manual-test.md` | staging evidence 取得 + Phase 11 evidence 表 |
| 12 | `phase-12-documentation.md` + `outputs/phase-12/implementation-guide.md` 等 strict 7 | documentation |
| 13 | `phase-13-pr.md` | PR base=dev、本文テンプレ、品質 4 コマンド |
