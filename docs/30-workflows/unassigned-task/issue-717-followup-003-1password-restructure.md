# Issue #717 Followup 003 1Password Restructure

## メタ情報

```yaml
task_id: issue-717-followup-003-1password-restructure
title: 1Password Cloudflare Credential Restructure
category: Secret Management
status: blocked
source_workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
github_issue: 717
created_date: 2026-05-16
taskType: operations
visualEvidence: NON_VISUAL
dependencies:
  - production OIDC cutover completed
  - legacy token physical revocation completed
```

## 1. 苦戦箇所

1Password は local `scripts/cf.sh` 実行や emergency rollback の正本でもあるため、OIDC 設計段階で参照構造を先に変えると、まだ必要な `CLOUDFLARE_API_TOKEN` の取得経路を壊す可能性がある。

## 2. リスクと対策

| リスク | 対策 |
|---|---|
| rollback 用 token の取得経路喪失 | production cutover + observation + revocation 完了まで構造変更禁止 |
| op path drift | `op://` path は値ではなく item/path 名だけを evidence 化 |
| GitHub Secrets と 1Password の非同期 | before/after inventory を同一 wave で取得 |
| token preview / hash leakage | token 値、preview、hash を documentation に残さない |

## 3. 検証方法

- `rg -n "op://|CLOUDFLARE_API_TOKEN|CF_TOKEN_" .env* docs scripts .github` で参照 path を棚卸し。
- 1Password item names / field names のみを redacted inventory に保存。
- GitHub Secrets / Variables の names-only inventory と突合。
- `deployment-secrets-management.md` の placement matrix を更新。

## 4. スコープ

### 含む

- Cloudflare deploy credential item/path の再編。
- revoked legacy token item の status marking or removal decision.
- `.env.example` / runbook / deployment spec の path-only sync。

### 含まない

- token 値の記録。
- Cloudflare production cutover。
- legacy token revocation itself.
