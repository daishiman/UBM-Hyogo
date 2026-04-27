# Phase 11: 手動 smoke: OAuth flow 全段スクリーンショット記録（VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 11 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-10（最終レビュー） |
| 下流 | phase-12（ドキュメント更新） |
| 検証分類 | **VISUAL**（`/login` ボタン UI / Google 同意画面 / 成功/失敗時 redirect 画面が観測対象） |

## 目的

人が手で確認すべき OAuth + PKCE フロー全段（`/login` ボタン → Google 同意画面 → callback → `/admin` 到達 / 拒否画面 / `/login` 戻り）を **VISUAL** な smoke として実行する手順を残す。screenshot / curl 結果 / wrangler 出力 / Cookie inspector 結果を `outputs/phase-11/` に保存する placeholder を提供し、AC-1 / AC-3 / AC-4 / AC-5 / AC-7 / AC-8 を実機 evidence で裏付ける。

## 検証分類の判定理由

| 観点 | 判定根拠 |
| --- | --- |
| UI 要素 | `/login` ページに「Google でログイン」ボタンが存在し、押下フローが UI 主導 |
| 外部画面 | Google OAuth 同意画面の表示挙動（同意ボタン・アカウント選択）を確認する必要 |
| 状態遷移 | 成功時の `/admin` 表示、拒否時の 403 画面、未認証 `/admin/*` の `/login` redirect いずれも視覚観測対象 |

→ 結論: **VISUAL 扱い**。すべての主要分岐で screenshot を必須 evidence に指定する。

## 実行タスク

1. ローカル環境起動（`wrangler pages dev` / Next.js dev）
2. `/login` ボタン表示の screenshot 取得
3. OAuth 同意画面 screenshot 取得（許可ユーザー / ホワイトリスト外ユーザーの 2 ケース）
4. callback 後の成功 redirect（`/admin` 表示）screenshot 取得
5. callback 後の拒否（403）screenshot 取得
6. 未認証で `/admin/*` 直接アクセス時の `/login` redirect screenshot 取得
7. `/api/auth/logout` 実行後の `/login` 戻り screenshot 取得
8. session Cookie 属性の DevTools inspector screenshot 取得
9. state mismatch / token error の curl による異常系 evidence
10. evidence を `outputs/phase-11/` に保存

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | sanity check / wrangler 起動手順 |
| 必須 | outputs/phase-10/main.md | blocker B-02 / B-04 |
| 必須 | outputs/phase-02/api-contract.md | 期待ステータス / redirect 先 |
| 必須 | outputs/phase-02/admin-gate-flow.md | middleware 期待挙動 |
| 必須 | outputs/phase-06/main.md | 異常系（state mismatch / allowlist deny） |
| 参考 | .claude/skills/aiworkflow-requirements/references/security-principles.md | MVP 認証 UX 期待 |

## 実行手順

### ステップ 1: ローカル環境起動

```bash
# Terminal 1: apps/web を Cloudflare Workers 互換の dev server で起動
cd apps/web
pnpm wrangler pages dev .  # または .vercel/output/static
# 期待: http://localhost:8788 で apps/web が listen（ポートは出力で確認）

# Terminal 2: 並行して Next.js HMR を併用する場合
pnpm dev --filter @ubm/web
# 期待: http://localhost:3000 で Next.js dev server
```

ローカル `.dev.vars` に `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` / `AUTH_REDIRECT_URI` が設定済みであることを `wrangler dev` 起動ログで確認する。

### ステップ 2: VISUAL smoke matrix（AC trace 付き）

