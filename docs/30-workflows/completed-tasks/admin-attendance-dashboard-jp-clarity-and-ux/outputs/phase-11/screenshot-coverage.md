# Phase 11 — Screenshot Coverage

> status: `captured_local_fixture`。6 canonical PNG は local Playwright admin fixture で `outputs/phase-11/screenshots/` に保存済み。staging deploy + admin 認証を伴う authenticated baseline capture のみ user-gated。

## Coverage Matrix

| Screenshot | Viewport | Evidence target | AC | Status |
| --- | --- | --- | --- | --- |
| `screenshots/attendance-dashboard-full-jp.png` | desktop 1280x800 | 全体ページ。`全体の状況` / `出席の移り変わり` / `くわしい一覧` の 3 ゾーンと H1 | AC-1 / AC-2 / AC-3 / AC-4 | present |
| `screenshots/attendance-overview-zone-jp.png` | desktop 1280x800 | KPI と要フォロー対象。`一度でも参加した人の割合` / `開催回数` / `直近 N 回つづけて欠席` | AC-1 / AC-2 / AC-3 | present |
| `screenshots/attendance-trend-zone-jp.png` | desktop 1280x800 | `月ごとの出席の移り変わり` と `出席回数べつの人数` | AC-1 / AC-3 | present |
| `screenshots/attendance-detail-tabs-jp.png` | desktop 1280x800 | `開催回ごと` / `会員別` / `出席が多い順` の詳細タブ | AC-1 / AC-2 | present |
| `screenshots/attendance-filter-bar-jp.png` | desktop 1280x800 | `3か月` / `6か月` / `1年` / `累計の出席回数` / `表計算ファイルで書き出す` | AC-1 / AC-3 | present |
| `screenshots/attendance-dashboard-mobile-jp.png` | mobile 390x844 | モバイル 1 カラムで日本語ラベルがはみ出さない | AC-4 | present |

## Verification

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-attendance-dashboard-ux.spec.ts --project=desktop-chromium
find docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-11/screenshots -maxdepth 1 -name '*.png' | sort
```

