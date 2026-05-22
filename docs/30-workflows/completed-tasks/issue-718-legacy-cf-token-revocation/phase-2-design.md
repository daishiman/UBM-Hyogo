# Phase 2 Design

## Gate Model

| Gate | Scope | AI may execute before approval |
| --- | --- | --- |
| Gate A | Specification close-out and ledger sync | yes |
| Gate B | Git publish / PR | no |
| Gate C | Cloudflare token revocation, GitHub secret deletion, 1Password mutation | no |

## Evidence Split

Read-only evidence:

- `rg -n "CLOUDFLARE_API_TOKEN|CLOUDFLARE_API_TOKEN_STAGING" .github apps packages scripts docs .claude`
- `gh issue view 718 --json number,title,state,url,labels`
- `gh secret list --env staging` and `gh secret list --env production` name-only output, if user permits GitHub read-only access.

Mutation evidence:

- Cloudflare dashboard revocation or approved wrapper command result.
- GitHub secret deletion result.
- 1Password item status reconciliation.

## Redaction Contract

Evidence must not include token values, token suffixes, Cloudflare account IDs, secret values, vault contents, or hashes that can be used as stable identifiers for a secret value.

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 2 |
| status | completed |

## 目的

Read-only evidence と mutation evidence を分離した設計を確定する。

## 実行タスク

- Gate A/B/C を定義する。
- Redaction contract を定義する。

## 参照資料

- `artifacts.json`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`

## 成果物

- `phase-2-design.md`

## 完了条件

- Mutation が approval marker なしに実行不可であることが明記されている。