| # | 入力 | 期待 | 関連 AC | evidence path |
| --- | --- | --- | --- | --- |
| V-01 | `/login` ページを開く | 「Google でログイン」ボタンが表示 | AC-1 | outputs/phase-11/screenshot-login-page.png |
| V-02 | V-01 のボタンを押下 | Google OAuth 同意画面が表示（aud / scope = openid email profile） | AC-1 | outputs/phase-11/screenshot-google-consent.png |
| V-03 | ホワイトリスト内 email で同意 | callback → `/admin` 画面が表示、URL bar に `/admin` | AC-5 | outputs/phase-11/screenshot-admin-success.png |
| V-04 | ホワイトリスト外 email で同意 | 403 拒否画面（または `/login?error=forbidden`） | AC-4 | outputs/phase-11/screenshot-allowlist-denied.png |
| V-05 | session 無しで `/admin/dashboard` を直接開く | `/login` へ redirect | AC-7 | outputs/phase-11/screenshot-admin-no-auth.png |
| V-06 | V-03 状態で `/api/auth/logout` を実行 | `/login` 画面に戻る、session Cookie が消失 | AC-8 | outputs/phase-11/screenshot-logout.png |
| V-07 | V-03 状態で DevTools → Application → Cookies | `session` Cookie が `HttpOnly` / `Secure` / `SameSite=Lax` / `Path=/` / `Max-Age=86400` | AC-6 | outputs/phase-11/screenshot-cookie-inspector.png |
| V-08 | V-01 押下後の DevTools → Application → Cookies | `oauth_state` / `oauth_verifier` Cookie が `HttpOnly` / `Path=/api/auth/callback/google` / `Max-Age=600` | AC-2 | outputs/phase-11/screenshot-temp-cookie.png |

### ステップ 3: 異常系 curl evidence

```bash
# state mismatch（state を改ざんして callback）
curl -i "http://localhost:8788/api/auth/callback/google?code=dummy&state=tampered" \
  -H "Cookie: oauth_state=original; oauth_verifier=v"
# 期待: 400 + ログに "state mismatch"
# evidence: outputs/phase-11/curl-state-mismatch.txt

# Cookie 無し callback
curl -i "http://localhost:8788/api/auth/callback/google?code=dummy&state=any"
# 期待: 400（state Cookie 不在）
# evidence: outputs/phase-11/curl-callback-no-cookie.txt

# logout（session Cookie 失効確認）
curl -i -c /tmp/c.jar -b /tmp/c.jar "http://localhost:8788/api/auth/logout"
# 期待: 302 to /login + Set-Cookie: session=; Max-Age=0
# evidence: outputs/phase-11/curl-logout.txt
```

### ステップ 4: redirect URI 環境別確認

```bash
# Google Cloud Console の OAuth client redirect URI 一覧スクショ
# 期待: local / staging / production の 3 件すべてが登録済
# evidence: outputs/phase-11/screenshot-gcp-redirect-uris.png
```

### ステップ 5: `.dev.vars` `.gitignore` 確認

```bash
git check-ignore -v apps/web/.dev.vars
# 期待: apps/web/.gitignore:N:.dev.vars 形式で出力（追跡対象外）
# evidence: outputs/phase-11/gitignore-check.txt
```

### ステップ 6: screenshot-plan.json と整合させる項目（表形式）

| key | path | format | 関連 AC | 必須 |
| --- | --- | --- | --- | --- |
| login_page | outputs/phase-11/screenshot-login-page.png | png | AC-1 | yes |
| google_consent | outputs/phase-11/screenshot-google-consent.png | png | AC-1 | yes |
| admin_success | outputs/phase-11/screenshot-admin-success.png | png | AC-5 | yes |
| allowlist_denied | outputs/phase-11/screenshot-allowlist-denied.png | png | AC-4 | yes |
| admin_no_auth | outputs/phase-11/screenshot-admin-no-auth.png | png | AC-7 | yes |
| logout | outputs/phase-11/screenshot-logout.png | png | AC-8 | yes |
| cookie_inspector | outputs/phase-11/screenshot-cookie-inspector.png | png | AC-6 | yes |
| temp_cookie | outputs/phase-11/screenshot-temp-cookie.png | png | AC-2 | yes |
| gcp_redirect_uris | outputs/phase-11/screenshot-gcp-redirect-uris.png | png | AC-11 | yes |
| curl_state_mismatch | outputs/phase-11/curl-state-mismatch.txt | plaintext | AC-3 | yes |
| curl_callback_no_cookie | outputs/phase-11/curl-callback-no-cookie.txt | plaintext | AC-3 | yes |
| curl_logout | outputs/phase-11/curl-logout.txt | plaintext | AC-8 | yes |
| gitignore_check | outputs/phase-11/gitignore-check.txt | plaintext | AC-10 | yes |
| wrangler_dev_log | outputs/phase-11/wrangler-dev.log | plaintext | - | yes |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を implementation-guide に反映（成功/失敗パスのスクショリンク） |
| UT-03 Phase 11 | OAuth client 共有挙動が両タスクで矛盾しないことを再確認 |

## 多角的チェック観点

