# Phase 13: PR 作成（user 承認後のみ）

> 入力: [phase-12-documentation.md](phase-12-documentation.md) / `outputs/phase-12/*`
> 出力: `outputs/phase-13/pr-creation-result.md`（PR 作成完了後に記録）
> 状態: `blocked_pending_user_approval`

本 Phase は commit / push / PR 作成を扱う。これらはすべて **user 承認後のみ** 実行する user-gated 操作であり、
implemented_local_runtime_pending 段階では実行しない。実装サイクル（logger.ts 変更 + `infra/sentry-alerts/` 新規 + テスト）が完了し、
ローカル検証が green になった後に、本手順に従って PR を作成する。

---

## 13-0. PR 作成の前提（user-gated）

- base ブランチは **`dev`**（既定の開発統合ブランチ）。`main` への PR は production リリース時の `dev → main` のみで、本タスクでは使わない。
- 作業ブランチは差分主題から `feat/issue-863-admin-error-alert-policy-iac` を自律作成する（observability / IaC 追加のため `feat/`）。
- PR 文言は **`Refs #863`** のみを使う。issue #863 は **CLOSED のまま**であり、`Closes #863` / `Fixes #863` は使わない（close しない）。

## 13-1. 変更ファイル一覧（PR に含める全件）

| パス | 種別 |
|---|---|
| `apps/web/src/lib/logger.ts` | 修正（scope/digest を Sentry tag へ昇格） |
| `apps/web/src/lib/__tests__/logger.spec.ts` | 追記（TC-LOG-01..04） |
| `infra/sentry-alerts/policies/admin-error-boundary.json` | 新規 |
| `infra/sentry-alerts/schema/policy.schema.json` | 新規 |
| `infra/sentry-alerts/lib/types.ts` | 新規 |
| `infra/sentry-alerts/lib/load.ts` | 新規 |
| `infra/sentry-alerts/lib/diff.ts` | 新規 |
| `infra/sentry-alerts/lib/api-client.ts` | 新規 |
| `infra/sentry-alerts/lib/canonicalize.ts` | 新規 |
| `infra/sentry-alerts/lib/cli.ts` | 新規 |
| `infra/sentry-alerts/lib/__tests__/schema-contract.spec.ts` | 新規 |
| `infra/sentry-alerts/lib/__tests__/load.spec.ts` | 新規 |
| `infra/sentry-alerts/lib/__tests__/diff.spec.ts` | 新規 |
| `infra/sentry-alerts/README.md` | 新規 |
| `.github/workflows/sentry-alerts-drift.yml` | 新規 |
| `docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md` | 新規 |
| `.github/CODEOWNERS` | 修正（`infra/sentry-alerts/** @daishiman` 追加） |
| `package.json` | 修正（`sentry-alerts:{list,diff,apply}` + `test:sentry-alerts` script） |
| `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/**` | 仕様書一式 |

## 13-2. 検証コマンド（PR 作成前に green を確認）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run apps/web/src/lib/__tests__/logger.spec.ts
mise exec -- pnpm test:sentry-alerts
gh api repos/daishiman/UBM-Hyogo/codeowners/errors   # {"errors":[]} を期待
bash scripts/verify-pr-ready.sh                       # docs-only gate pre-flight
```

## 13-3. CODEOWNERS governance path 追加の注意

- CLAUDE.md「最終マッチ勝ち仕様」に従い、`infra/sentry-alerts/** @daishiman` を既存 governance path 群の近傍へ追加する。
  global fallback (`* @daishiman`) は冒頭 1 行のまま動かさない。
- 追加後は `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` が `{"errors":[]}` を返すことを必須確認とする。
- solo 運用ポリシーのため `require_code_owner_reviews` は有効化しない（ownership 文書化目的のみ）。

## 13-4. PR 本文

- `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱い、`outputs/phase-12/implementation-guide.md` の内容を漏れなく反映する。
- `outputs/phase-11/` にスクリーンショット画像が無い（NON_VISUAL）ため、PR 本文にスクリーンショット専用セクションは作らない。
- 本文末尾に `Refs #863` を記載し、`infra/sentry-alerts/` の IaC 概要・logger tag 昇格・drift CI・runbook を要約する。

## 13-5. runtime / user-gated 境界（本 Phase では未実行）

| 操作 | 状態 |
|---|---|
| commit / push / PR 作成 | user-gated（承認後のみ） |
| Sentry alert rule の `apply`（実 API 反映） | user-gated（apply token / staging→production） |
| staging deploy + 通知疎通 evidence（AC-3） | runtime_pending（staging 環境必要） |

PR 作成完了後は `outputs/phase-13/pr-creation-result.md` に PR URL / 採用ブランチ / 検証結果 / 残課題を 1 回だけ記録する。
