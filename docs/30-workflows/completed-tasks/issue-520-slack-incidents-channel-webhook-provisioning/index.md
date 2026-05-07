# issue-520-slack-incidents-channel-webhook-provisioning

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 09b-fu-prereq |
| mode | sequential |
| owner | - |
| 状態 | implemented-local / runtime_evidence_pending |
| visualEvidence | NON_VISUAL |
| issue | #520 |
| extension_of | issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension |

## purpose

Issue #495 / Issue #520 の production smoke 拡張仕様（issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension）が前提とする **Slack incident channel `ubm-hyogo-incidents` の新規作成と incoming webhook の発行**、および `SLACK_WEBHOOK_INCIDENT` secret を 1Password / Cloudflare Secrets（staging / production）/ GitHub Secrets に redaction-safe に配置する **運用構築タスク** を、後続実装プロンプトの 1 サイクルで完遂可能なスコープで定義する。issue-495 spec が route 実装に閉じていた一方、本タスクは Slack workspace 上の不可逆操作（channel 作成 / webhook 発行）と secret 配置・runbook 整備・redaction テスト追記を取り扱う。

## why this is a separate task

issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension は `apps/api/src/routes/admin/smoke-observability.ts` の production 分岐拡張に責務を限定し、`SLACK_WEBHOOK_INCIDENT` 値の入手経路（channel 作成 + webhook 発行）は外部 SaaS 操作として明示的に scope out としていた。本タスクは Slack workspace 操作という不可逆 SaaS 副作用と、その結果生じる secret 値の 1Password / Cloudflare / GitHub への redaction-safe 配置、加えて redaction grep test / runbook / `.env.example` / observability-monitoring.md への反映というコード・ドキュメント変更を伴うため、独立した **実装仕様書** として作成する。

## scope in / out

### Scope In
- Slack workspace に `#ubm-hyogo-incidents` チャンネルを新規作成（既存時は再利用）
- Slack incoming webhook を `#ubm-hyogo-incidents` 向けに発行（idempotent: 既存有効 webhook は再利用）
- 1Password 正本 item の整備（`op://UBM-Hyogo/Slack Incident Webhook (<env>)/url` の path 規約に従う）
- `bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --env staging` / `--env production` での Cloudflare Workers secret 投入
- GitHub Actions secret `SLACK_WEBHOOK_INCIDENT` の登録（CI smoke で参照する場合）
- staging smoke endpoint からの `[STAGING SMOKE]` prefix POST が `#ubm-hyogo-incidents` に着弾することの確認
- production smoke endpoint からの `[PRODUCTION SMOKE]` prefix POST が同 channel に着弾することの確認
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` への channel 名・webhook 命名規則の反映
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` への `SLACK_WEBHOOK_INCIDENT` 正本配置先・op:// 参照規約の反映
- `.env.example` への `SLACK_WEBHOOK_INCIDENT="op://Vault/Item/Field"` プレースホルダー追加
- `apps/api/src/routes/admin/smoke-observability.test.ts` への redaction-safe レスポンステスト追記（webhook URL fragment が response / log に露出しないこと）
- `docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md` 新規作成（または同等運用 runbook）
- multi-stage approval gate G1〜G4 の通過記録

### Scope Out
- `apps/api/src/routes/admin/smoke-observability.ts` 本体の production 分岐実装（issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension 側で完了済み前提）
- PagerDuty 連携 / on-call ローテーション
- Sentry 側の channel 設定 / Sentry-to-Slack 統合
- Slack workspace 自体の発行・有償プラン契約
- Slack app（bot）化への移行（本タスクでは incoming webhook で完結）
- production deploy 自体の実行

## dependencies

### Depends On
- issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension（route 設計 / secret 命名規約）
- 1Password 正本 vault `UBM-Hyogo-Production` / `UBM-Hyogo-Staging`
- `scripts/cf.sh secret put` runbook
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`

### Blocks
- issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension Phase 11 runtime smoke 実行
- 09c production deploy readiness（observability gate）

## refs

- `apps/api/src/routes/admin/smoke-observability.ts`
- `apps/api/src/routes/admin/smoke-observability.test.ts`
- `apps/api/wrangler.toml`
- `scripts/cf.sh`
- `.env.example`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/`

## AC（要約 / 詳細は phase-01.md）

- AC-1: Slack workspace に `#ubm-hyogo-incidents` チャンネルが存在し posting 権限を持つ integration が紐づく
- AC-2: incoming webhook が発行され、URL 値は 1Password の所定 item に保管され実値はリポジトリに登場しない
- AC-3: `SLACK_WEBHOOK_INCIDENT` が staging / production 双方の Cloudflare Workers secret として `cf.sh secret put` 経由で投入されている
- AC-4: GitHub Actions secret として `SLACK_WEBHOOK_INCIDENT` が登録されている（CI smoke で参照する場合）
- AC-5: staging smoke endpoint からのテスト POST が `[STAGING SMOKE]` prefix で `#ubm-hyogo-incidents` に着弾する
- AC-6: production smoke endpoint からのテスト POST が `[PRODUCTION SMOKE]` prefix で同チャンネルに着弾する
- AC-7: response / log / evidence / PR 本文に webhook URL の `B.../...` 後半部分（path / token fragment）が一切露出しない（redaction-safe）
- AC-8: `observability-monitoring.md` / `deployment-secrets-management.md` に channel 名と webhook 命名規則が反映済み

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- phase-04.md — テスト戦略
- phase-05.md — 実装ランブック
- phase-06.md — 異常系検証
- phase-07.md — AC マトリクス
- phase-08.md — DRY 化
- phase-09.md — 品質保証
- phase-10.md — 最終レビュー
- phase-11.md — 手動 channel 作成 / webhook 発行 / 実 smoke evidence
- phase-12.md — ドキュメント更新
- phase-13.md — PR 作成

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
- outputs/phase-11/main.md
- outputs/phase-11/manual-smoke-log.md
- outputs/phase-11/link-checklist.md
- outputs/phase-11/channel-provisioning-log.md
- outputs/phase-11/webhook-smoke-log.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

## invariants touched

- #14 Cloudflare free-tier 維持（incoming webhook は free plan 範囲）
- #16 secret values never documented（webhook URL 実値・token fragment 一切記録しない）
- #17 incident response readiness（incident channel 整備）
- INV: webhook URL 実値はリポジトリ全ファイルに登場させない（`.env` も op:// 参照のみ）
- INV: Slack workspace 操作は不可逆。channel / webhook の作成は G1 通過後にのみ実施

## completion definition

全 phase 仕様書、Slack channel / webhook プロビジョニング手順、1Password / Cloudflare / GitHub Secrets への配置 runbook、redaction grep gate、staging→production の段階的疎通契約、G1〜G4 approval gate が確定し、ローカルの redaction script / `.env.example` / `apps/api` redaction test hardening が反映されていること。本サイクルでは commit / push / PR / 実 channel 作成 / 実 webhook 発行 / 実 secret 投入 / 実 smoke 発火を実行しない。
