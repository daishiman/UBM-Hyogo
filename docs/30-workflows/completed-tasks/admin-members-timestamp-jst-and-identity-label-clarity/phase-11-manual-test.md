# Phase 11: 手動テスト / スクリーンショット

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- visualEvidence: `VISUAL`
- workflow_state: `implemented_local_evidence_captured`
- evidence_status: `local_playwright_fixture_present / staging_visual_pending_user_gate`
- 実施日: 2026-06-10

## 実施結果

本タスクの UI 変更は `/admin/members` の会員一覧「最終更新」列と会員詳細 drawer の IDENTITY / DIAGNOSTICS 表示である。
local Playwright fixture で admin 認証状態と API fixture を使い、対象表示の screenshot 3 点を取得した。

| TC | 観点 | 結果 | evidence |
| --- | --- | --- | --- |
| TC-11-1 | 一覧「最終更新」が ISO 生でなく JST 秒付き表記 | PASS | `outputs/phase-11/screenshots/members-last-updated-jst.png` |
| TC-11-2/3 | IDENTITY が日本語ラベル主 + 英語キー併記、真偽値が「はい/いいえ」 | PASS | `outputs/phase-11/screenshots/member-drawer-identity-ja.png` |
| TC-11-4/5 | DIAGNOSTICS が日本語ラベル主 + 英語キー併記、真偽値が「はい/いいえ」 | PASS | `outputs/phase-11/screenshots/member-diagnostics-ja.png` |
| TC-11-6 | 不正 `lastSubmittedAt` fail-soft | PASS | `datetime.spec.ts` |

## 実行コマンド

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-members-timestamp-jst-identity-labels.spec.ts \
  --project=desktop-chromium --timeout=180000
```

結果: 1 test PASS。初回実行時に Chromium binary が未導入だったため `pnpm --filter @ubm-hyogo/web exec playwright install chromium` を実行した。
webServer 自動起動は初回 compile が 120 秒を超えたため、手動 dev server 起動後に `PLAYWRIGHT_SKIP_WEB_SERVER=1` で再実行した。

## スクリーンショット inventory

`outputs/phase-11/screenshot-inventory.json` を正本とする。

| ファイル | 内容 | 状態 |
| --- | --- | --- |
| `screenshots/members-last-updated-jst.png` | 一覧の `2026年5月9日 21:00:00` 表示 | present |
| `screenshots/member-drawer-identity-ja.png` | IDENTITY 日本語ラベル・英語キー併記・「いいえ」 | present |
| `screenshots/member-diagnostics-ja.png` | DIAGNOSTICS 日本語ラベル・英語キー併記・「はい/いいえ」 | present |

## user-gated 境界

staging 認証済み runtime screenshot / staging deploy / commit / push / PR は user-gated。
local evidence は UI 表示契約の一次証跡であり、staging baseline は外部環境証跡として Phase 13 以降に取得する。

## 完了条件

1. local Playwright fixture screenshot 3 PNG を `outputs/phase-11/screenshots/` に保存した。
2. focused Vitest で DOM / helper / fail-soft 契約を検証した。
3. staging visual を user-gated 境界として分離し、pending を present と偽らない。
