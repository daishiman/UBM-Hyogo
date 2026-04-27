# Phase 11: 手動 smoke test ログ

## 実施日

2026-04-27

## 検証コマンド（runbook §7 sanity check）

### main protection

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '{reviews: .required_pull_request_reviews.required_approving_review_count,
         status_checks: .required_status_checks.contexts,
         force_push: .allow_force_pushes.enabled,
         deletions: .allow_deletions.enabled}'
```

結果:
```json
{"deletions":false,"force_push":false,"reviews":0,"status_checks":["ci","Validate Build"]}
```
→ 期待値一致。**AC-1 PASS**。

### dev protection

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '{reviews: .required_pull_request_reviews.required_approving_review_count,
         status_checks: .required_status_checks.contexts,
         force_push: .allow_force_pushes.enabled}'
```

結果:
```json
{"force_push":false,"reviews":0,"status_checks":["ci","Validate Build"]}
```
→ 期待値一致。**AC-2 PASS**。

### environments

```bash
gh api repos/daishiman/UBM-Hyogo/environments \
  --jq '.environments[] | {name: .name, branch_policy: .deployment_branch_policy}'
```

結果（production / staging 抜粋）:
```json
{"name":"production","branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
{"name":"staging","branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
```

### branch policy 詳細

```bash
gh api repos/daishiman/UBM-Hyogo/environments/production/deployment-branch-policies
gh api repos/daishiman/UBM-Hyogo/environments/staging/deployment-branch-policies
```

結果:
- production: `branch_policies = [{name: "main", type: "branch"}]`
- staging: `branch_policies = [{name: "dev", type: "branch"}]`

→ 期待値一致。**AC-3 / AC-4 PASS**。

### Required Reviewers 0 名の確認

```bash
gh api repos/daishiman/UBM-Hyogo/environments/production \
  --jq '{name, protection_rules: [.protection_rules[]? | {type, reviewers: (.reviewers // [])}], deployment_branch_policy}'
gh api repos/daishiman/UBM-Hyogo/environments/staging \
  --jq '{name, protection_rules: [.protection_rules[]? | {type, reviewers: (.reviewers // [])}], deployment_branch_policy}'
```

結果:

```json
{"deployment_branch_policy":{"custom_branch_policies":true,"protected_branches":false},"name":"production","protection_rules":[{"reviewers":[],"type":"branch_policy"}]}
{"deployment_branch_policy":{"custom_branch_policies":true,"protected_branches":false},"name":"staging","protection_rules":[{"reviewers":[],"type":"branch_policy"}]}
```

`required_reviewers` type の protection rule は存在せず、Required Reviewers 0 名と判定する。

### GitHub Actions context 登録確認

```bash
gh run list --workflow ci.yml --limit 5 --json databaseId,status,conclusion,createdAt,headBranch,event,url
gh run list --workflow validate-build.yml --limit 5 --json databaseId,status,conclusion,createdAt,headBranch,event,url
```

結果（最新抜粋）:

| Workflow | Run ID | Branch | Event | Conclusion |
| --- | --- | --- | --- | --- |
| `ci.yml` | 24977043633 | `main` | `push` | `success` |
| `ci.yml` | 24977037543 | `feat/ut-13-cloudflare-kv-session-cache` | `pull_request` | `success` |
| `validate-build.yml` | 24977043643 | `main` | `push` | `success` |
| `validate-build.yml` | 24977037541 | `feat/ut-13-cloudflare-kv-session-cache` | `pull_request` | `success` |

`ci` / `Validate Build` の context は GitHub Actions 側に登録済み。

### 再検証スクリプト

```bash
scripts/verify-branch-protection.sh
```

このスクリプトは main / dev protection、production / staging deployment branch policy、Required Reviewers 0 名を一括検証する。

## UI 確認指針（手動）

URL:
- Branch rules: `https://github.com/daishiman/UBM-Hyogo/settings/branches`
- Environments: `https://github.com/daishiman/UBM-Hyogo/settings/environments`

API 結果と UI 表示は GitHub の同一 backend を参照しているため、API 検証 PASS を primary evidence とする。視覚的検証（スクリーンショット）は本タスクの非視覚分類により省略し、UI 目視そのものは Phase 5 の手動適用ログに委ねる。

## 結論

全 sanity check PASS。UT-19 の AC-1 〜 AC-7 完全達成。
