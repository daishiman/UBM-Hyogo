# Phase 11 — 手動テスト結果

Local visual/runtime evidence is captured. Staging smoke remains user-gated.

## 環境

- date: 2026-05-26
- branch: `feat/login-ui-balance-and-runtime-fix`
- staging URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/`
- local: focused Vitest route specs, grep gate, prototype HTTP server, and local Playwright screenshot harness

## TC-01: input/button visual balance (AC-1)

- 手順: `/login` を開く → input と submit button を並べて screenshot
- 期待: 高さ 44px 完全一致、左右 padding 同値、border-radius 同 token
- 結果: PASS_LOCAL（metadata: input 44px / submit button 44px / height difference 0px）
- 証跡: `screenshots/login-balanced.png`

## TC-02: Google brand icon 4 色 (AC-2, AC-3)

- 手順: `/login` の Google でログイン行を screenshot、DevTools で `img[data-component="google-brand-icon"]` の computed style を確認
- 期待: 公式 4 色 SVG、`background: transparent`、`::after` / `::before` 干渉なし
- 結果: PASS_LOCAL（computed style: transparent background, 20px square, 0px border）
- 証跡: `screenshots/google-brand-icon.png`

## TC-03: magic-link 200/202 (AC-7)

- 手順:

```bash
curl -i -X POST https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/auth/magic-link \
  -H 'Content-Type: application/json' \
  -d '{"email":"manju.manju.03.28@gmail.com"}'
```

- 期待: HTTP/2 200 or 202
- 結果: STAGING_PENDING（user-gated）
- 証跡: コマンド出力を貼付

## TC-04: regression grep gate (AC-6)

```bash
bash scripts/verify-no-process-env-internal-api.sh
```

- 期待: `ok: no direct process.env.INTERNAL_API_BASE_URL references` / exit 0
- 結果: PASS_LOCAL

## TC-05: prototype serve (AC-10, AC-11)

```bash
bash scripts/serve-prototype.sh 5180 &
SERVE_PID=$!
sleep 1
curl -sI http://127.0.0.1:5180/index.html | head -1
curl -sI http://127.0.0.1:5180/data.jsx | grep -i 'content-type'
open http://127.0.0.1:5180/
kill $SERVE_PID
```

- 期待: `HTTP/1.0 200 OK` / `Content-Type: application/javascript` / ブラウザで UI が初期描画
- 結果: PASS_LOCAL（HTTP 200 / `.jsx` MIME / browser screenshot captured）
- 証跡: `screenshots/prototype-rendered.png`

## TC-06: visual baseline diff (AC-9)

- 手順: `pnpm --filter @repo/web exec playwright test playwright/tests/visual/login.spec.ts`
- 期待: diff が AC-1/AC-2 範囲のみ
- 結果: STAGING_BASELINE_PENDING（local screenshot harness captured AC-1/AC-2 evidence）

## browser extension noise（除外）

| ログ | 判定 | 根拠 |
| ---- | ---- | ---- |
| `127.0.0.1:8888 ERR_CONNECTION_REFUSED` | 拡張機能由来 | `grep -r 8888 apps/web/{src,app}` 0 件 |
| `Sentry cannot use Sentry.init() in a browser extension` | 拡張機能由来 | Sentry が browser extension と明示 |
| `timeUtils-D3l_WJ_A.js scheduleIdleTask window is not defined` | 拡張機能由来 | Next.js bundle 命名規則と不一致 |
| `[object Object]:1 404` | 拡張機能由来 | アプリ配下に該当 fetch なし |

## Gate-B 判定

Local TC pass / staging TC pending. Staging fail があれば Phase 5 へ戻す。
