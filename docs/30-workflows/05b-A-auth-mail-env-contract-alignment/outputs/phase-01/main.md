# Output Phase 1: 要件定義

## status

spec_created（docs-only / remaining-only）

## 真因 (root cause)

3 系統で同一概念に異なる env 名が使われ、Cloudflare Secrets / runbook / 実装の正本が曖昧。

| 概念 | manual specs (10-notification-auth.md / 08-free-database.md) | 現行実装 (`apps/api/src/index.ts`, `routes/auth/index.ts`) | aiworkflow-requirements |
| --- | --- | --- | --- |
| Resend API key | `RESEND_API_KEY` | `MAIL_PROVIDER_KEY` | `MAIL_PROVIDER_KEY` |
| 差出人アドレス | `RESEND_FROM_EMAIL` | `MAIL_FROM_ADDRESS` | `MAIL_FROM_ADDRESS` |
| Magic Link base URL | `SITE_URL` | `AUTH_URL` | `AUTH_URL` |

## Scope

- In: 正本 env 名決定 / spec docs 片寄せ / 後方互換 alias 判断 / Cloudflare・1Password・docs 同期マッピング / production fail-closed 明文化 / staging smoke AC 更新
- Out: provider 差し替え / secret 実値登録 / 通知基盤 UT-07 機能追加 / commit / push / PR

## 影響範囲

| 種別 | 対象 | 想定変更 |
| --- | --- | --- |
| spec | `docs/00-getting-started-manual/specs/10-notification-auth.md` | 環境変数表を `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` に置換、Variable / Secret 種別と 502 `MAIL_FAILED` 脚注を追加 |
| spec | `docs/00-getting-started-manual/specs/08-free-database.md` | シークレット配置表を正本名に置換、Variable 行追記 |
| aiworkflow | `environment-variables.md` / `deployment-secrets-management.md` | spec docs への cross-reference 追加 |
| 実装 | `apps/api/src/index.ts` / `routes/auth/index.ts` / `services/mail/magic-link-mailer.ts` | env 名は変更しない（既に正本）、production 未設定時 fail-closed 挙動を仕様で裏打ち |
| runbook | Phase 5 / Phase 11 | `bash scripts/cf.sh secret put` 経路 / staging-first / stdin 限定 |
| 1Password | `op://UBM-Hyogo/auth-mail-<env>/MAIL_PROVIDER_KEY` 等 | 命名指示のみ。実値登録は user 承認後 |

## 自走禁止操作 (approval gate)

1. `op read` の値出力 / `bash scripts/cf.sh secret put` 実行
2. `bash scripts/cf.sh deploy` 実行
3. Magic Link 実送信を伴う smoke
4. spec / aiworkflow / runbook の commit / push / PR
5. 旧 env 名 (`RESEND_*` / `SITE_URL`) の Cloudflare / 1Password 新規投入

## AC ↔ evidence path 対応表

| # | AC | 達成条件 | evidence path |
| --- | --- | --- | --- |
| AC-1 | env 名の正本が 1 つに統一 | spec / 実装 / aiworkflow が `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` を共通参照 | `outputs/phase-12/main.md` |
| AC-2 | Cloudflare / 1Password / runbook の配置先一致 | 三者で env 名・vault path・配置 (Secret/Variable) が一致 | `outputs/phase-02/main.md` / `outputs/phase-05/main.md` |
| AC-3 | production 未設定時 fail-closed が明記 | 502 `MAIL_FAILED` を spec として明文化 | `outputs/phase-02/main.md` / `outputs/phase-06/main.md` |
| AC-4 | staging smoke で送信設定を確認可 | `secret list --env staging` の name 確認 + `POST /auth/magic-link` 200 | `outputs/phase-11/main.md` |
| AC-5 | secret 実値が repo / evidence に残らない | env 名と `op://` 参照のみ。値・hash・JSON 抜粋を残さない | `outputs/phase-09/main.md` / `outputs/phase-10/main.md` |

## 次 Phase への引き渡し

- 採用 env 名: 実装語に片寄せ（`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`）
- 後方互換 alias 不採用方針（solo dev / MVP / Cloudflare 未投入の前提）
- production fail-closed: request 単位 502 `MAIL_FAILED`（boot fail 不採用）
- 同期マッピング対象 4 箇所（spec 2 / aiworkflow 2）+ runbook (Phase 5 / 11)
