# Phase 11 — 手動 smoke main 成果物（placeholder / VISUAL）

## サマリ

UT-11 の OAuth + PKCE フロー全段（`/login` ボタン → Google 同意画面 → callback → `/admin` 到達 / 拒否 / `/login` 戻り）を VISUAL evidence で裏付ける smoke 結果の placeholder。

## 検証分類

**VISUAL**（UI / Google 同意画面 / Cookie inspector / redirect URI 設定画面が観測対象）

## VISUAL smoke 結果

| # | 内容 | 関連 AC | 結果 | evidence |
| --- | --- | --- | --- | --- |
| V-01 | `/login` ボタン表示 | AC-1 | captured | screenshots/screenshot-login-page.png |
| V-02 | Google OAuth 同意画面 | AC-1 | planned | screenshot-google-consent.png |
| V-03 | ホワイトリスト内成功 | AC-5 | planned | screenshot-admin-success.png |
| V-04 | ホワイトリスト外拒否メッセージ | AC-4 | captured | screenshots/screenshot-login-allowlist-error.png |
| V-05 | 未認証 `/admin/*` redirect | AC-7 | planned | screenshot-admin-no-auth.png |
| V-06 | logout → `/login` 戻り | AC-8 | planned | screenshot-logout.png |
| V-07 | session Cookie 属性 | AC-6 | planned | screenshot-cookie-inspector.png |
| V-08 | 一時 Cookie 属性 | AC-2 | planned | screenshot-temp-cookie.png |

## 異常系 curl

| # | 内容 | 関連 AC | 結果 | evidence |
| --- | --- | --- | --- | --- |
| C-01 | state mismatch → 400 | AC-3 | planned | curl-state-mismatch.txt |
| C-02 | callback Cookie 不在 → 400 | AC-3 | planned | curl-callback-no-cookie.txt |
| C-03 | logout Cookie 失効 | AC-8 | planned | curl-logout.txt |

## 環境設定確認

| 項目 | 結果 | evidence |
| --- | --- | --- |
| GCP redirect URI 3 環境登録 | planned | screenshot-gcp-redirect-uris.png |
| `.dev.vars` `.gitignore` 配下 | planned | gitignore-check.txt |

## 不変条件 evidence

- #5: smoke 中 D1 直接アクセス無し（wrangler-dev.log で確認）
- #6: Web Crypto API ベース、Node.js `crypto` 起因エラー無し

## 次 Phase

Phase 12（ドキュメント更新 / implementation close-out）へ進行。Google consent / live success / Cookie inspector は実 Google Console と secret が必要なため `UT-11-GOOGLE-VERIFY-01` へ分離。
