# issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 09b-fu-extension |
| mode | sequential |
| owner | - |
| 状態 | implemented-local / runtime_pending_user_approval |
| visualEvidence | NON_VISUAL |
| issue | #495 + production extension |

## purpose

Issue #495 が確定した staging 向け `POST /admin/smoke/observability` の実 Provider smoke 取得経路を、**production 環境にも redaction-safe に拡張**する。production secret（`SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN`）の Cloudflare 配置と、production 専用の追加ヘッダ（`x-smoke-production-confirm`）による誤発火防止を route 実装と仕様書で同時に整える。staging と production の evidence は分離し、multi-stage approval gate（G1〜G4）で段階通過させる。

## why this is not a restored old task

09b-A 本体（`completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/`）は staging までを scope とし、production 経路は明示的に scope out としていた。Phase 12 close-out で production deploy readiness（09c）の blocker として「production smoke 経路未整備」が残っていることが確定し、Issue #495 が staging を closeout した時点で production 拡張は次サイクルの follow-up gate として独立扱いになる。本タスクはコード変更（route の production 分岐拡張・test 追加）を伴うため **実装仕様書** として作成する。

## scope in / out

### Scope In
- `apps/api/src/routes/admin/smoke-observability.ts` を production 分岐対応に拡張（案A: 既存 route に `x-smoke-production-confirm: YES` 必須化 + Slack message prefix `[PRODUCTION SMOKE]` + Sentry environment tag `production`）
- `apps/api/src/routes/admin/smoke-observability.test.ts` への production gate / production_confirm 必須 / token mismatch / redaction safe レスポンステスト追加
- `apps/api/wrangler.toml` の `[env.production.vars].ENVIRONMENT = "production"` と Worker name 確認。secret 名（`SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN`）は `cf.sh secret list/put --env production` の name-only 操作で確認・投入し、`wrangler.toml` に宣言しない
- 1Password 正本に production 用 Sentry DSN / Slack webhook / smoke admin token item を追加する手順
- `scripts/cf.sh secret put` を経由した production 配置 runbook
- production smoke を staging と分離した evidence path（`outputs/phase-11/staging-smoke-log.md` / `outputs/phase-11/production-smoke-log.md`）
- multi-stage approval gate G1（secret 配置承認）/ G2（staging PASS 確認）/ G3（production smoke 実行承認）/ G4（evidence 確定）

### Scope Out
- 09b-A 本体（staging 経路）の再実装。Issue #495 の本体経路は完了済み前提で参照するのみ
- PagerDuty 連携 / on-call ローテーション
- Sentry / Slack の有償プラン契約
- production deploy 自体の実行（本タスクは smoke 経路整備まで）
- `apps/web` 側の Sentry 統合

## dependencies

### Depends On
- Issue #495 本体（09b-A staging runtime smoke）の secret 命名・evidence 規約
- `wrangler.toml` `[env.production]` セクション既存定義
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- 1Password 正本 secret 管理

### Blocks
- 09c production deploy readiness（observability gate）
- production incident response 自動検知 confidence

## refs

- `apps/api/src/routes/admin/smoke-observability.ts`
- `apps/api/src/routes/admin/smoke-observability.test.ts`
- `apps/api/wrangler.toml`（`[env.staging]` / `[env.production]`）
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## AC

- AC-P1: production 環境で `POST /admin/smoke/observability?target=both` が `x-smoke-production-confirm: YES` ヘッダ + 正規 Bearer token 提示時に 200 を返し、route response は Sentry event id short evidence と Slack status を返す。Slack permalink は incoming webhook response から返らないため、Phase 11 で Slack UI から手動取得して `production-smoke-log.md` に記録する
- AC-P2: `x-smoke-production-confirm` ヘッダ欠落時、production 環境で 403（または 404 ではなく明示的 production_confirm エラー）を返す
- AC-P3: production 環境からの Slack message が `[PRODUCTION SMOKE]` prefix を持ち、staging からの `[STAGING SMOKE]` と Slack 上で識別可能
- AC-P4: production smoke のレスポンス JSON / log / evidence ファイルに DSN URL / webhook URL / token 値 / project numeric id / hash が一切含まれない
- AC-P5: G1〜G4 全 gate の通過記録が `outputs/phase-11/production-smoke-log.md` に user approval timestamp 付で残る
- AC-P6: staging smoke evidence と production smoke evidence が別ファイルで分離保存され、相互混入がない

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence（staging + production）
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md（staging-smoke-log.md / production-smoke-log.md は template として実体化済み。runtime wave で PENDING_RUNTIME_EVIDENCE を実測値に置換）
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- #14 Cloudflare free-tier
- #16 secret values never documented
- #17 incident response readiness
- INV: production と staging 環境境界を厳格に分離（cross-env secret 流入禁止）

## completion definition

全 phase 仕様書、route / test の実装方針、production secret 配置手順、staging→production の段階的 evidence 取得契約、G1〜G4 approval gate が確定すること。本仕様書作成サイクルで commit / push / PR / 実 secret 投入 / 実 production smoke は実行しない。
