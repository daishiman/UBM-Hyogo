# Issue #717 Followup 002 apps/api D1 Token Cutover

## メタ情報

```yaml
task_id: issue-717-followup-002-apps-api-d1-token-cutover
title: apps/api D1 Token Cutover
category: CI/CD Security
status: blocked
source_workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
github_issue: 717
created_date: 2026-05-16
taskType: implementation
visualEvidence: NON_VISUAL
dependencies:
  - backend-ci D1 credential inventory
  - supported Cloudflare OIDC or token-split deploy path
```

## 1. 苦戦箇所

`apps/api` の D1 migration / Workers deploy credential は web-cd とは別の blast radius と rollback path を持つ。web-cd の OIDC 可否だけで backend-ci / D1 migration credential を同時に変更すると、migration apply と deploy failure の復旧境界が曖昧になる。

## 2. リスクと対策

| リスク | 対策 |
|---|---|
| D1 migration token と Workers deploy token の混同 | `CF_TOKEN_D1_*` と `CF_TOKEN_WORKERS_*` の役割を分離して inventory |
| migration apply 後 deploy fail の partial operation | backend-ci の post-migration deploy failure summary を維持 |
| web-cd と apps/api の同時 credential cutover | 別 PR / 別 workflow として実施 |
| unsupported OIDC path | official support がない場合は step-scoped token split のまま維持 |

## 3. 検証方法

- `rg -n "CLOUDFLARE_API_TOKEN|CF_TOKEN_D1|CF_TOKEN_WORKERS" .github/workflows apps scripts` で credential use を棚卸し。
- backend-ci dry-run / actionlint / workflow secret grep gate。
- staging D1 migration list / Workers deploy log の redacted evidence。
- `deployment-secrets-management.md` と `deployment-gha.md` の before/after inventory。

## 4. スコープ

### 含む

- `backend-ci.yml` / D1 migration verification workflow の credential boundary hardening。
- D1 token and Workers token split or supported OIDC adoption.
- redaction and rollback evidence.

### 含まない

- web-cd production OIDC cutover。
- legacy token physical revocation。
- 1Password vault restructuring.
