# Phase 11 — 手動テスト結果（VISUAL）

## 状態

`completed` — local Playwright admin fixture で `/admin/meetings/sess-1` を開き、CSV import wizard の 4 状態を Chromium 1280x800 で撮影した。

## 実行コマンド

```bash
PLAYWRIGHT_EVIDENCE_TASK=ut-07c-followup-001-attendance-csv-import \
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/ut-07c-followup-001-attendance-csv-import/outputs/phase-11 \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/playwright/tests/attendance-csv-import.spec.ts --project=desktop-chromium
```

Result: 1 passed / 0 failed.

## VISUAL 観点

| 観点 | 期待 |
| --- | --- |
| OKLch トークン適合 | focused visual run PASS。inline status tone は component-local pill に限定 |
| 行別 status pill | ok / duplicate / deleted_member / unknown_member / invalid の 5 状態を `data-status` と pill text で表示 |
| confirm ボタン | `ok === total` のみ enable |
| エラー panel (413 / client 501+) | 「500 行」を含む日本語メッセージ |
| reset 動作 | step-preview → cancel で step-upload に復帰 |

## 取得済み screenshot

| Screenshot | Scenario | sha256 |
| --- | --- | --- |
| `outputs/phase-11/screenshots/S1-upload.png` | upload 待機状態 | `fd46536532b1ba6bc1cbcb3d9bd108012c8ff96eef27fa4d5cd63442ee8bce39` |
| `outputs/phase-11/screenshots/S2-preview.png` | dry-run preview 表示 | `625885e7afb64ff6a6fb7eda45a39f5eda213643bd845209fc65fe96ad086657` |
| `outputs/phase-11/screenshots/S3-confirm-done.png` | commit 完了画面 | `f68a519c12e535c64758add3b11cdf2b08fad2e7b78704249c3eadf7b2ee7536` |
| `outputs/phase-11/screenshots/S4-error-deleted-member.png` | deleted_member preview / confirm disabled | `50ab0bd3d7332f4ca5c6460c81361c40faa516fca9192f66aae9dfd0fb2fdd25` |
