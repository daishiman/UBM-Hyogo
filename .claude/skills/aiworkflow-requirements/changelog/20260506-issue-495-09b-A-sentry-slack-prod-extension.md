# 2026-05-06 Issue #495 09b-A Sentry / Slack Runtime Smoke Production Extension

## Summary

`docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/` を `implemented-local / implementation / NON_VISUAL / production-extension / runtime_pending_user_approval` として正本同期。09b-A の staging-only runtime smoke route を production にも開き、production 固有の安全弁として `x-smoke-production-confirm: YES` confirmation header を必須化。Slack `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` prefix の env 別出し分け、Sentry `environment` tag、staging / production evidence file 分離、G1 production secret placement / G2 staging smoke PASS / G3 production smoke / G4 redaction grep の 4 段 approval gate を契約として固定。

実装は単一 route `POST /admin/smoke/observability` を維持し、`SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN` を staging と同名・env-scoped 値の Cloudflare Secrets として `bash scripts/cf.sh secret put --env <env>` で配置する。`wrangler.toml` には `ENVIRONMENT = "production"` の vars のみ記述し、secret bindings は宣言しない。

Phase 12 close-out 判定: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。Phase 13 commit / push / PR、production secret 投入、staging provider smoke、production provider smoke は user-gated。

## Updated Canonical References

- `indexes/quick-reference.md` §Sentry / Slack Runtime Smoke Production Extension（Issue #495 / 2026-05-06）: workflow root / production confirmation gate / implementation runbook / staging vs production runtime templates / route 実装ファイルへの早見を新規セクション化。
- `indexes/resource-map.md` §current canonical set: issue-495 行を追加（implemented-local / production-extension / runtime_pending_user_approval、同名 env-scoped secret）。
- `indexes/topic-map.md` §artifact-inventory: issue-495 artifact inventory の section 目次を追加。line 番号を `references/deployment-secrets-management.md` / `references/observability-monitoring.md` の追記に合わせて再採番。
- `references/observability-monitoring.md` §8 09b-A contract: production extension 段落を追加し、staging / production の Slack prefix / Sentry environment / evidence path を 2 行表で固定。production 側のみ Slack channel name / redacted channel id 記録を許容（webhook URL は禁止）。
- `references/deployment-secrets-management.md` §UT-08 / 09b-A: `SMOKE_ADMIN_TOKEN` 行を追加し、env-scoped 同名 secret は `bash scripts/cf.sh secret put --env production` で G1 approval 後に配置する旨を明記。`wrangler.toml` には secret 値・secret binding を記述しない境界を再強調。
- `references/environment-variables.md` §API Worker Env: `SMOKE_ADMIN_TOKEN` の scope を「dev/staging only」から「`/admin/smoke/*` 全般、observability smoke は staging / production で `x-smoke-production-confirm: YES` + G1-G4 必須」に更新。
- `references/task-workflow-active.md` §Active Workflows: issue-495 行を追加（implemented-local / production-extension / runtime_pending_user_approval）。09b-A 行に Issue #495 production extension の追補注記を入れて drift を防止。
- `references/lessons-learned-09b-A-sentry-slack-runtime-smoke-2026-05.md` §L-09BA-001: 5 分解決カードを更新し、production では Bearer auth + `x-smoke-production-confirm: YES`、dev/staging では Bearer auth の 2 経路に分岐する正本動作を反映。
- `references/workflow-issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension-artifact-inventory.md`: 新規追加。canonical root / Phase 12 strict 7 files / implementation artifacts / runtime evidence templates / same-wave sync の 5 軸で台帳化。

## Implementation Reflected in Code

- `apps/api/src/routes/admin/smoke-observability.ts`: `PRODUCTION_CONFIRM_HEADER` / `PRODUCTION_CONFIRM_VALUE` 定数を導入し、`ENVIRONMENT === "production"` のときだけ confirmation header を必須化。`smokeMessagePrefix(envName)` 純関数で `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` を生成し、Sentry payload の `environment` tag に同じ値を入れる。
- `apps/api/src/routes/admin/smoke-observability.test.ts`: production confirmation header の有無、staging/production prefix の出し分け、Slack message / Sentry payload に DSN / webhook URL / token を含めない redaction を test ケースとして追加。
- `apps/api/src/env.ts`: `ENVIRONMENT` を Worker Env に型付け（`"staging" | "production"`）。
- `apps/api/wrangler.toml`: `[env.production]` 配下に `ENVIRONMENT = "production"` の vars のみ記述。secret 値・secret binding 宣言は記述しない。

## Approval Gates（Phase 11 / Phase 13）

- **G1 production secret placement**: `bash scripts/cf.sh secret put --env production` で `SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN` を投入。1Password 参照値からの動的注入で実値を artifact に残さない。
- **G2 staging provider smoke**: staging 環境で route を叩き、Sentry event id / Slack permalink の取得を確認（実値は redaction grep で除去）。
- **G3 production provider smoke**: production 環境で `x-smoke-production-confirm: YES` 付きで route を叩く。channel / environment 分離が正しいかを `[PRODUCTION SMOKE]` prefix と Sentry `environment=production` で検証。
- **G4 redaction evidence**: `outputs/phase-11/redaction-grep-evidence.md` に grep 結果を記録し、DSN URL / webhook URL / token / hash が一切残らないことを確認。

## Evidence Boundary

- Current evidence: spec contract 13 phase 仕様書 / artifacts.json root + outputs parity / Phase 12 strict 7 files / artifact inventory / lessons / changelog。`outputs/phase-11/` の runtime evidence ファイルは全て `RUNTIME_PENDING_USER_APPROVAL` テンプレート。
- Pending evidence (`outputs/phase-11/` reserved): staging-smoke-log.md / production-smoke-log.md / redaction-grep-evidence.md の実値書き込み。すべて user-approved runtime execution wave で取得。

## Skill Feedback Surfaced

- `task-specification-creator`: artifacts.json に list された runtime evidence ファイルの実体未取得時に、`RUNTIME_PENDING_USER_APPROVAL` テンプレート命名を Phase 11 / Phase 12 spec で標準化する提案。manifest drift を防ぎつつ planned evidence と runtime PASS を明示分離する。
- `aiworkflow-requirements`: env-scoped 同名 secret の運用例（`SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN`）と production-specific approval gate（G1）を `deployment-secrets-management.md` で恒常的に保持する。

## artifacts.json parity

- root `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/artifacts.json`: 正本。
- `outputs/artifacts.json`: root と同期済み。
- `metadata.workflow_state = implemented-local`、`runtime_evidence_state = staging_and_production_smoke_pending_user_approval`、Phase 1-10 / 12 = `completed`、Phase 11 = `pending_user_approval`、Phase 13 = `pending_user_approval`。
