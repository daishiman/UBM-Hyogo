# Phase 11: 手動テスト

[実装区分: 実装仕様書]

## 前提

- staging deploy が最新 commit に同期されている（Lane A 修復済み）
- admin ロールの session cookie で staging にログイン可能（テストアカウント: `manjumoto.daishi@senpai-lab.com`）

## 手順

### L1: Local Playwright visual evidence（取得済み）

```bash
ADMIN_SCHEMA_DIFF_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/outputs/phase-11/screenshots PLAYWRIGHT_BASE_URL=http://localhost:3107 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/admin-schema-diff.spec.ts --project=visual-chromium
```

結果: 7 PASS。スクリーンショットは `outputs/phase-11/screenshots/admin-schema-diff-*.png` に保存済み。

### M1: Lane A — `/admin/schema/diff` 200 確認

```bash
# 1. tail を起動
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging
```

ブラウザで `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/schema` を開き:
- ページ最下部の `AdminSectionError`「admin api /admin/schema/diff failed: 404」が **消えている** ことを確認
- DevTools Network で `/admin/schema/diff` レスポンスが 200 + JSON であることを確認
- staging 結果スクリーンショットは authenticated staging 実行時に保存

### M2: Lane B — UI 構造確認

`/admin/schema` を開いた状態で:
- 上部に「ADMIN / SCHEMA」eyebrow と「スキーマ差分のレビュー」h-page が表示
- CURRENT REVISION カードに revisionId / hash / capturedAt + active Chip が表示
- 4 つの stat カード（Unresolved / Added / Changed / Removed）が grid-4 で表示
- 中央に SchemaDiffPanel（diff items）が表示
- 下部に REVISIONS と ALIAS HISTORY が grid-2 で表示
- local screenshot: `outputs/phase-11/screenshots/admin-schema-diff-resolve-success.png`（fullPage）

### M3: Lane C — diff カード primitive 整合

- 差分カードに `schema-field-card diff-added` / `diff-changed` / `diff-removed` の class が付与されている（DevTools で確認）
- 種別バッジが `Chip` の tone (`green` / `amber` / `red` / `cool`) スタイルで表示
- local screenshots: `outputs/phase-11/screenshots/admin-schema-diff-{added,changed,removed,unresolved}-desktop.png`

### M4: Lane D — Sidebar 表記

- 左サイドバーで「スキーマ」と日本語表記されていることを確認（他項目「ダッシュボード」「会員管理」と表記体系が揃う）
- local Playwright page object / admin-pages spec が「スキーマ」表記を検証。authenticated staging sidebar screenshot は user-gated。

### M5: a11y axe scan

```bash
# Playwright で axe を実行（staging 環境ターゲット）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-schema-page.spec.ts --project=admin-staging-visual --grep "axe"
```

axe violations = 0 のログを `outputs/phase-11/logs/axe.json` に保存。

## Evidence 一覧

| Classification | Path | 取得タイミング |
|---|---|---|
| local Playwright log | `outputs/phase-11/local-playwright-admin-schema-diff.txt` | L1 実行後 |
| screenshot | `outputs/phase-11/screenshots/admin-schema-diff-added-desktop.png` | L1 後 |
| screenshot | `outputs/phase-11/screenshots/admin-schema-diff-changed-desktop.png` | L1 後 |
| screenshot | `outputs/phase-11/screenshots/admin-schema-diff-removed-desktop.png` | L1 後 |
| screenshot | `outputs/phase-11/screenshots/admin-schema-diff-unresolved-desktop.png` | L1 後 |
| screenshot | `outputs/phase-11/screenshots/admin-schema-diff-resolve-success.png` | L1 後 |
| screenshot | `outputs/phase-11/screenshots/admin-schema-diff-resolve-409.png` | L1 後 |
| screenshot | `outputs/phase-11/screenshots/admin-schema-diff-resolve-422.png` | L1 後 |
| Lane A 切り分け | `outputs/phase-11/lane-a-curl-investigation.md` | Lane A 実行直後 |
| axe report | `outputs/phase-11/logs/axe.json` | M5 後 |
| manual test result | `outputs/phase-11/manual-test-result.md` | 全工程後の総括 |

## DoD

- local visual evidence が取得済み
- authenticated staging evidence は user-gated として Phase 12 inventory に明記
- Phase 12 `phase12-task-spec-compliance-check.md` の Phase 11 evidence inventory が local present / staging pending の二層で埋まる
