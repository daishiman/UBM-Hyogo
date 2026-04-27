# Phase 11 — 手動テストチェックリスト（VISUAL）: UT-11

## 前提環境

- `wrangler pages dev` 起動済み（localhost:8788）
- `.dev.vars` に `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` 配置済み
- Google Cloud Console のリダイレクト URI に `http://localhost:8788/api/auth/callback/google` 登録済み

## チェックリスト

### ログインフロー（正常系）

| # | テスト内容 | 関連 AC | スクリーンショット | 結果 |
| --- | --- | --- | --- | --- |
| M-01 | `/login` ページにアクセスして Google ログインボタンが表示される | AC-1 | screenshot-login-page.png | [ ] |
| M-02 | ボタンをクリックすると Google OAuth 同意画面にリダイレクトされる | AC-1 | screenshot-google-consent.png | [ ] |
| M-03 | 同意後、`/api/auth/callback/google` を経由して `/admin` にリダイレクトされる | AC-5 | screenshot-admin-success.png | [ ] |
| M-04 | セッション Cookie（`session`）が `HttpOnly; Secure; SameSite=Lax` で発行されている | AC-6 | screenshot-cookie-inspector.png | [ ] |
| M-05 | 一時 Cookie（`_oauth_state`, `_pkce_verifier`）がコールバック後に削除されている | AC-2, AC-3 | screenshot-temp-cookie.png | [ ] |

### アクセス制御（異常系）

| # | テスト内容 | 関連 AC | スクリーンショット | 結果 |
| --- | --- | --- | --- | --- |
| M-06 | ホワイトリスト外のメールでログインすると 403 / 拒否メッセージが表示される | AC-4 | screenshot-login-allowlist-error.png | [ ] |
| M-07 | 未認証で `/admin/dashboard` にアクセスすると `/login` にリダイレクトされる | AC-7 | screenshot-admin-no-auth.png | [ ] |
| M-08 | `/api/auth/logout` アクセスでセッション Cookie が失効し、`/login` に戻る | AC-8 | screenshot-logout.png | [ ] |

### PKCE / state 検証（異常系）

| # | テスト内容 | 関連 AC | 確認方法 | 結果 |
| --- | --- | --- | --- | --- |
| M-09 | callback URL の state を書き換えてリクエストすると 400 が返る | AC-3 | curl コマンド | [ ] |
| M-10 | state Cookie を削除した状態でコールバックを叩くと 400 が返る | AC-3 | curl コマンド | [ ] |

### .dev.vars / .gitignore 確認

| # | テスト内容 | 関連 AC | 確認方法 | 結果 |
| --- | --- | --- | --- | --- |
| M-11 | `.dev.vars` が `.gitignore` に含まれ、git status に表示されない | AC-10 | `git status` | [ ] |
| M-12 | gitleaks で `GOOGLE_CLIENT_SECRET` / `SESSION_SECRET` がリポジトリに検出されない | AC-10 | `gitleaks detect` | [ ] |
