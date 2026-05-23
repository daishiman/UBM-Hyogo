---
phase: 11
title: Evidence inventory — outputs/phase-11/ canonical path ledger
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 11 — Evidence inventory（重点 Phase）

[実装区分: 実装仕様書]

## 1. canonical 配置ルート

`docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/outputs/phase-11/`

すべての evidence ファイルはこのディレクトリ配下に物理コミットする。`gh artifact download` 等の動的取得には依存しない（Phase 12 evidence existence validator で物理存在をチェックするため）。

## 2. Evidence inventory ledger

### 2.1 ログファイル

| # | canonical path（ledger キー） | 取得コマンド | status |
|---|---|---|---|
| L-01 | `outputs/phase-11/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee ...` | pending |
| L-02 | `outputs/phase-11/lint.log` | `mise exec -- pnpm lint 2>&1 \| tee ...` | pending |
| L-03 | `outputs/phase-11/build.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee ...` | pending |
| L-04 | `outputs/phase-11/verify-design-tokens.log` | `mise exec -- pnpm verify:tokens 2>&1 \| tee ...` | pending |
| L-05 | `outputs/phase-11/playwright-visual.log` | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual 2>&1 \| tee ...` | pending |
| L-06 | `outputs/phase-11/verify-pr-ready.log` | `bash scripts/verify-pr-ready.sh 2>&1 \| tee ...` | pending |
| L-07 | `outputs/phase-11/verify-phase12-compliance.log` | `mise exec -- pnpm verify:phase12-compliance 2>&1 \| tee ...` | pending |

### 2.2 visual screenshot

| # | canonical path | 取得元 | status |
|---|---|---|---|
| S-01 | `outputs/phase-11/screenshots/top.png` | `apps/web/playwright/tests/visual/top.spec.ts-snapshots/top-chromium-linux.png` を複製 | pending |
| S-02 | `outputs/phase-11/screenshots/members-list.png` | `apps/web/playwright/tests/visual/members-list.spec.ts-snapshots/members-list-chromium-linux.png` を複製 | pending |
| S-03 | `outputs/phase-11/screenshots/member-detail.png` | `apps/web/playwright/tests/visual/member-detail.spec.ts-snapshots/member-detail-chromium-linux.png` を複製 | pending |
| S-04 | `outputs/phase-11/screenshots/admin-dashboard.png` | `apps/web/playwright/tests/visual/admin-dashboard.spec.ts-snapshots/admin-dashboard-chromium-linux.png` を複製 | pending |

### 2.3 metadata / governance

| # | canonical path | 内容 | status |
|---|---|---|---|
| M-01 | `outputs/phase-11/artifacts.json` | gate-metadata schema 準拠の gate 結果 JSON（G1..G6 各 gate の `status` / `passed_at` / `evidence_path`） | pending |
| M-02 | `outputs/phase-11/required-status-checks.md` | Phase 7 §2 の 6 context 名リスト（branch protection 候補） | pending |
| M-03 | `outputs/phase-11/baseline-meta.json` | 4 spec の baseline PNG 一覧 + 取得日時 + chromium version | pending |

## 3. status 遷移ルール

| status | 意味 |
|--------|------|
| `pending` | ファイル未作成 |
| `present` | ファイル物理存在・サイズ > 0 |
| `verified` | 物理存在 + Phase 12 evidence existence validator で OK |

DoD（Phase 8 D-10）は **全 evidence が present 以上** を要求する。

## 4. artifacts.json schema 要件（M-01）

`.github/workflows/verify-gate-metadata.yml` および `pnpm gate-metadata:validate` の zod schema に準拠する:

```json
{
  "workflow_id": "ui-prototype-design-system-foundation",
  "sub_workflow": "serial-07-regression-evidence",
  "gates": [
    {
      "id": "G1-playwright-visual",
      "status": "passed",
      "passed_at": "2026-MM-DDTHH:MM:SSZ",
      "evidence_path": "outputs/phase-11/playwright-visual.log"
    },
    {
      "id": "G2-verify-design-tokens",
      "status": "passed",
      "passed_at": "2026-MM-DDTHH:MM:SSZ",
      "evidence_path": "outputs/phase-11/verify-design-tokens.log"
    },
    {
      "id": "G3-typecheck",
      "status": "passed",
      "passed_at": "2026-MM-DDTHH:MM:SSZ",
      "evidence_path": "outputs/phase-11/typecheck.log"
    },
    {
      "id": "G4-lint",
      "status": "passed",
      "passed_at": "2026-MM-DDTHH:MM:SSZ",
      "evidence_path": "outputs/phase-11/lint.log"
    },
    {
      "id": "G5-build",
      "status": "passed",
      "passed_at": "2026-MM-DDTHH:MM:SSZ",
      "evidence_path": "outputs/phase-11/build.log"
    },
    {
      "id": "G6-verify-pr-ready",
      "status": "passed",
      "passed_at": "2026-MM-DDTHH:MM:SSZ",
      "evidence_path": "outputs/phase-11/verify-pr-ready.log"
    }
  ]
}
```

- `status` enum: `passed` / `failed` / `skipped`（zod schema 既定）
- `passed_at` は ISO 8601 datetime
- `evidence_path` は workflow root 相対パス

## 5. ファイル収集手順

```bash
mkdir -p outputs/phase-11/screenshots

# log 取得（Phase 10 のコマンドで自動配置）

# screenshot 同期
cp apps/web/playwright/tests/visual/top.spec.ts-snapshots/top-chromium-linux.png \
   outputs/phase-11/screenshots/top.png
cp apps/web/playwright/tests/visual/members-list.spec.ts-snapshots/members-list-chromium-linux.png \
   outputs/phase-11/screenshots/members-list.png
cp apps/web/playwright/tests/visual/member-detail.spec.ts-snapshots/member-detail-chromium-linux.png \
   outputs/phase-11/screenshots/member-detail.png
cp apps/web/playwright/tests/visual/admin-dashboard.spec.ts-snapshots/admin-dashboard-chromium-linux.png \
   outputs/phase-11/screenshots/admin-dashboard.png

# artifacts.json / required-status-checks.md / baseline-meta.json は手書きで配置
```

## 6. inventory 完成判定

| 条件 | 検証 |
|------|------|
| 全 14 entry（L-01..L-07 / S-01..S-04 / M-01..M-03）が `present` | `find outputs/phase-11 -type f \| wc -l` で >= 14 |
| 全 entry の status が ledger と一致 | Phase 12 evidence existence validator |
| `artifacts.json` が gate-metadata zod schema を通過 | `mise exec -- pnpm gate-metadata:validate` |
| screenshot 4 枚が visual baseline と byte 一致 | `diff` または md5 比較（任意） |
