---
phase: 11
title: Evidence inventory — outputs/phase-11/ canonical path ledger
workflow_id: google-form-reflection-diagnostics
status: runtime_pending
---

# Phase 11 — Evidence inventory (重点 Phase)

[実装区分: 実装仕様書]

## 1. canonical 配置ルート

`docs/30-workflows/google-form-reflection-diagnostics/outputs/phase-11/`

すべての evidence ファイルはこのディレクトリ配下に物理コミットする。`gh artifact download` 等の動的取得には依存しない (Phase 12 evidence existence validator で物理存在をチェックするため)。

## 2. Evidence inventory ledger

### 2.1 ログファイル

| # | canonical path | 取得コマンド | status |
|---|---|---|---|
| L-01 | `outputs/phase-11/typecheck-api.log` | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck 2>&1 \| tee ...` | pending |
| L-02 | `outputs/phase-11/typecheck-web.log` | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 \| tee ...` | pending |
| L-03 | `outputs/phase-11/lint.log` | `mise exec -- pnpm lint 2>&1 \| tee ...` | pending |
| L-04 | `outputs/phase-11/diagnostics-focused-vitest.log` | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/diagnostics/forms-pipeline.spec.ts apps/api/src/diagnostics/forms-pipeline.contract.spec.ts apps/api/src/diagnostics/member-diagnosis.contract.spec.ts` | pending |
| L-05 | `outputs/phase-11/diagnostics-focused-vitest.log` | L-04 に含める (D1 route contracts) | pending |
| L-06 | `outputs/phase-11/verify-phase12-compliance.log` | `mise exec -- pnpm verify:phase12-compliance` | pending |
| L-07 | `outputs/phase-11/gate-metadata.log` | `mise exec -- pnpm gate-metadata:validate` | pending |
| L-08 | `outputs/phase-11/playwright-smoke.log` | `STAGING_SMOKE=1 ... playwright test ...sync-status.spec.ts` | pending |
| L-09 | `outputs/phase-11/verify-pr-ready.log` | `bash scripts/verify-pr-ready.sh` | pending |

### 2.2 screenshot

| # | canonical path | 取得元 | status |
|---|---|---|---|
| S-01 | `outputs/phase-11/screenshots/sync-status-screen.png` | Playwright smoke で `/admin/sync-status` 全画面 | pending |
| S-02 | `outputs/phase-11/screenshots/member-diag-drawer.png` | Playwright smoke で Member Drawer 診断タブ | pending |

### 2.3 metadata / governance

| # | canonical path | 内容 | status |
|---|---|---|---|
| M-01 | `outputs/phase-11/forms-pipeline-snapshot.json` | staging で取得した `/admin/diagnostics/forms-pipeline` の JSON snapshot (機微値は事前に boolean 確認済) | pending |
| M-02 | `outputs/phase-11/member-diagnosis-sample.json` | staging で取得した代表 member 1 名分の `/admin/diagnostics/member/:id` JSON (key 名のみ) | pending |
| M-03 | `outputs/phase-11/artifacts.json` | gate-metadata schema 準拠の gate 結果 JSON | pending |

合計 14 entry (L 9 + S 2 + M 3)。

## 3. status 遷移ルール

| status | 意味 |
|--------|------|
| `pending` | ファイル未作成 (user-gated runtime 投入待ち) |
| `present` | ファイル物理存在・サイズ > 0 |
| `n/a` | 取得不要と確定 |

DoD (Phase 8 D-09 / D-10) は **L-01..L-07 / L-09 と M-03 が present** を最低要求。L-08 / S-01 / S-02 / M-01 / M-02 は staging credentials 揃ったとき user 投入後 present へ。

## 4. artifacts.json schema 要件 (M-03)

`pnpm gate-metadata:validate` の zod schema に準拠する:

```json
{
  "workflow_id": "google-form-reflection-diagnostics",
  "gates": [
    { "id": "G-A-spec-compliance", "status": "passed", "passed_at": "2026-MM-DDTHH:MM:SSZ", "evidence_path": "outputs/phase-11/verify-phase12-compliance.log" },
    { "id": "G-B-runtime-diagnosis", "status": "passed", "passed_at": "2026-MM-DDTHH:MM:SSZ", "evidence_path": "outputs/phase-11/playwright-smoke.log" }
  ]
}
```

- `status` enum: `passed` / `failed` / `skipped`
- `passed_at` は ISO 8601 datetime
- `evidence_path` は workflow root 相対パス

## 5. ファイル収集手順

```bash
mkdir -p outputs/phase-11/screenshots

# log は Phase 10 §1 のコマンドが tee で自動配置

# snapshot JSON は staging で curl 取得後手書き保存 (機微値が boolean のみであることを目視確認)
# screenshot は playwright smoke が自動保存

# artifacts.json (M-03) は本仕様書 §4 のテンプレートを基に手書き
```

## 6. inventory 完成判定

| 条件 | 検証 |
| --- | --- |
| 全 14 entry のうち最低 9 件 (L-01..L-07/L-09/M-03) が `present` | `find outputs/phase-11 -type f \| wc -l` |
| 全 entry の status が `present` / `pending` / `n/a` のいずれか | Phase 12 evidence existence validator |
| `artifacts.json` が gate-metadata zod schema を通過 | `mise exec -- pnpm gate-metadata:validate` |
| screenshot 2 枚が staging で取得され視覚的に H1-H4 判定 UI を含む | user 視認 |
