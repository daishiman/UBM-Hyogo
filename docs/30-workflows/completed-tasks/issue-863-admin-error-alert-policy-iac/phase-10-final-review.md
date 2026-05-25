# Phase 10 — 最終レビュー

> Task: issue-863-admin-error-alert-policy-iac
> 区分: 実装仕様書 / visual: **NON_VISUAL**
> 目的: AC-1..AC-6 と成果物の突合、blocker 判定、MINOR 指摘の未タスク化候補記録。

3-state 凡例:
- `implemented_local_runtime_pending` — コード/JSON/CI/runbook がローカル反映済みで、Sentry apply と staging 疎通が user-gated。
- `runtime_pending` — 実 Sentry API / staging deploy が必要で user-gated。実行は Phase 11 / Phase 13。

---

## 10-1. AC ↔ 成果物 突合表

| AC | 内容 | 対応ファイル | 検証手段 | 状態 |
|----|------|------------|----------|------|
| AC-1 | alert policy を IaC commit 済 | `infra/sentry-alerts/policies/admin-error-boundary.json`, `schema/policy.schema.json`, `lib/*.ts`, `README.md` | `pnpm test:sentry-alerts`（schema-contract green）/ git に commit | implemented_local_runtime_pending（実 Sentry rule への apply は runtime_pending） |
| AC-2 | digest tag + scope=admin で閾値発火 | `apps/web/src/lib/logger.ts`（scope/digest を tags 昇格）+ `policies/admin-error-boundary.json`（`tags.scope==admin` + 5分窓3回 frequency 条件 + digest notification tag） | `logger.spec.ts` の tag 検証 + policy schema-contract | implemented_local_runtime_pending（実発火確認は runtime_pending） |
| AC-3 | staging 通知疎通 evidence 1 件 | `docs/30-workflows/.../outputs/phase-11/manual-test-result.md`（evidence 貼付先） | staging で admin error 発生 → Slack #ubm-hyogo-incidents 着信 | **runtime_pending**（user-gated・Phase 11） |
| AC-4 | 初動 runbook 存在 | `docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md` | ファイル存在 + 手順節（検知→一次切り分け→親 digest=167275886 参照→収束判定） | implemented_local_runtime_pending |
| AC-5 | CODEOWNERS owner 明示 | `.github/CODEOWNERS`（`infra/sentry-alerts/**` に owner 追加） | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` が `{"errors":[]}` | implemented_local_runtime_pending（gh 検証は commit 後） |
| AC-6 | 手動 console との drift なし（IaC 正本） | `.github/workflows/sentry-alerts-drift.yml` + `lib/diff.ts` + `lib/canonicalize.ts` | `sentry-alerts:diff --ci` が drift=0 / CI gate | implemented_local_runtime_pending（実 console diff は runtime_pending） |

---

## 10-2. blocker 判定

| 項目 | 判定 | 理由 |
|------|------|------|
| AC-3 staging 通知疎通 | **runtime_pending（非 blocker）** | 実 staging deploy + 意図的 error 発生 + Slack 着信確認は外部副作用を伴い user-gated。spec はevidence 貼付先を確定済み |
| AC-1 / AC-6 Sentry API apply | **runtime_pending（非 blocker）** | `sentry-alerts:apply` の実 API 適用は `Alerts:Write` scope token を要し user-gated。IaC 宣言と diff lib は implemented_local_runtime_pending で完結 |
| implemented_local 範囲 | **blocker なし** | logger.ts tag 昇格 / IaC lib / schema / runbook / CODEOWNERS / CI yml はすべて Phase 9 gate でローカル検証可能。実装サイクルで green 化できる |

**総合判定**: ローカル実装として完結（implemented_local_runtime_pending）。runtime_pending 2 群（staging 疎通 / Sentry apply）は
Phase 11 / Phase 13 の user-gated 工程へ正しく委譲されており、spec レビューの blocker は存在しない。

---

## 10-3. MINOR 指摘（未タスク化候補 / Phase 12 で formalize）

| # | 指摘 | 推奨対応 | 緊急度 |
|---|------|---------|--------|
| M-1 | logger の Sentry tag に `scope` を昇格すると、admin 以外の将来 scope（public/member）も tag cardinality に乗る | 許容（scope は低 cardinality な閉じた enum 想定）。値が増えたら allowlist 化を検討 | low |
| M-2 | `infra/sentry-alerts/lib` と `cloudflare-alerts/lib` の `deepDiff`/`sortKeys` 重複 | Phase 8-2 の判断通り 3rd provider 出現時に `infra/_shared/` へ抽出 | low |
| M-3 | drift CI が Sentry read token を要するため PR では manifest/unit のみ（cloudflare-alerts と同じ二段構成） | 現状方針を踏襲（PR=validate / schedule=diff）。追加対応不要 | info |

MINOR はいずれも本タスクの DoD を阻害しない。未タスク化候補として記録し、
`docs/30-workflows/unassigned-task/` への切り出しは Phase 12 の判断に委ねる。
