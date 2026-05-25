# issue-863-admin-error-alert-policy-iac

> Source issue: [#863](https://github.com/daishiman/UBM-Hyogo/issues/863)（CLOSED のまま仕様書化）
> Parent workflow: `docs/30-workflows/fix-admin-server-components-render-error-stg/`（digest=167275886 の発見経緯 / 親 PR #849）
> Predecessor one-pager: `docs/30-workflows/unassigned-task/fix-admin-scr-err-stg-followup-002-admin-runtime-sentry-alert-policy.md`
> 実装区分: **実装仕様書**（CONST_004: 目的達成にコード変更 = logger.ts の Sentry tag 昇格 + 新規 IaC ファイル群が必要なため）
> 状態: `implemented_local_runtime_pending`
> 作成日: 2026-05-24

## 調査サマリ（CLOSED 状態の妥当性検証 / issue を現在のコードへ最適化）

最新コードを調査し、issue #863 のスコープを現状に最適化した。**emit 基盤は他タスクで実装済みだが、alert policy IaC 本体は未実装**であり、本 issue は依然として必要。

| issue 当初スコープ | 現在のコードの実態 | 判定 |
|---|---|---|
| `error.boundary.caught` に `scope` ラベルを emit | `apps/web/app/(admin)/admin/error.tsx:18-23` が `logger.error({ event:"error.boundary.caught", scope:"admin", digest, err })` を既に emit | ✅ 実装済（issue-801 由来）→ **本タスクのスコープから除外** |
| Sentry へ送出 | `apps/web/src/lib/logger.ts` が `captureException` 経由で送出済 | ✅ 実装済 |
| Sentry alert rule が `scope=admin` でフィルタ可能 | `logger.ts:98-102` は `tags` に `event`/`runtime` のみ。`scope`/`digest` は `extras` 止まりで **tag フィルタ不可** | ❌ 未実装 → **本タスクのコード変更対象** |
| alert policy を IaC 化 | `infra/cloudflare-alerts/` は `billing_usage_alert`（D1/Workers/KV/R2/Pages の使用量）専用で **error event 検知に構造的に使えない**。Sentry alert rule の IaC は未整備 | ❌ 未実装 → **本タスクの新規 IaC 対象** |
| 初動 runbook | `docs/30-workflows/runbooks/` に admin error 用なし | ❌ 未実装 |
| CODEOWNERS に owner 明示 | alert policy IaC path のエントリなし | ❌ 未実装 |

**結論**: Issue は CLOSED のまま仕様書化する。当初 issue は「Cloudflare analytics_engine / Sentry / Terraform から選択」と手段が曖昧だったが、現在のコードでは **Sentry が error telemetry の正本**（`capture.ts` + task-03 sentry-workers-sdk-unify + 09b-A sentry-slack-prod-extension で Slack 連携済み）であり、Cloudflare alerts IaC は billing 専用で error event を検知できない。したがって根本解決は **(1) `logger.ts` で `scope`/`digest` を Sentry tag へ昇格**し、**(2) Sentry alert rule を `infra/cloudflare-alerts/` と同型の宣言的 IaC（`infra/sentry-alerts/`）として整備**することに最適化する。PR 文言は `Refs #863` のみを使う。

## 概要

admin scope（`/admin/**`）の `error.boundary.caught` イベントを Sentry alert rule で能動検知する仕組みを IaC 化する。Server Components render error 同型 regression（親 digest=167275886）を deploy 直後に自動検知し、既存 Slack インシデント連携へ通知する。手段は Sentry に一本化し、Cloudflare/Sentry の二重 emit を避ける。ローカル実装（logger tag 昇格 / `infra/sentry-alerts` / drift CI / runbook / CODEOWNERS / package scripts）は反映済みで、Sentry apply・staging 通知疎通・PR は user-gated とする。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義（P50 / inventory / 命名規則） |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計（telemetry 正本決定 / IaC topology / tag 昇格） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー（4条件 / 因果ループ） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画（logger tag / IaC schema / diff） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（変更/新規ファイル一覧と差分方針） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加（fail path / 回帰 guard） |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ（変更行の line/branch 実測） |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ（cloudflare-alerts lib 共有化検討） |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA（lint / typecheck / drift CI） |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー（DoD / AC 突合） |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（staging 疎通 / NON_VISUAL 宣言） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明 + spec sync） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（user 承認後のみ） |

## 変更対象ファイル

| パス | 種別 | 内容 |
|---|---|---|
| `apps/web/src/lib/logger.ts` | **修正** | `error`/`warn` の Sentry `captureException`/`captureMessage` に渡す `tags` へ `scope` / `digest` を昇格（存在時のみ・string 化） |
| `apps/web/src/lib/__tests__/logger.spec.ts` | **修正** | `scope`/`digest` が Sentry tags として渡ることを検証する case 追加 |
| `infra/sentry-alerts/policies/admin-error-boundary.json` | **新規** | admin scope `error.boundary.caught` alert rule の宣言的定義（閾値 / フィルタ / 通知先） |
| `infra/sentry-alerts/schema/policy.schema.json` | **新規** | alert rule policy の JSON schema |
| `infra/sentry-alerts/lib/{types.ts,load.ts,diff.ts,api-client.ts,cli.ts,canonicalize.ts}` | **新規** | list/diff/apply/plan を提供する TS CLI（`infra/cloudflare-alerts/lib/` と同型） |
| `infra/sentry-alerts/lib/__tests__/*.spec.ts` | **新規** | schema-contract / load / diff の unit test |
| `infra/sentry-alerts/README.md` | **新規** | IaC 運用ドキュメント |
| `scripts/cf.sh` または `package.json` | **修正** | `sentry-alerts` CLI の実行 entrypoint（`pnpm sentry-alerts:{list,diff,apply}`）追加 |
| `.github/workflows/sentry-alerts-drift.yml` | **新規** | drift 検知 CI（`cloudflare-alerts-drift.yml` と同型） |
| `docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md` | **新規** | alert 発火時の初動 runbook |
| `.github/CODEOWNERS` | **修正** | `infra/sentry-alerts/**` を governance path として追加 |

## スコープ外（本仕様内では新規バックログ化しない）

- public / member scope の error.boundary.caught alert（本タスクは admin に限定。issue 明記）
- `apps/web/app/(admin)/admin/error.tsx` の emit 自体の変更（scope emit は実装済み）
- 新規 telemetry SDK 導入（既存 `@sentry/cloudflare` / `@sentry/nextjs` の範囲内）
- Cloudflare 側での error event 検知（billing_usage_alert では構造的に不可。Sentry 正本化で代替）
- D1 schema 変更 / 新規 API endpoint 追加

## 不変条件

1. `apps/web` の env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（CLAUDE.md task-02）。`logger.ts` 変更で `process.env.*` 直接参照を増やさない
2. Sentry を error.boundary.caught alert の唯一の正本とし、Cloudflare との二重 emit を作らない（alert fatigue 防止）
3. 機密値（Sentry API token / DSN）は IaC ファイルに焼き込まず、`op://` 参照 + Cloudflare Secrets / GitHub Secrets 経由（CLAUDE.md シークレット管理）
4. IaC は `infra/cloudflare-alerts/` の確立パターン（policies JSON + schema + lib CLI + drift CI）をミラーし、新規 primitive を増やさない
5. 閾値は false-positive < 1 件/日 で緩めに初期化し、digest を Sentry tag と Slack notification tag に含める（production build は `error.message` を omit するため digest が一次切り分けの手掛かり）
