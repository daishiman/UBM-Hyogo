---
name: lessons-learned-09b-A-sentry-slack-runtime-smoke-2026-05
description: 09b-A Sentry / Slack runtime smoke 実装で発生した苦戦箇所を 5 分で再現できる解決カードに固定する。docs-only から `implemented-local` への昇格境界、redaction grep gate、secret 命名分離、approval-gated runtime evidence の扱いを次回に持ち越す。
type: reference
---

# lessons-learned: 09b-A Sentry / Slack Runtime Smoke 苦戦箇所（2026-05-05）

> 対象タスク: `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/`
> 状態: `implemented-local` / implementation / `NON_VISUAL`
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check,unassigned-task-detection}.md`

09b-A は 09b で残した Sentry / Slack incident 疎通を runbook + API smoke route として正本化したタスクである。runtime PASS は user approval 後の execution wave に分離してあるため、次回類似タスクで判断境界を再現するために苦戦箇所を固定する。

## L-09BA-001: docs-only では runtime smoke タスクが破綻する

**苦戦箇所**: 「runbook と契約だけあれば足りる」と判断すると、Phase 11 evidence template が空洞化し、09c の observability blocker が解除できない。Sentry / Slack の疎通は API Worker route なしには手元で再現できない。

**5分解決カード**: runtime smoke 系タスクは `contract docs` と `implementation locally runnable` の 2 件を同一 wave に置く。`apps/api/src/routes/admin/smoke-observability.ts` のように production 404 + dev/staging Bearer auth 付きの admin route を最小構成で先行実装し、Phase 11 では `provider_smoke_pending_user_approval` を明示する。

**promoted-to**: `references/observability-monitoring.md`（§8 09b-A contract）, `task-specification-creator/references/task-spec-types-and-categories.md`

## L-09BA-002: Phase 11 は `contract_ready_runtime_pending` と `runtime_PASS` を分ける

**苦戦箇所**: 単一の `evidence_pending` フラグだと、Phase 11 が「契約まで完成・実 provider 未疎通」なのか「未着手」なのかを後続が読み解けない。09c 側がブロッカ解除条件を誤認する。

**5分解決カード**: `artifacts.json` の Phase 11 status を `contract_ready_runtime_pending` で固定し、root workflow state は `implemented-local` に留める。runtime PASS は execution wave で `provider_smoke_passed` に昇格させる。`unassigned-task/task-09b-a-runtime-provider-smoke-execution-001.md` が後続タスクの正本。

**promoted-to**: `task-specification-creator/references/phase11-evidence-types.md`, `references/observability-monitoring.md`（§8）

## L-09BA-003: secret 命名は legacy generic 名と incident response 名を分離する

**苦戦箇所**: UT-08 由来の `SLACK_ALERT_WEBHOOK_URL` を 09b-A incident response にそのまま流用すると、汎用 monitoring alert と P1/P2 incident response が同一 webhook に混線する。後で分離するときに wrangler / 1Password / Cloudflare secret を 3 箇所同時に rename しなければならない。

**5分解決カード**: incident response 用 Slack secret は `SLACK_WEBHOOK_INCIDENT` を canonical 名に固定する。`SLACK_ALERT_WEBHOOK_URL` は legacy generic monitoring 名として読み取り専用扱いとし、新規実装での再利用を禁止する。Sentry も `SENTRY_DSN_API` / `SENTRY_DSN_WEB` の 2 名で app boundary を切る。

**promoted-to**: `references/deployment-secrets-management.md`（§09b-A secret 命名表）

## L-09BA-004: redaction grep gate は test fixture と本物 URL を分けて書く

**苦戦箇所**: redaction-safe を担保する grep gate（DSN / webhook URL / token / hash）を CI に入れると、test fixture 内の URL風文字列で false positive が起きる。test を書き直しても、fixture のホスト名・パスを書く瞬間にまた grep が反応する。

**5分解決カード**: test fixture では DSN / webhook URL を分割記載（`'https://exam' + 'ple.ingest.sentry.io/...'` のような連結）にし、grep の対象は `outputs/phase-11/` 以下の evidence のみに限定する。fixture そのものを grep 対象に含めない。本物 secret 値は test fixture にも置かない。

**promoted-to**: `apps/api/src/routes/admin/smoke-observability.test.ts` 設計コメント, `references/observability-monitoring.md`（§8 redaction rules）

## L-09BA-005: Phase 12 strict 7 files は宣言と実体を find で先に揃える

**苦戦箇所**: implementation-guide / system-spec-update-summary / skill-feedback-report / phase12-task-spec-compliance-check / unassigned-task-detection / documentation-changelog / main.md の 7 件を「揃った」と宣言してから実体が無いケースが起きる。indexes と artifacts の同期も同時に崩れる。

**5分解決カード**: Phase 12 開始時点で `find outputs/phase-12 -maxdepth 1 -type f` を打ち、不足ファイルを最初に touch + skeleton で作成してから本文を書く。`mise exec -- pnpm indexes:rebuild` を編集後に実行し、`indexes/topic-map.md` / `keywords.json` の drift を CI 前に解消する。

**promoted-to**: `task-specification-creator/references/phase12-skill-feedback-promotion.md`, `skill-creator/references/patterns-success-skill-phase12.md`

## L-09BA-006: skill feedback の改善は既存未タスクと衝突確認してから新規化する

**苦戦箇所**: smoke 実装で気づいた改善点（CONFIG_MISSING/CONFIG_INVALID 検証 UX、provider API timeout、再試行戦略）を全て新規未タスクにすると、UT-08 / 09c / observability 系の既存 task と重複する。

**5分解決カード**: `docs/30-workflows/unassigned-task/` を `rg -l 'observability|smoke|sentry|slack'` で先に検索し、formalized / delegated / existing related / candidate に分類する。既存 task に追記できるものはリンク、低優先度 candidate は `unassigned-task-detection.md` に no formalize reason を残す。今 wave では `task-09b-a-runtime-provider-smoke-execution-001.md` と `task-branch-unrelated-deletion-audit-20260506-001.md` の 2 件のみ formalize した。

**promoted-to**: `task-specification-creator/references/phase12-skill-feedback-promotion.md`

## 関連ファイル

| 役割 | 参照先 |
| --- | --- |
| Observability / smoke contract 正本 | `references/observability-monitoring.md`（§8） |
| Secret 命名表 | `references/deployment-secrets-management.md`（§09b-A） |
| Implementation guide | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-12/implementation-guide.md` |
| API smoke route | `apps/api/src/routes/admin/smoke-observability.ts` |
| Runtime execution 後続タスク | `docs/30-workflows/unassigned-task/task-09b-a-runtime-provider-smoke-execution-001.md` |
| 09b parent runbook（cron / release） | `references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md` |
