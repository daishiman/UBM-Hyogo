# Phase 11 — Manual Test

[実装区分: 実装仕様書]

## 11.1 必須スクリーンショット / evidence

`outputs/phase-11/` 配下に以下を残す:

| # | ファイル名 | 内容 |
|---|------------|------|
| 1 | `admin-dashboard-200-overview.png` | local authenticated `/admin` 全景 (KPI 4 / Zone 3 行 / Activity)。staging 再取得は user-gated |
| 2 | `admin-dashboard-byZone-detail.png` | local authenticated 区画分布 3 行 (Chip + label + hint + count + 8px bar) のクローズアップ |
| 3 | `curl-byZone-jq.txt` | `curl -s -H "cookie:..." $API_BASE/admin/dashboard \| jq '.byZone'` の結果コピペ |
| 4 | `wrangler-tail-evidence.txt` | (H1/H2/H3 該当時) 404 直前の web/api Worker log 抜粋 (cookie / token 等は伏字化) |
| 5 | `playwright-smoke-result.txt` | `pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/admin-dashboard-staging.spec.ts` の出力 |

> スクリーンショットがない項目は PR 本文 Phase 11 evidence 表から行ごと削除 (CLAUDE.md「PR作成前チェック」準拠)。

## 11.2 取得手順

```bash
mkdir -p outputs/phase-11

# 1, 2: local authenticated Playwright screenshot
PLAYWRIGHT_EVIDENCE_TASK=admin-dashboard-recovery-and-byZone \
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/admin-dashboard-recovery-and-byZone/outputs/phase-11/evidence \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/playwright/tests/admin-dashboard-byzone-screenshots.spec.ts \
  --project=desktop-chromium

# staging screenshots are user-gated and should replace or supplement these
# files only after staging deploy/auth evidence is available.

# 3
curl -s -H "cookie: $ADMIN_COOKIE" "$API_BASE/admin/dashboard" \
  | jq '.byZone' > outputs/phase-11/curl-byZone-jq.txt

# 4 (該当時のみ)
# wrangler tail 出力から該当行を outputs/phase-11/wrangler-tail-evidence.txt に転記

# 5
STAGING_ADMIN_COOKIE="$ADMIN_COOKIE" \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  tests/e2e/admin-dashboard-staging.spec.ts \
  | tee outputs/phase-11/playwright-smoke-result.txt
```

## 11.3 3 層評価 / VISUAL チェック

- **a11y**: `role="img"` + `aria-label="zone 別人数"` が DevTools の Accessibility tree で可視
- **DOM**: プロトタイプ `pages-admin.jsx` L80-93 と side-by-side で差分 0
- **VISUAL**: Phase 11 #1 / #2 と プロトタイプキャプチャを目視比較

## 11.4 evidence sanitization

- cookie 値 / session token / `INTERNAL_AUTH_SECRET` などは **伏字** (`***REDACTED***`) に置換した上でコミット
- API host 名は staging 公開ドメインのみ OK (機密ではない)
- screenshot に管理者個人名・メールアドレスが映る場合はぼかし処理
