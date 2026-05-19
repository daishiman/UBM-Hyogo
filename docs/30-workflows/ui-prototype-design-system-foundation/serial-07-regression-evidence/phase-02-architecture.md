---
phase: 2
title: アーキテクチャ — Playwright visual baseline / CI gate / required check 構成
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 2 — アーキテクチャ設計

[実装区分: 実装仕様書]

## 1. 全体構成（regression 経路）

```
serial-00..06 実装完了
   ↓
serial-07: 4 spec で route を起動 → snapshot 比較
   ↓
baseline snapshot（committed PNG） ── git diff fail = regression
   ↓
CI: playwright-smoke / playwright-visual-full / verify-design-tokens / verify-phase12-compliance / verify-gate-metadata / verify-indexes
   ↓
required status check として dev / main の branch protection に登録
```

## 2. Playwright config と spec の組み込み

### 2.1 既存 config の再利用

`apps/web/playwright.config.ts` L31-L36 で `/visual/` を含む argv は **`isTask18RegressionGate = true`** にフォールバックされる。本 SW では追加の env 名は不要で、既存 visual gate と同じ runner / EVIDENCE_DIR / webServer 構成を共用する。

| 項目 | 値 | 出典 |
|------|-----|------|
| spec 配置 | `apps/web/playwright/tests/visual/` | 既存パターン（`public-top.spec.ts` / `admin-dashboard.spec.ts`） |
| baseline 配置 | `apps/web/playwright/tests/visual/<name>.spec.ts-snapshots/<name>.png` | Playwright 既定 |
| baseURL | `http://localhost:3000`（local）/ `PLAYWRIGHT_BASE_URL` env | config L72 |
| mock API | `http://127.0.0.1:8787`（`apps/web/playwright/fixtures/auth.ts` の `mockApi` server） | config L82 / fixtures/auth.ts L24-L99 |
| viewport | `chromium` 既定（desktop） | config 既定 |
| flake 防止 | `animation/transition/caret-color` を `addStyleTag` で disable | 既存 spec パターン |

### 2.2 snapshot 比較設定

| 項目 | 値 |
|------|-----|
| `maxDiffPixelRatio` | `0.02`（既存 spec と整合） |
| `fullPage` | `true`（top / list / detail / dashboard すべて） |
| baseline 不在時の挙動 | 初回実行で自動生成し、コミット対象とする |
| 更新経路 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual --update-snapshots` |

## 3. CI workflow 構成

### 3.1 既存を流用する workflow（変更なし or path 追加のみ）

| workflow | 役割 | 本 SW での変更 |
|---------|------|--------------|
| `playwright-smoke.yml` | smoke + visual(chromium, 4 screens) | path に `apps/web/playwright/tests/visual/**` を含むか確認、不足時のみ追加 |
| `playwright-visual-full.yml` | nightly full visual | 変更なし（既存の `visual-full/` 配下 baseline を継続管理） |
| `verify-design-tokens.yml` | HEX/任意色 utility 0 件 gate | 変更なし |
| `verify-phase12-compliance.yml` | Phase 11 evidence existence | 変更なし |
| `verify-gate-metadata.yml` | artifacts.json zod schema | 変更なし |
| `verify-indexes.yml` | indexes drift | 変更なし |

### 3.2 required status check 候補（branch protection 登録は user-gated）

| context 名 | 出所 |
|-----------|------|
| `verify-design-tokens / verify-design-tokens` | `.github/workflows/verify-design-tokens.yml` |
| `playwright-smoke / smoke (chromium)` | `.github/workflows/playwright-smoke.yml` |
| `playwright-smoke / visual (chromium, 4 screens)` | `.github/workflows/playwright-smoke.yml` |
| `verify-phase12-compliance / verify` | `.github/workflows/verify-phase12-compliance.yml` |
| `verify-gate-metadata / verify` | `.github/workflows/verify-gate-metadata.yml` |
| `verify-indexes-up-to-date / verify` | `.github/workflows/verify-indexes.yml` |

> 実際の `gh api -X PUT` での branch protection 更新は CLAUDE.md の方針に従い、本 SW のスコープには含めない（read-only before JSON のみ Phase 11 evidence として取得可能）。

## 4. baseline 管理戦略

### 4.1 `.gitignore` 確認

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/.gitignore` で `apps/web/playwright/tests/visual/*.spec.ts-snapshots/` は除外**されない**（評価済）。snapshot PNG は git にコミットする。

### 4.2 baseline drift 対策

| ケース | 対応 |
|------|------|
| ローカル macOS と CI ubuntu の font rendering 差 | CI 上で生成した baseline を正本とする。ローカル `--update-snapshots` の差分はコミットしない |
| 意図したデザイン更新による drift | serial-00〜06 のいずれかの SW で `--update-snapshots` を実施し、本 SW 着手時には baseline 安定済とする |
| snapshot baseline 不在 | 本 SW 初回実行時に CI 上で生成し、追跡 PR にコミット |

## 5. mock API seed 戦略

### 5.1 既存 `mockApi` fixture を再利用

`apps/web/playwright/fixtures/auth.ts` の `mockApi` は `MOCK_API_PORT=8787` で http server を立て、`MockApi.reset()` / `setVisibilityPending()` 等の制御 API を提供する。本 SW の 4 spec はすべてこの fixture を `void mockApi` で初期化する（既存 `public-top.spec.ts` 同形）。

### 5.2 各 spec の seed 要件

| spec | 認証 | mock seed |
|------|------|---------|
| top.spec.ts | 不要 | デフォルト（公開 KPI / preview） |
| members-list.spec.ts | 不要 | デフォルト（公開 members 一覧） |
| member-detail.spec.ts | 不要 | デフォルト（公開 member 1 件 + response_fields） |
| admin-dashboard.spec.ts | `adminLogin(context)` | デフォルト（管理 KPI） |

詳細 endpoint shape は Phase 4 で定義。

## 6. 採用しない選択肢

| 選択肢 | 不採用理由 |
|--------|----------|
| 新規 mock API server を立てる | 既存 `mockApi` で十分。新規追加は flake 源 |
| visual baseline を artifact のみで管理（git にコミットしない） | regression を git diff で機械検出できなくなる |
| viewport を desktop / tablet / mobile の 3 系統に拡張 | 本 SW スコープは「最小 4 screens」。3 viewport 展開は `playwright-visual-full.yml` の役割で既存 |
| 新規 CI workflow ファイル追加 | 既存 6 workflow で完結。新規追加は orchestration コスト増 |