| 観点 | 内容 | 関連 AC / 不変条件 |
| --- | --- | --- |
| セキュリティ | V-08 で `oauth_state` / `oauth_verifier` Cookie が `HttpOnly` であることを目視 | AC-2 |
| セキュリティ | V-07 で session Cookie 属性をすべて目視 | AC-6 |
| 認可境界 | V-04 でホワイトリスト外ユーザーが拒否されることを目視（fail closed） | AC-4 |
| admin gate | V-05 で未認証 `/admin/*` が `/login` redirect されることを目視 | AC-7 |
| 観測性 | wrangler-dev.log に state mismatch / allowlist deny のログ行が出ることを確認 | - |
| 不変条件 #5 | smoke 中 D1 への直接アクセスが発生しないこと（ログで確認） | #5 |
| 不変条件 #6 | OAuth 実装が Web Crypto API ベース（Node.js `crypto` 由来エラー無し） | #6 |
| 運用性 | V-09 で `.dev.vars` が `.gitignore` 配下にあることを確認 | AC-10 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler dev / Next.js dev 起動 | 11 | pending | 2 サーバー |
| 2 | V-01〜V-08 screenshot 取得 | 11 | pending | 8 screenshot |
| 3 | curl 異常系 evidence | 11 | pending | 3 件 |
| 4 | GCP redirect URI screenshot | 11 | pending | 1 件 |
| 5 | `.dev.vars` `.gitignore` 確認 | 11 | pending | 1 件 |
| 6 | evidence を outputs/phase-11/ に保存 | 11 | pending | 14 ファイル |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果サマリ + AC trace |
| evidence | outputs/phase-11/screenshot-*.png | UI / 同意画面 / Cookie inspector |
| evidence | outputs/phase-11/curl-*.txt | 異常系 / logout |
| evidence | outputs/phase-11/gitignore-check.txt | `.dev.vars` 追跡対象外確認 |
| evidence | outputs/phase-11/wrangler-dev.log | wrangler 起動ログ |
| メタ | artifacts.json | phase 11 status |

## 完了条件

- [ ] 6 サブタスクの evidence が保存
- [ ] V-01〜V-08 全て期待通り（screenshot 取得済）
- [ ] curl 異常系 3 件すべて期待ステータス
- [ ] GCP redirect URI が local / staging / production 3 件すべて登録されていることを screenshot で確認
- [ ] `.dev.vars` が `.gitignore` 配下であることを check-ignore で確認
- [ ] AC-1 / AC-2 / AC-3 / AC-4 / AC-5 / AC-6 / AC-7 / AC-8 / AC-10 / AC-11 が evidence で裏付け済

## タスク 100% 実行確認

- 全 6 サブタスクが completed
- evidence ファイルが outputs/phase-11/ に 14 件以上保存
- 全完了条件にチェック
- 不変条件 #5 / #6 への対応 evidence を含む
- 次 Phase へ implementation-guide の入力を引継ぎ

## 次 Phase

- 次: 12（ドキュメント更新）
- 引き継ぎ事項: smoke 結果を implementation-guide.md / system-spec-update-summary.md に反映、B-02 / B-04 を unassigned-task-detection に記録
- ブロック条件: smoke が NG（V-XX いずれかの期待外）の場合は Phase 5 / Phase 6 へ戻る

## manual evidence

| 項目 | path | format |
| --- | --- | --- |
| /login page | outputs/phase-11/screenshot-login-page.png | png |
| Google consent | outputs/phase-11/screenshot-google-consent.png | png |
| /admin success | outputs/phase-11/screenshot-admin-success.png | png |
| allowlist denied | outputs/phase-11/screenshot-allowlist-denied.png | png |
| /admin no auth | outputs/phase-11/screenshot-admin-no-auth.png | png |
| logout | outputs/phase-11/screenshot-logout.png | png |
| session Cookie inspector | outputs/phase-11/screenshot-cookie-inspector.png | png |
| temp Cookie inspector | outputs/phase-11/screenshot-temp-cookie.png | png |
| GCP redirect URIs | outputs/phase-11/screenshot-gcp-redirect-uris.png | png |
| curl state mismatch | outputs/phase-11/curl-state-mismatch.txt | plaintext |
| curl callback no cookie | outputs/phase-11/curl-callback-no-cookie.txt | plaintext |
| curl logout | outputs/phase-11/curl-logout.txt | plaintext |
| gitignore check | outputs/phase-11/gitignore-check.txt | plaintext |
| wrangler dev log | outputs/phase-11/wrangler-dev.log | plaintext |
