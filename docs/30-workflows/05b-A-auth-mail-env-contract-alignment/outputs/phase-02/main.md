# Output Phase 2: 設計

## 採用 env 名（実装語に片寄せ）

| 概念 | 採用名 (正本) | 種別 | 不採用旧名 |
| --- | --- | --- | --- |
| Magic Link mail provider API key | `MAIL_PROVIDER_KEY` | Secret | `RESEND_API_KEY` |
| 差出人アドレス | `MAIL_FROM_ADDRESS` | Variable | `RESEND_FROM_EMAIL` |
| Magic Link URL base | `AUTH_URL` | Variable | `SITE_URL` |
| Auth.js セッション署名鍵 | `AUTH_SECRET` | Secret | （変更なし、05a 共有） |

### 決定理由

1. `apps/api/src/env.ts` の Env type と `apps/api/src/index.ts` の mail sender factory が `MAIL_PROVIDER_KEY` を採用済み。`createResendSender` は実装の一形態であり provider 名を env に露出しない。
2. `environment-variables.md` 既に正本表記。
3. `AUTH_URL` は Auth.js 規約近接で `/api/auth/callback/email` と一体で意味を持つ。
4. spec docs を片寄せしても UX 影響なし、実装抽象化の利点を維持。

## 後方互換 alias: 不採用

理由: Cloudflare 旧名未投入 / 実装に fallback なし / solo dev / 廃語経路保守コスト > 利益。例外として既投入が Phase 11 で検出されたら Phase 5 runbook の rollback 経路で整流（alias は追加しない）。

## 同期マッピング

| env 名 | 種別 | Cloudflare 配置 | 1Password Vault path | `.env` (op 参照のみ) |
| --- | --- | --- | --- | --- |
| `MAIL_PROVIDER_KEY` | Secret | `bash scripts/cf.sh secret put MAIL_PROVIDER_KEY --config apps/api/wrangler.toml --env <env>` | `op://UBM-Hyogo/auth-mail-<env>/MAIL_PROVIDER_KEY` | `MAIL_PROVIDER_KEY=op://UBM-Hyogo/auth-mail-local/MAIL_PROVIDER_KEY` |
| `MAIL_FROM_ADDRESS` | Variable | `apps/api/wrangler.toml` `[env.<env>.vars]` | （任意） | （任意） |
| `AUTH_URL` | Variable | 同上 | （任意） | （任意） |

運用ルール: stdin pipe のみ / `--body` 禁止 / staging-first / 1Password Notes は Last-Updated のみ。

## production fail-closed 仕様

| 環境 | `MAIL_PROVIDER_KEY` | 期待挙動 | HTTP / error code |
| --- | --- | --- | --- |
| production | 設定済み | Resend 送信 | 200 `{ state: "sent" }` |
| production | 未設定 | request 単位 fail-closed | 502 `{ code: "MAIL_FAILED", message: "MAIL_PROVIDER_KEY not configured" }` |
| staging | 設定済み | 本番同等 | 200 |
| staging | 未設定 | dev 同等 no-op success（smoke 上は AC fail） | 200 |
| development / test | 未設定 | no-op success | 200 |

boot fail 不採用 — `/healthz` / `/public/*` / cron に巻き込みを発生させないため request 単位に閉じる。

## 追従対象

| 種別 | 対象 | 更新 |
| --- | --- | --- |
| spec | `10-notification-auth.md` § 環境変数 | 旧名→正本名 / 種別列追加 / 502 脚注 |
| spec | `08-free-database.md` § シークレット配置 | 同上 |
| aiworkflow | `environment-variables.md` / `deployment-secrets-management.md` | cross-reference 追加 |
| 実装 | `apps/api` 配下 | 変更なし |
| runbook | Phase 5 / Phase 11 | secret put 経路 / readiness 手順 |

## staging Magic Link smoke AC 更新

| AC | 旧（暗黙） | 新（明文化） |
| --- | --- | --- |
| 前提 | `RESEND_*` 登録 | `secret list --env staging` の name に `MAIL_PROVIDER_KEY` 存在を確認（値非確認） |
| 実行 | `POST /auth/magic-link` | 同左、body `{ "email": "<op:// 参照経由>" }` |
| 期待 | 200 + 受信 | 200 `{ state: "sent" }` + 受信トレイ到達 timestamp。本文・token・実アドレスは evidence 非転記 |
| 失敗 | 不明 | 502 `MAIL_FAILED` 受信時 = name 不在を確認し runbook で再投入 |

## 次 Phase への引き渡し

- 採用 env 名 3 値 + 不採用旧名表
- alias 不採用判断 / production fail-closed 仕様
- 同期マッピング表（Cloudflare / 1Password / docs）
- 追従対象 5 種 / staging smoke AC 更新ポイント
