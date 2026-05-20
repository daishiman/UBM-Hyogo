# Issue #717 Followup 001 Production OIDC Cutover

## メタ情報

```yaml
task_id: issue-717-followup-001-production-oidc-cutover
title: Cloudflare GitHub Actions OIDC Staging Proof and Production Cutover
category: CI/CD Security
status: partially_consumed
source_workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
canonical_workflow: docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/
github_issue: 717
created_date: 2026-05-16
taskType: implementation
visualEvidence: NON_VISUAL
dependencies:
  - Cloudflare Workers GitHub Actions or wrangler-action official OIDC support
  - staging OIDC proof green after official support is confirmed
  - observation window fallback count zero
```

## 0. 消費状況（Issue #762 / 2026-05-17）

`docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/` で、公式 OIDC deploy support 前でも安全な周辺強化のみを同一 wave に実装した。

消費済み:

- subject claim pin dry-run helper: `scripts/oidc/verify-claim-pin.sh`
- OIDC token leak guard: `scripts/redaction-check.sh` の JWT-like token / `cloudflare-aud` 検出
- observation window manual gate: `.github/workflows/oidc-observation-window.yml`
- current safe baseline の明文化: `.github/workflows/web-cd.yml` コメントと `deployment-secrets-management.md` Issue #762 section

未消費で blocked 維持:

- `.github/workflows/web-cd.yml` への `permissions: id-token: write` 付与
- supported OIDC exchange step
- staging OIDC proof / production cutover
- observation 完了後の legacy token physical revocation

未消費分は G1（Cloudflare 公式 support）成立まで実装しない。

## 1. 苦戦箇所

Cloudflare Workers の現行 GitHub Actions 公式手順は API token authentication を案内しており、`cloudflare/wrangler-action` README も `apiToken` 入力を前提にしている。公式 OIDC deploy path が確認できない状態で staging / production job に `id-token: write` を追加すると、未検証の trust boundary と undocumented exchange endpoint に deploy を依存させることになる。

## 2. リスクと対策

| リスク | 対策 |
|---|---|
| undocumented OIDC endpoint による deploy outage | 公式 docs / action release notes で support を確認するまで staging proof も production cutover も着手禁止 |
| production deploy credential の rollback 不能 | step-scoped `CLOUDFLARE_API_TOKEN` fallback を observation 完了まで温存 |
| subject claim pin 漏れ | `repository` / `ref=refs/heads/main` / `environment=production` / `event_name=push` を必須条件化 |
| legacy token revocation の先行 | 本 task 完了 + observation 後まで `issue-640-followup-002` を blocked 維持 |

## 3. 検証方法

- official support を再確認し、入力名 / audience / exchange endpoint / rollback path を一次情報で固定。
- staging job で OIDC proof を取得し、観察期間で fallback 起動 0 を確認。
- `grep -n "id-token" .github/workflows/web-cd.yml` で staging / production job 配下の付与範囲を確認。
- `gh run view <run-id> --log` の redacted log で OIDC deploy success と fallback skip を確認。
- `bash scripts/redaction-check.sh --log <log> --account-id <account-id>` が exit 0。
- Cloudflare dashboard / API の deployment version と GitHub SHA を突合。

## 4. スコープ

### 含む

- official support 確認後の staging OIDC proof。
- staging observation 完了後の `deploy-production` job supported OIDC cutover。
- production subject claim pin 設計。
- rollback path と observation window の証跡化。

### 含まない

- legacy token physical revocation（`issue-640-followup-002-legacy-token-revocation`）。
- 1Password 構造変更（`issue-717-followup-003-1password-restructure`）。
- apps/api D1 token cutover（`issue-717-followup-002-apps-api-d1-token-cutover`）。
