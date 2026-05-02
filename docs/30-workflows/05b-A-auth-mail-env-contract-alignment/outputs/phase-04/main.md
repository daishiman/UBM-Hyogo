# Output Phase 4: テスト戦略

## 5 レイヤテスト境界

| レイヤ | 対象 | 実行方式 | タイミング |
| --- | --- | --- | --- |
| L1: 単体 | `resolveMailSender` factory / `createResendSender` の env 名読み取り | Vitest（API package、`process.env` mock） | CI / `pnpm test` |
| L2: 契約 | `apps/api/src/env.ts` の Workers binding 型と `wrangler.toml [vars]` の name 一致 | Vitest + `tsc --noEmit` | CI |
| L3: doc grep | spec docs / aiworkflow / runbook に旧名残存ゼロ | `rg` ベーススクリプト | CI / lefthook |
| L4: staging smoke | `secret list --env staging` name 確認 + `POST /auth/magic-link` 200 | 手動 | 09a（user 承認後） |
| L5: production readiness | 未設定時 502 `MAIL_FAILED` を staging fixture で再現 | 手動 | 09c（user 承認後） |

## L1: 単体テスト観点

- `Env.MAIL_PROVIDER_KEY` 未設定 → no-op sender / `ok: false, errorMessage: "MAIL_PROVIDER_KEY not configured"`
- `MAIL_PROVIDER_KEY` + `MAIL_FROM_ADDRESS` 設定 → `Authorization: Bearer ***` ヘッダ構築（mock、実値 fixture 禁止）
- `AUTH_URL` 未設定 → `defaultBuildMagicLinkUrl` が `http://localhost:3000` fallback
- `AUTH_URL` 設定 → env 値を使用

fixture ルール: `'TEST_PLACEHOLDER'` 等明示的 dummy のみ。`re_*` 形式禁止。fetch は `vi.fn()` で stub し Resend に到達させない。

## L2: 契約テスト観点

- `apps/api/src/env.ts` の Env key と `10-notification-auth.md` § 環境変数表が rg + jq で一致
- `wrangler.toml [vars]` に `MAIL_FROM_ADDRESS` / `AUTH_URL` が staging / production 別で定義
- `[vars]` に `MAIL_PROVIDER_KEY` を**書かない**ことを assert（Secret 専用）

## L3: doc grep 設計

```bash
rg -n 'RESEND_API_KEY|RESEND_FROM_EMAIL|\bSITE_URL\b' \
   docs/00-getting-started-manual/specs \
   .claude/skills/aiworkflow-requirements/references \
   docs/30-workflows
```

期待: 0 件（本タスクの移行説明 / 旧名対応表は `<!-- doc-grep-allow: legacy-name -->` マーカーで除外）。`SITE_URL` は単語境界 `\b` で囲む。

## L4: staging smoke 境界

| 検証項目 | 対象 | 境界 |
| --- | --- | --- |
| name 確認 | `bash scripts/cf.sh secret list --env staging` | name 列に `MAIL_PROVIDER_KEY` 存在のみ確認、値・暗号メタは確認しない |
| from / URL 確認 | `wrangler.toml` 直読み or vars list | `MAIL_FROM_ADDRESS` / `AUTH_URL` が staging 値で存在 |
| 送信前 | `POST /auth/magic-link` ハンドラ | env 解決 → sender 構築まで成功で 200 `{ state: "sent" }` |
| 実送信 | Resend HTTP API | user 承認後のみ。token / 本文を evidence 非転記 |

## L5: production fail-closed 検証

- production env で `MAIL_PROVIDER_KEY` 未設定 → `POST /auth/magic-link` が 502 `{ code: "MAIL_FAILED", message: "MAIL_PROVIDER_KEY not configured" }`
- 検証は production 直接 deploy ではなく staging で `MAIL_PROVIDER_KEY` を一時 unset した fixture で再現
- boot fail 不採用のため `/healthz` は env 不在でも 200

## fixture / evidence の secret hygiene

- snapshot / fixture / mock に Resend API key 形式 (`re_*`) / JWT / 実メールアドレスを書かない
- 例外は `noreply@example.com` 等の dummy のみ
- `op read` 出力を test 内に転記しない
- snapshot 更新時は値が含まれないことを Phase 9 / 10 で確認

## 自走禁止

- `bash scripts/cf.sh deploy` 自動実行
- 実 Resend API 送信を伴う smoke
- `op read` 出力のログ転記

## 次 Phase への引き渡し

- L1-L5 境界 / evidence path
- doc grep 設計（rg + マーカー）
- fixture ルール
- staging smoke / production fail-closed 再現の自走禁止
- テスト実装は別タスク委譲
