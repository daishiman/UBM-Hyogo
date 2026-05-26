---
workflow_id: issue-902-members-staging-visual-baseline
workflow_state: implemented_local_runtime_pending
created_at: 2026-05-25
owner: daishiman
taskType: implementation
visualEvidence: VISUAL
implementation_mode: modify
source_issue: 902
source_issue_state: CLOSED
parent_workflow: ut-dsf-07-staging-visual-runtime-evidence
parent_gate: VISUAL_RUNTIME_PENDING
---

# issue-902 — `/members`（一覧）・`/members/[id]`（詳細）の staging visual baseline 拡張

[実装区分: 実装仕様書]

## 0. 本仕様書の位置づけと issue 最適化判定

本ワークフローは GitHub issue [#902](https://github.com/daishiman/UBM-Hyogo/issues/902)（`[UT-DSF-07-FU-02]`, state: **CLOSED**）を、現在のコードベースに最適化して根本解決するための実装仕様書である。issue は CLOSED のままで運用する（再オープンしない）。

### 0.1 調査結論: 本タスクは未解決（別タスクでも解決されていない）

| 確認軸 | 状態 | 根拠 |
|--------|------|------|
| `staging-visual` Playwright project の存在 | ✅ 既存 | `apps/web/playwright.config.ts` L236-250（`testMatch: /visual-staging\/.*\.spec\.ts$/`、`baseURL=stagingBaseURL`） |
| 既存 `staging-visual` spec 4 件 | ✅ 既存 | `apps/web/playwright/tests/visual-staging/{public-top,login,profile,admin-dashboard}.spec.ts` |
| **`/members`（一覧）の staging-visual spec** | ❌ 未実装 | `find apps/web/playwright/tests/visual-staging/` に `members-list.spec.ts` 不在 |
| **`/members/[id]`（詳細）の staging-visual spec** | ❌ 未実装 | 同上に `member-detail.spec.ts` 不在 |
| `playwright-smoke.yml` の `staging-visual` job 名 | ⚠️ 旧表記 | `name: staging-visual (chromium, 4 screens)`（`.github/workflows/playwright-smoke.yml` L100, L116） |

> UT-DSF-07 親 workflow は 4 screens（public-top / login / profile / admin-dashboard）のみで closure している。本 follow-up（FU-02）の members-list / member-detail は未追加で、別タスク（issue #901 認証後 visual 等）でも cover されていない。よって本タスクは実施が必要。

### 0.2 issue 原文からの最適化

| 項目 | issue 原文 | 現コード実態 | 本仕様の採用 |
|------|-----------|------------|------------|
| 追加対象 spec | `members-list.spec.ts` + `member-detail.spec.ts` | 親 `staging-visual` project 構造はそのまま流用可能 | issue 原文どおり 2 spec を追加 |
| `playwright.config.ts` 変更 | 「原則不要、新 spec 追加のみ」 | 現行 `testMatch: /visual-staging\/.*\.spec\.ts$/` で自動マッチ | config 変更なし（spec ファイル追加のみ） |
| job 名表記 | 「4 → 6 screens に更新」 | `staging-visual (chromium, 4 screens)` | `staging-visual (chromium, 6 screens)` に更新 |
| member-detail の代表 ID | 「`PLAYWRIGHT_MEMBER_DETAIL_ID` 環境変数で上書き可能、未指定時は seed-pinned」 | seed-pinned 代表 ID は staging 側で未確立 | **環境変数 `PLAYWRIGHT_MEMBER_DETAIL_ID` 指定時のみ実行、未指定時は `test.skip` で安全フォールバック**。CI ワークフローでの secrets / vars 注入は本タスク含まず（job 名更新のみ） |
| evidence 配置 | 親 UT-DSF-07 配下、または昇格時の新 workflow root | 親 UT-DSF-07 は spec_created で closure 待ち | **本ワークフロー root（`docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/outputs/phase-11/`）に配置**。親への evidence mirror は不要（独立 workflow root として運用） |

### 0.3 根本問題と解法の核心

1. **member-detail は動的ルート（`[id]`）で seed 実データ依存**: `apps/web/app/(public)/members/[id]/page.tsx` は `export const dynamic = "force-dynamic"` + `fetchPublicOrNotFound` で SSR fetch する。seed 変更で 404 に化けて baseline が guard 画面に置換される flake が起きる。
   - 解法: 環境変数 `PLAYWRIGHT_MEMBER_DETAIL_ID` で代表 ID を注入し、未指定時は `test.skip` で安全停止する（seed 不在環境での noise を排除）。
2. **members-list は filter/sort/pagination で描画が変動**: `searchParams` を zod parse して `listMembers` で描画するため、query を付けるほど変動する。
   - 解法: 初期表示（filter 無し・1 ページ目・既定 density）のみを baseline 対象とする。
3. **SSR fetch は `page.route()` で差し替え不可**（Worker サーバー fetch）。検証対象は OpenNext bundle の design system 描画（OKLch / `@layer` / rhythm / primitives）の local との等価性であって、API データ内容ではない。`page.route('**/api/**', route => route.continue())` で client-side 動的 fetch のみ安定化する。
4. **baseline は CI ubuntu-latest 生成の `-staging-visual-chromium-linux.png` を正本**（macOS local の `-darwin.png` はコミットしない。`playwright-smoke.yml` の baseline 更新 dispatch で生成 → artifact download → commit する 2 段階フロー）。

## 1. 目的

UT-DSF-07-FU-02 として、`/members` 初期表示と `/members/[id]` 代表 1 件の **production-equivalent runtime（Cloudflare Workers staging）visual baseline** を取得し、staging-visual project の cover 範囲を 4 → 6 screens へ拡張する。

## 2. スコープ

### 含む

- `apps/web/playwright/tests/visual-staging/members-list.spec.ts`（新規 / 初期表示・filter 無し 1 ページ目）
- `apps/web/playwright/tests/visual-staging/member-detail.spec.ts`（新規 / `PLAYWRIGHT_MEMBER_DETAIL_ID` 指定時のみ実行、未指定時 `test.skip`）
- `.github/workflows/playwright-smoke.yml` の `staging-visual` job 名表記更新（`4 screens` → `6 screens`）
- 上記 2 spec の baseline PNG（`-staging-visual-chromium-linux.png`）2 枚を取得・コミット（CI ubuntu-latest 生成を正本）
- `outputs/phase-11/evidence/` への screenshot + 取得ログ配置

### 含まない

- 新規 API endpoint 追加 / D1 schema 変更 / Google Form 仕様変更（CLAUDE.md UI prototype alignment 不変条件 #1）
- 認証後画面の取得（UT-DSF-07-FU-01 / issue #901 の責務）
- 新規 mock fixture 追加（staging 実 API データ由来で取得）
- `playwright.config.ts` 変更（既存 `staging-visual` project の testMatch で自動マッチするため）
- staging seed への代表メンバー投入（infra 作業。本仕様ではユーザー判断で実施 or `PLAYWRIGHT_MEMBER_DETAIL_ID` 注入のいずれかで対応）
- CI ワークフローへの `PLAYWRIGHT_MEMBER_DETAIL_ID` 注入（job 名更新のみ。env 注入は user-gated として phase-13 に分離）
- local `visual-chromium` project（`visual/*.spec.ts`）の baseline 取り直し

## 3. 単一サイクル完結性（CONST_007）

本仕様の repo-local 変更（2 spec 新規 + workflow dispatch input/job 表記更新 + 仕様同期）は 1 サイクル内で完了済み。先送り項目なし。
ただし以下は user-gated（外部 ops / commit 操作のため phase-13 で扱う）:

- staging への deploy 確認（`scripts/cf.sh deploy --env staging`）
- CI dispatch による baseline PNG 生成と artifact download → commit
- `PLAYWRIGHT_MEMBER_DETAIL_ID` の staging 環境向け値決定（workflow_dispatch input `staging_visual_member_detail_id` として注入可能）

## 4. 参照

- 親 unassigned-task: `docs/30-workflows/unassigned-task/UT-DSF-07-FU-02-members-list-detail-staging-visual.md`
- 親 canonical workflow: `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/`
- 既存 staging-visual specs: `apps/web/playwright/tests/visual-staging/{public-top,login,profile,admin-dashboard}.spec.ts`
- Playwright config: `apps/web/playwright.config.ts` L236-250（`staging-visual` project）
- workflow: `.github/workflows/playwright-smoke.yml` `staging-visual` job
- pages: `apps/web/app/(public)/members/page.tsx`, `apps/web/app/(public)/members/[id]/page.tsx`
- skill: `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- CLAUDE.md「UI prototype alignment 不変条件」「apps/web env アクセス不変条件」「Cloudflare 系 CLI 実行ルール」
