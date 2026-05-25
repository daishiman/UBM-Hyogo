---
phase: 11
title: Evidence inventory — outputs/phase-11/ canonical path ledger
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 11 — Evidence inventory（重点 Phase）

[実装区分: 実装仕様書]

## 1. canonical 配置ルート

`docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/outputs/phase-11/`

すべての evidence はこのディレクトリ配下に物理コミットする。`gh artifact download` 等の動的取得には依存しない（Phase 12 evidence existence validator で物理存在をチェックするため）。

## 2. Evidence inventory ledger

### 2.1 ログファイル

| # | canonical path（ledger キー） | 取得コマンド | status |
|---|---|---|---|
| L-01 | `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee ...` | pending |
| L-02 | `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm lint 2>&1 \| tee ...` | pending |
| L-03 | `outputs/phase-11/evidence/build.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee ...` | pending |
| L-04 | `outputs/phase-11/evidence/staging-deploy.log` | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging 2>&1 \| tee ...`（**Token/OAuth 値混入なしを確認**） | pending |
| L-05 | `outputs/phase-11/evidence/playwright-staging-visual.log` | `... e2e:visual:staging 2>&1 \| tee ...` | pending |
| L-06 | `outputs/phase-11/evidence/verify-pr-ready.log` | `bash scripts/verify-pr-ready.sh 2>&1 \| tee ...` | pending |
| L-07 | `outputs/phase-11/evidence/verify-phase12-compliance.log` | `mise exec -- pnpm verify:phase12-compliance 2>&1 \| tee ...` | pending |

### 2.2 visual screenshot（staging runtime）

| # | canonical path | 取得元 | status |
|---|---|---|---|
| S-01 | `outputs/phase-11/screenshots/public-top.png` | `apps/web/playwright/tests/visual-staging/public-top.spec.ts-snapshots/public-top-staging-visual-chromium-linux.png` を複製 | pending |
| S-02 | `outputs/phase-11/screenshots/login.png` | `apps/web/playwright/tests/visual-staging/login.spec.ts-snapshots/login-staging-visual-chromium-linux.png` を複製 | pending |
| S-03 | `outputs/phase-11/screenshots/profile.png` | `apps/web/playwright/tests/visual-staging/profile.spec.ts-snapshots/profile-staging-visual-chromium-linux.png` を複製 | pending |
| S-04 | `outputs/phase-11/screenshots/admin-dashboard.png` | `apps/web/playwright/tests/visual-staging/admin-dashboard.spec.ts-snapshots/admin-dashboard-staging-visual-chromium-linux.png` を複製 | pending |

### 2.3 metadata / governance

| # | canonical path | 内容 | status |
|---|---|---|---|
| M-01 | `outputs/phase-11/phase11-capture-metadata.json` | capture metadata contract（required evidence / screenshots） | present |
| M-02 | `outputs/phase-11/required-status-checks.md` | Phase 7 §2 の context 名リスト（branch protection 候補） | pending |
| M-03 | `outputs/phase-11/staging-baseline-meta.json` | 4 spec baseline PNG 一覧 + staging URL + deploy version + chromium version + 取得日時 | pending |
| M-04 | `outputs/phase-11/root-gate-release.md` | parent `index.md` / `artifacts.json` の `VISUAL_RUNTIME_PENDING` → `VISUAL_RUNTIME_OK` + Gate-B/C `passed` 解除 diff 記録 | pending |

### 2.4 spec-created contract files

| # | canonical path | 内容 | status |
|---|---|---|---|
| C-01 | `outputs/phase-11/main.md` | Phase 11 runtime evidence boundary index | present |
| C-02 | `outputs/phase-11/manual-test-result.md` | Phase 1-13 spec walkthrough result | present |
| C-03 | `outputs/phase-11/screenshot-plan.json` | 4 screenshot capture contract | present |

## 3. status 遷移ルール

| status | 意味 |
|--------|------|
| `pending` | ファイル未作成 |
| `present` | ファイル物理存在・サイズ > 0 |
| `verified` | 物理存在 + Phase 12 evidence existence validator で OK |

DoD（Phase 8 D-12）は **全 evidence が present 以上** を要求する。

## 4. runtime gate metadata schema 要件

Implementation cycle で runtime gate metadata を生成する場合は `pnpm gate-metadata:validate` の zod schema に準拠する。spec-created 時点では `outputs/phase-11/phase11-capture-metadata.json` が必要ファイル一覧を保持し、実 runtime gate 結果は pending とする:

```json
{
  "workflow_id": "ut-dsf-07-staging-visual-runtime-evidence",
  "gates": [
    { "id": "G1-staging-deploy", "status": "passed", "passed_at": "2026-MM-DDTHH:MM:SSZ", "evidence_path": "outputs/phase-11/evidence/staging-deploy.log" },
    { "id": "G2-staging-visual", "status": "passed", "passed_at": "2026-MM-DDTHH:MM:SSZ", "evidence_path": "outputs/phase-11/evidence/playwright-staging-visual.log" },
    { "id": "G3-typecheck", "status": "passed", "passed_at": "2026-MM-DDTHH:MM:SSZ", "evidence_path": "outputs/phase-11/evidence/typecheck.log" },
    { "id": "G4-lint", "status": "passed", "passed_at": "2026-MM-DDTHH:MM:SSZ", "evidence_path": "outputs/phase-11/evidence/lint.log" },
    { "id": "G5-build", "status": "passed", "passed_at": "2026-MM-DDTHH:MM:SSZ", "evidence_path": "outputs/phase-11/evidence/build.log" },
    { "id": "G6-verify-pr-ready", "status": "passed", "passed_at": "2026-MM-DDTHH:MM:SSZ", "evidence_path": "outputs/phase-11/evidence/verify-pr-ready.log" },
    { "id": "G7-root-gate-release", "status": "passed", "passed_at": "2026-MM-DDTHH:MM:SSZ", "evidence_path": "outputs/phase-11/root-gate-release.md" }
  ]
}
```

- `status` enum: `passed` / `failed` / `skipped`
- `passed_at` は ISO 8601 datetime
- `evidence_path` は workflow root 相対パス

## 5. M-03 staging-baseline-meta.json 例

```json
{
  "staging_url": "https://ubm-hyogo-web-staging.daishimanju.workers.dev",
  "deploy_version_id": "<wrangler version id>",
  "chromium_version": "<playwright chromium revision>",
  "captured_at": "2026-MM-DDTHH:MM:SSZ",
  "baselines": [
    "apps/web/playwright/tests/visual-staging/public-top.spec.ts-snapshots/public-top-staging-visual-chromium-linux.png",
    "apps/web/playwright/tests/visual-staging/login.spec.ts-snapshots/login-staging-visual-chromium-linux.png",
    "apps/web/playwright/tests/visual-staging/profile.spec.ts-snapshots/profile-staging-visual-chromium-linux.png",
    "apps/web/playwright/tests/visual-staging/admin-dashboard.spec.ts-snapshots/admin-dashboard-staging-visual-chromium-linux.png"
  ]
}
```

## 6. ファイル収集手順

```bash
WF=docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence
mkdir -p "$WF/outputs/phase-11/screenshots"
# log は Phase 10 §2 のコマンドで自動配置
# screenshot は Phase 10 §4 の cp で同期
# M-01..M-04 は手書きで配置
```

## 7. inventory 完成判定

| 条件 | 検証 |
|------|------|
| 全 runtime entry（L-01..L-07 / S-01..S-04 / M-02..M-04）が `present` | `find outputs/phase-11 -type f \| wc -l` で >= 18 |
| 全 entry の status が ledger と一致 | Phase 12 evidence existence validator |
| `artifacts.json` が gate-metadata zod schema を通過 | `mise exec -- pnpm gate-metadata:validate` |
| screenshot 4 枚が staging baseline と byte 一致 | `diff` または md5 比較（任意） |

## 8. screenshot canonical 命名整合（FB-LLM-MOD-05-001）

semantic canonical 名 `<screen>.png`（`public-top` / `login` / `profile` / `admin-dashboard`）を、(1) 本 Phase 11 表、(2) Phase 5 baseline path、(3) Phase 13 PR body Screenshots、(4) M-03 metadata の 4 か所で一致させる。
