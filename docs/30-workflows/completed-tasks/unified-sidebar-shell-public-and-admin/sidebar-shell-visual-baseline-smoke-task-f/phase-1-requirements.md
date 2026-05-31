---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 1
phase_name: 要件定義
created_at: 2026-05-29
task_type: visual baseline / smoke / CI integration
visual_category: VISUAL
implementation_mode: new
parent_workflow: docs/30-workflows/unified-sidebar-shell-public-and-admin/
source_task: docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-F-visual-baseline-smoke.md
branch: docs/task-f-visual-baseline-smoke-spec
---

# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 1. ゴール

親 Task A〜E で統合された collapsible Sidebar Shell（公開／会員／管理の 3 層共通）に対し、
Playwright で **3 ロール × 3 viewport** の visual baseline（7 screenshot）と **6 smoke ケース** を
捕捉し、shell regression を CI で検出可能にする。

非ゴール:
- 親 Task A〜E の shell 実装本体（先行完了が前提）
- admin route 個別の visual baseline（`admin-visual-baseline-admin-routes-task-e` で別途取得済）
- 新規 storageState / mint 経路の追加（既存 `apps/web/playwright/fixtures/auth.ts` の拡張 `test` を継承）

---

## 2. 背景（観察事実）

- E2E 正本は `apps/web/playwright/tests/`。`apps/web/tests/e2e/` には `staging-smoke.spec.ts` のみ存在し、
  source task が記載した `apps/web/tests/e2e/sidebar-shell-*.spec.ts` パスは現行構造と乖離している（§7 で補正）。
- 既存 auth fixture `apps/web/playwright/fixtures/auth.ts` は `@playwright/test` の `test` を拡張し、
  `anonymousPage` / `memberPage` / `adminPage` の 3 役 Page と `mockApi`（client-side GET の mock サーバ）を提供する。
  source task が記載した `viewerStorageState` / `memberStorageState` / `adminStorageState` という export は**存在しない**。
- 既存 viewport fixture `apps/web/playwright/fixtures/viewports.ts` は `desktop 1280×800` / `tablet 768×1024` /
  `mobile 390×844`。source task は mobile を `375×812` と指定しており、ここに差分がある（Phase 3 R3 で判断）。
- 既存 `playwright.config.ts` は `admin-staging-visual-*`（Task E）で `snapshotPathTemplate`
  `{testDir}/{testFileName}-snapshots/{arg}-admin-staging-visual-<viewport>-{platform}{ext}` を採用済み。
  Task F も同方式で `{arg}-sidebar-shell-visual-<viewport>-{platform}{ext}` を採用する。
- 既存 multi-viewport local visual の前例: `visual-full-chromium-{desktop,tablet,mobile}` project（`./playwright/tests/visual-full`）。
  Task F の visual baseline はこの local visual 系（`mockApi` + auth fixture）に倣い、staging ではなく local 撮影とする。
- shell component（`apps/web/src/components/shell/`）は親 workflow が `spec_created` のため**まだ未実装**。
  smoke の selector は親 design spec（`unified-sidebar-shell-public-and-admin/index.md` のロール語彙・nav 構成）から導出する。

---

## 3. 対象マトリクス

### 3.1 smoke（6 ケース）

| # | ケース | ロール / viewport | 期待 |
|---|--------|------------------|------|
| S1 | `viewer` で `/` を開く | viewer / desktop | sidebar に PUBLIC グループのみ、左下に「ログイン」リンク |
| S2 | `member` で `/profile` を開く | member / desktop | sidebar に PUBLIC + MEMBERS、左下 popover に 3 action |
| S3 | `admin` で `/admin` を開く | admin / desktop | sidebar に 3 group + ADMIN 9 item（total 13）、左下 popover に 4 action（「管理者ダッシュボード」含む） |
| S4 | 375px で `/` を開く | viewer / mobile 375 | sidebar 非表示、hamburger 押下で drawer overlay 表示 |
| S5 | 1024px で collapse toggle 押下 | viewer or member / 1024幅 | sidebar が collapsed（icon のみ）になり localStorage に反映 |
| S6 | route 遷移時 drawer auto-close | viewer / mobile 375 | drawer 内リンクをクリックすると drawer が閉じる |

### 3.2 visual baseline（7 screenshot / task-F 表に準拠）

| # | viewport | role | screenshot 引数（toHaveScreenshot arg） |
|---|----------|------|------------------------------------------|
| V1 | 1280×800 | viewer | `home-1280.png` |
| V2 | 1280×800 | member | `profile-1280.png` |
| V3 | 1280×800 | admin  | `admin-1280.png` |
| V4 | 768×1024 | viewer | `home-768.png` |
| V5 | 768×1024 | admin  | `admin-768.png` |
| V6 | 375×812  | viewer | `home-375.png` |
| V7 | 375×812  | admin（drawer open） | `admin-375-drawer.png` |

> task-F は `/-1280.png` 等のファイル名を例示するが、Playwright の `toHaveScreenshot` 第 1 引数に
> パス区切り `/` を含めると snapshot dir 階層が割れるため、本仕様では `home-` prefix へ正規化する（Phase 3 R5）。

---

## 4. Acceptance Criteria

