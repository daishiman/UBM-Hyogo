# Phase 5: 実装ランブック — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 5 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

route 拡張・test 追加・wrangler.toml 確認・1Password item 追加・production secret 配置・staging→production smoke 実行までを後続実装サイクルがそのまま再現できる runbook を確定する。

## 入力

- Phase 1 AC / G1〜G4 / 自走禁止
- Phase 2 設計（案 A / 関数シグネチャ / binding 表 / prefix 戦略）
- Phase 3 GO 判定
- Phase 4 Test ID 表

## 変更対象ファイル

| path | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/routes/admin/smoke-observability.ts` | 編集 | production 分岐拡張（404 → production_confirm gate / Slack prefix / Sentry env）。`PRODUCTION_CONFIRM_HEADER` と `smokeMessagePrefix()` を export |
| `apps/api/src/routes/admin/smoke-observability.test.ts` | 編集 | T-01〜T-06 ケース追加 |
| `apps/api/wrangler.toml` | 確認・コメント追記のみ | `[env.production.vars].ENVIRONMENT = "production"` と Worker name を確認。Workers secrets は `wrangler.toml` に宣言しないため、`SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN` は `cf.sh secret list/put --env production` で確認 |
| `.env`（ローカル） | 編集（ローカルのみ） | `op://UBM-Hyogo/Sentry DSN (API / production)/dsn` 等の参照行追加（実値は書かない・コミット禁止） |

## Step 一覧

| Step | 内容 | 担当 | gate |
| --- | --- | --- | --- |
| Step 0 | 既存 staging 仕様（`completed-tasks/09b-A-...`）を再確認し、Issue #495 staging の実装契約と user-approved runtime pending 境界を親 workflow の Phase 11 evidence template から確認。本 task の `staging-smoke-log.md` / `production-smoke-log.md` は template-only であり、runtime wave まで PASS 証跡として扱わない | 実装者 | — |
| Step 1 | route コード変更（案 A）。`PRODUCTION_CONFIRM_HEADER` / `smokeMessagePrefix` を追加、production 分岐の 404 を production_confirm gate に置換 | 実装者 | — |
| Step 2 | vitest 追加（T-01〜T-06）。`mise exec -- pnpm exec vitest run apps/api/src/routes/admin/smoke-observability.test.ts` で全 PASS | 実装者 | — |
| Step 3 | `wrangler.toml` `[env.production]` の Worker name / `ENVIRONMENT` を確認し、secret 名は `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` の name-only 出力で確認。欠落時は Step 5 で投入（実値は書かない） | 実装者 | — |
| Step 4 | 1Password に production 用 3 item 登録（GUI 操作・人間 only） | 人間 | G1 前提 |
| Step 5 | production secret 配置: `op read 'op://UBM-Hyogo/Sentry DSN (API / production)/dsn' \| bash scripts/cf.sh secret put SENTRY_DSN_API --config apps/api/wrangler.toml --env production` を 3 secret 分実行 | 実装者 + 人間 | **G1** |
| Step 6 | staging smoke 実行（T-08）と PASS 確認 | 実装者 | **G2 前提** |
| Step 7 | production smoke 実行（T-09）`curl -X POST 'https://<api-prod-host>/admin/smoke/observability?target=both' -H 'authorization: Bearer <op-injected>' -H 'x-smoke-production-confirm: YES'` | 実装者 + 人間 | **G3** |
| Step 8 | redaction grep（T-10）3 系統 0 hit | 実装者 | **G4 前提** |
| Step 9 | evidence 確定: `staging-smoke-log.md` / `production-smoke-log.md` の event id / Slack permalink / G1〜G4 timestamp を記録（DSN / webhook URL / token / hash / project numeric id を一切含めない） | 実装者 + 人間 | **G4** |

## ローカル実行・検証コマンド

```bash
# Phase 5 で実装者がローカルで実行
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm exec vitest run apps/api/src/routes/admin/smoke-observability.test.ts

# secret 配置（G1 通過後）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
op read 'op://UBM-Hyogo/Sentry DSN (API / production)/dsn' | bash scripts/cf.sh secret put SENTRY_DSN_API --config apps/api/wrangler.toml --env production
op read 'op://UBM-Hyogo/Slack Webhook (incident / production)/url' | bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --config apps/api/wrangler.toml --env production
op read 'op://UBM-Hyogo/Smoke Admin Token (production)/token' | bash scripts/cf.sh secret put SMOKE_ADMIN_TOKEN --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production  # 名前のみ確認

# staging smoke
TOKEN=$(op read 'op://UBM-Hyogo/Smoke Admin Token (staging)/token')
curl -sS -X POST "https://<api-staging-host>/admin/smoke/observability?target=both" -H "authorization: Bearer $TOKEN"

# production smoke（G3 通過後のみ）
TOKEN=$(op read 'op://UBM-Hyogo/Smoke Admin Token (production)/token')
curl -sS -X POST "https://<api-prod-host>/admin/smoke/observability?target=both" \
  -H "authorization: Bearer $TOKEN" \
  -H "x-smoke-production-confirm: YES"
```

## DoD（Definition of Done）

- route と test の typecheck / lint / vitest が全 PASS
- `wrangler.toml` `[env.production]` は secret 実値を持たず、`cf.sh secret list --env production` の name-only 出力で 3 secret 名が存在
- 1Password に production 用 3 item が登録済（GUI 確認）
- `cf.sh secret list --env production` の出力に 3 secret 名が存在
- staging smoke が AC-1〜AC-5 PASS（既存 09b-A の AC を継承）
- production smoke が AC-P1〜AC-P6 PASS
- redaction grep 3 系統 0 hit
- G1〜G4 通過記録が timestamp 付で `production-smoke-log.md` に残る

## 制約事項

- 本仕様書作成サイクルでは Step 1〜9 を実行しない
- 実 secret 配置・production smoke は G1 / G3 user approval 経由のみ
- production への smoke 連投禁止（INV #17）

## 成果物

- `outputs/phase-05/main.md`

## 次 Phase への引き渡し

Phase 6 へ: Step 別失敗パターン（A-01〜A-08）と escalation 経路。
