# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 1. 目的

serial-05-step-03 schema-diff-resolve の `SchemaDiffPanel` local runtime visual evidence を、既存 Playwright admin auth fixture と schema diff fixture を使って再現可能に取得し、親 workflow `outputs/phase-11/manifest.json` を `pass: true` / `verdict: PASS` に、`outputs/phase-12/main.md` の `phase_status (11)` を `runtime_pending → completed` に昇格する。

## 2. 受入条件 (AC)

- **AC-1**: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/` に下記 PNG が存在し各 ≤ 500KB:
  - 4 pane × 2 scale = 8 PNG (added/changed/removed/unresolved × desktop 1280 / mobile 375)
  - resolve フィードバック 3 PNG (success / 409 / 422, desktop)
  - legacy `admin-schema-diff-list.placeholder.txt` は非 PNG の履歴メモとして保持し、PASS screenshot inventory には含めない
- **AC-2**: `outputs/phase-11/manifest.json` が `pass: true` / `verdict: PASS` / `screenshots.status: "completed"` / `screenshots.captured: [...]` に AC-1 のファイル名を全件列挙
- **AC-3**: `outputs/phase-12/main.md` の `phase_status (11)` = `completed`、`workflow_state` = `completed`、`evidence_state` = `PASS`、`runtime_evidence` = `local gate logs + fixture-backed runtime 11 screenshots captured`
- **AC-4**: `outputs/phase-12/unassigned-task-detection.md` の本 followup 該当行が `consumed`、参照先に `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/` を記載
- **AC-5**: `docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md` 末尾に YAML frontmatter `status: consumed` / `consumed_at: <date>` / `canonical_workflow: docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/` 追記
- **AC-6**: `mise exec -- pnpm typecheck` / `pnpm lint` が green
- **AC-7**: `apps/web/src/components/admin/SchemaDiffPanel.tsx` / `apps/web/src/lib/admin/api.ts` / `apps/web/src/lib/admin/server-fetch.ts` / `apps/api/src/routes/admin/schema.ts` / D1 schema に diff 無し（`git diff dev...HEAD --stat` で確認）
- **AC-8**: 新規 Playwright spec `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts` がローカルで 0 fail / 0 flaky 完走
- **AC-9**: grep gate green — changed production files introduce 0 new local endpoint / HEX / direct `process.env` violations. Existing `server-fetch.ts` `FALLBACK_INTERNAL_API` baseline is recorded in `grep-gate.log` and not modified by this recovery workflow.
- **AC-10**: `apps/web/playwright/.auth/` は `.gitignore` のみ commit され、session storageState JSON は **commit されない**

## 3. 期待 PNG 一覧

| ID | ファイル名 | viewport | route / 状態 |
|----|-----------|----------|--------------|
| legacy | admin-schema-diff-list.placeholder.txt | N/A | 非 PNG placeholder。履歴保持のみ、PASS screenshot inventory から除外 |
| 01 | admin-schema-diff-added-desktop.png | 1280x800 | `/admin/schema`, added pane region |
| 02 | admin-schema-diff-added-mobile.png | 375x812 | `/admin/schema`, added pane region |
| 03 | admin-schema-diff-changed-desktop.png | 1280x800 | `/admin/schema`, changed pane region |
| 04 | admin-schema-diff-changed-mobile.png | 375x812 | `/admin/schema`, changed pane region |
| 05 | admin-schema-diff-removed-desktop.png | 1280x800 | `/admin/schema`, removed pane region |
| 06 | admin-schema-diff-removed-mobile.png | 375x812 | `/admin/schema`, removed pane region |
| 07 | admin-schema-diff-unresolved-desktop.png | 1280x800 | `/admin/schema`, unresolved pane region |
| 08 | admin-schema-diff-unresolved-mobile.png | 375x812 | `/admin/schema`, unresolved pane region |
| 09 | admin-schema-diff-resolve-success.png | 1280x800 | resolve form submit 成功 toast |
| 10 | admin-schema-diff-resolve-409.png | 1280x800 | 既存 stableKey 衝突 toast |
| 11 | admin-schema-diff-resolve-422.png | 1280x800 | regex 違反 stableKey toast |

## 4. スコープ

### 含む
- 新規 Playwright spec / config 追加
- D1 seed fixture SQL の新規追加
- Playwright admin auth fixture / `.auth` 除外の確認
- 11 PNG (8 pane + 3 resolve) の取得と evidence path への配置
- manifest.json / evidence.md / main.md / unassigned-task-detection.md / unassigned-task 元 file の状態更新

### 含まない
- `SchemaDiffPanel.tsx` / api.ts / server-fetch.ts / `apps/api/src/routes/admin/schema.ts` の実装変更
- D1 schema migration の追加
- 新 UI primitive 追加
- 新 API endpoint 追加
- CI workflow への visual job 追加（task-22 で別途）
- staging 上での runtime smoke 取得（任意・本タスクは local 完結を主とする）

## 5. 前提

- local Node 24 / pnpm 10（mise 経由）
- Playwright chromium binary cached
- Playwright admin fixture が有効化できること（`PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1`）
- 追加 SQL fixture は将来の local D1 実結合 capture 用に保持するが、この PASS 境界は fixture-backed local visual capture とする

## 6. 非目標

- staging deploy / real D1 結合経由の screenshot 取得（local fixture-backed evidence の外側）
- production 環境での visual regression baseline 化（task-22 スコープ）