- **AC-1**: `apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts` に S1〜S6 の 6 smoke ケースを実装し、`smoke-chromium` 系の local 実行で green（diff/失敗 0）。
- **AC-2**: `apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts` で V1〜V7 の 7 screenshot baseline を生成する。baseline は `-linux.png` 正本（macOS 撮影分は commit しない）。
- **AC-3**: visual baseline は 3 viewport project（`sidebar-shell-visual-desktop/tablet/mobile`）で run し、role ごとに `anonymousPage` / `memberPage` / `adminPage`（auth fixture）を使い分ける。
- **AC-4**: 共通操作（drawer open / collapse toggle）を `apps/web/playwright/tests/sidebar-shell/_helpers.ts` に集約し、smoke / visual 両 spec から再利用する。
- **AC-5**: `.github/workflows/playwright-smoke.yml` に (a) `smoke (chromium)` matrix へ `sidebar-shell-smoke` を追加、(b) `visual (sidebar-shell)` 新 matrix（3 viewport）を追加し、CI で green。
- **AC-6**: regression（意図的に shell token / layout を破壊した dry-run）で visual diff が detect される。
- **AC-7**: required status check 候補一覧を Phase 13 に列挙（実 PUT は user-gated）。
- **AC-8**: 新規 storageState / mint 経路を作らず、既存 `auth.ts` 拡張 `test`（`anonymousPage`/`memberPage`/`adminPage` + `mockApi`）のみ使用する。

---

## 5. 不変条件

1. `-linux.png` を正本とし macOS 撮影分は commit しない（CI Linux runner で撮影）。
2. 認証経路は既存 `apps/web/playwright/fixtures/auth.ts` の拡張 `test` を継承し、新規 storageState を作らない（AC-8）。
3. spec ファイルは `*.spec.ts` のみ（`.test.ts` 禁止、lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix` で reject。CLAUDE.md 不変条件 #8）。
4. デザイントークンは `apps/web/src/styles/tokens.css` の OKLch 正本のみ。HEX 直書き / `bg-[#xxx]` 禁止（`verify-design-tokens` gate）。本 spec 自体は CSS を変更しないが regression dry-run の対象 token として参照する。
5. bot による baseline push は GITHUB_TOKEN ゆえ `pull_request` 非発火 → 空コミット再トリガーを Phase 5/13 に明記。
6. `toHaveScreenshot` の引数にパス区切り `/` を含めない（`home-` prefix へ正規化）。
7. smoke / visual は local（`mockApi` + auth fixture）で完結させ、staging API には依存しない。
8. D1 / API / Google Form 仕様の追加変更なし（read-only GET の mock のみ）。

---

## 6. 依存

- Task A（sidebar shell primitive）
- Task B（user menu and role handling）
- Task C（public and member layout integration）
- Task D（admin layout migration）
- Task E（mobile drawer responsive）

すべて完了・統合後でないと Task F は着手しない（Phase 10 ゲートで確認）。これは sibling task への
技術的依存であり CONST_007 の「先送り」ではない。

---

## 7. パストポロジ補正（Phase 1 path topology verification gate）

`.claude/skills/task-specification-creator/references/phase-01-path-topology-verification-gate.md` に従い、
source task の参照パスを現行 worktree の実構造に対して検証した結果、以下を補正する。

| source task の記載 | 検証結果 | 補正後の正規パス |
|---|---|---|
| `apps/web/tests/e2e/sidebar-shell-smoke.spec.ts` | `apps/web/tests/e2e/` は `staging-smoke.spec.ts` のみ。E2E 正本 dir は `apps/web/playwright/tests/` | `apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts` |
| `apps/web/tests/e2e/sidebar-shell-visual.spec.ts` | 同上 | `apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts` |
| `apps/web/tests/e2e/_helpers/sidebar.ts` | 同上。admin-shell の前例は `_helpers.ts`（同階層） | `apps/web/playwright/tests/sidebar-shell/_helpers.ts` |
| `apps/web/tests/e2e/fixtures/auth.ts` の `*StorageState` | 実 fixture は `apps/web/playwright/fixtures/auth.ts`。export は拡張 `test`（`anonymousPage`/`memberPage`/`adminPage` + `mockApi`）で storageState 名 export は不在 | `apps/web/playwright/fixtures/auth.ts` の `test` を import し、viewer=`anonymousPage` / member=`memberPage` / admin=`adminPage` にマップ |

検証コマンド（Phase 5 着手時に再実行し 0 件 / 実在を確認）:

```bash
# source task の旧パスが実在しないこと
test ! -e apps/web/tests/e2e/_helpers/sidebar.ts && echo "OK: legacy helper path absent"
# 正規 fixture が実在すること
test -f apps/web/playwright/fixtures/auth.ts && echo "OK: canonical auth fixture present"
# auth fixture が期待 export を持つこと
git grep -n "anonymousPage\|memberPage\|adminPage" -- apps/web/playwright/fixtures/auth.ts | head
```

---

## 8. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保すること。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| auth security core | `.claude/skills/aiworkflow-requirements/references/architecture-auth-security-core.md` | session / role 判定（`session.isAdmin`）の正本 |
| architecture overview | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | 3 層（公開/会員/管理）構成の正本 |

### プロジェクト内参照

| 参照先 | 用途 |
|---|---|
| `docs/30-workflows/unified-sidebar-shell-public-and-admin/index.md` | ロール語彙・nav 構成・不変条件の正本 |
| `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/` | visual baseline / CI / 空コミット再トリガーの前例 |
| `apps/web/playwright/fixtures/auth.ts` | 拡張 `test`（anonymousPage/memberPage/adminPage + mockApi） |
| `apps/web/playwright/fixtures/viewports.ts` | VIEWPORTS 定義 |
| `apps/web/playwright.config.ts` | project / snapshotPathTemplate 設定 |
