# ADR: runtime-smoke staging への secret 注入経路

- Status: Accepted（本サイクル採用、production 拡張時に再評価）
- Date: 2026-05-08
- Related: Issue #571 / docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/

## Context

`scripts/smoke/runtime-attendance-provider.sh` を staging deploy 完了 trigger で GitHub Actions が自動実行する経路を構築する。本 smoke は以下 secret を要する:

- `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER`
- `SLACK_WEBHOOK_INCIDENT`（failure 時のみ。未設定なら failure notification step も失敗）

これらを CI runner にどう注入するかを決める。1Password 正本（CLAUDE.md 既定）との整合、無料枠維持、cross-environment 流入禁止が制約。

## Decision

**GitHub Environments + reusable workflow (`workflow_call`) 採用**。

- staging runtime credential 5 件（上記の `STAGING_*` と `SLACK_WEBHOOK_INCIDENT`）は **Environment `staging-runtime-smoke` scope のみ** に配置
- smoke は `backend-ci.yml` の API staging deploy 成功後に `uses: ./.github/workflows/runtime-smoke-staging.yml` で呼び出す。`repository_dispatch` 用の repository-scoped PAT は使わない
- 1Password 正本との同期は手動 update（ローテーション SOP として `operations/setup-github-environment.md`）

## Considered alternatives

| 観点 | GitHub Environments（採用） | 1Password connect | OIDC short-lived |
| --- | --- | --- | --- |
| 初期コスト | 低（既存機能） | 中（self-host が必要） | 中（OAuth client 設定） |
| rotate 容易性 | 中（手動 update） | 高（一元化） | 高（短命） |
| 無料枠 | ◯ | △（self-host 維持コスト） | ◯ |
| 誤発火リスク | 低（Environment scoped） | 中（ネットワーク依存） | 低（短命） |
| 既存運用整合 | 高（CLAUDE.md と整合） | 高（1Password 正本） | 中（新規導入） |

- **1Password connect**: 1Password を正本にしつつ secret を runtime 取得できるが、self-host connect server を Cloudflare Workers / 別 GitHub Actions runner で常時稼働させるコストが見合わない。staging 規模で early adoption は過剰。
- **OIDC short-lived**: Cloudflare Workers が `id_token` を OIDC IdP として受けて短命 token を発行する経路。production 規模で再評価する価値はあるが、本サイクルで導入すると review 範囲が肥大。

## Rollback Conditions

- Environment-scoped secret が staging→production で混線した（誤って production Environment 経由で smoke が走った等の incident 1 件以上）
- Environment secret rotation の SOP 追従ミスで failure 連鎖が発生
- secret 値が artifact / log / Slack post に leak（grep gate を bypass）

いずれか発生時、即時に `runtime-smoke-staging` workflow を `workflow_dispatch` のみに縮退、本 ADR を Superseded にして 1Password connect 案へ切替。

## Notes

- `repository_dispatch` は default branch workflow 定義・token permission・同一 SHA checkout の制約があるため不採用。
- AC-6（"repository-scoped secret に staging credential を置かない"）は staging runtime credential のみに適用する。
- `::add-mask::` 宣言は secret を参照する最初の step で必ず行う（`set -x` 併用は禁止）。
