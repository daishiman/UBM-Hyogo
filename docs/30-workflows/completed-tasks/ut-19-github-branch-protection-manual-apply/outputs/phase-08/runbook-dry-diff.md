# Phase 8: ランブック dry-diff

## 比較対象

- 正本: `docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md`
- 実適用: `outputs/phase-05/apply-execution-log.md` および `gh-api-after-{main,dev}.json`

## main protection 比較

| 項目 | runbook | 実適用 | 一致 |
| --- | --- | --- | --- |
| `required_status_checks.strict` | `true` | `true` | ✓ |
| `required_status_checks.contexts` | `["ci", "Validate Build"]` | 同 | ✓ |
| `enforce_admins` | `false` | `false` | ✓ |
| `required_approving_review_count` | `0` | `0` | ✓ |
| `dismiss_stale_reviews` | `false` | `false` | ✓ |
| `require_code_owner_reviews` | `false` | `false` | ✓ |
| `restrictions` | `null` | `null` | ✓ |
| `allow_force_pushes` | `false` | `false` | ✓ |
| `allow_deletions` | `false` | `false` | ✓ |

## dev protection 比較

| 項目 | runbook | 実適用 | 一致 |
| --- | --- | --- | --- |
| `required_status_checks.strict` | `false` | `false` | ✓ |
| `required_status_checks.contexts` | `["ci", "Validate Build"]` | 同 | ✓ |
| `enforce_admins` | `false` | `false` | ✓ |
| `required_approving_review_count` | `0` | `0` | ✓ |
| `dismiss_stale_reviews` | `false` | `false` | ✓ |
| `allow_force_pushes` | `false` | `false` | ✓ |
| `allow_deletions` | `false` | `false` | ✓ |

## environments 比較

| Env | runbook | 実適用 | 一致 |
| --- | --- | --- | --- |
| production | branch policy = `main` のみ、reviewers 未設定 | 同 | ✓ |
| staging | branch policy = `dev` のみ、reviewers 未設定 | 同 | ✓ |

## DRY 化提案

1. **API payload の YAML 化**: 将来同じ設定を他リポジトリに展開する際、payload を `infrastructure/branch-protection/{main,dev}.json` に切り出し `gh api --input` で適用する形に整理可能。本タスクのスコープ外（提案のみ）。
2. **検証スクリプト**: `scripts/verify-branch-protection.sh` として `gh api --jq` チェックを 1 本化可能。本タスクのスコープ外（提案のみ）。

## 結論

runbook と実適用に差分なし。**AC-6 PASS**。
