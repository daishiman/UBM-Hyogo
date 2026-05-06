# dry-run 実行 + dashboard evidence 取得 - structure-verification.md

state: implemented-local
workflow_id: issue-351-09c-post-release-dashboard-automation

## 目的

NON_VISUAL evidence として CLI / workflow log / artifact JSON の取得手順と placeholder を実体化する。

## 証跡

- 本ファイルは task-specification-creator の outputs 実体要件を満たすための仕様書サイクル成果物。
- runtime evidence は後続実装サイクルで同一 path に上書きまたは追記する。

## 完了条件

- [x] 成果物 path が実体化されている
- [x] artifacts.json と outputs/artifacts.json から参照できる

## NON_VISUAL evidence contract

- expected files: structure-verification.md / grep-verification.md / dataset-discover.md / dry-run-evidence.md / redaction-check.md / schema-check.md
- runtime PASS requires schema check exit 0 and redaction check 0 findings.

## Structure verification

Implemented files:

```text
.github/workflows/post-release-dashboard.yml
scripts/post-release-dashboard/collect.sh
scripts/post-release-dashboard/lib/cf-graphql.sh
scripts/post-release-dashboard/lib/d1-metrics.sh
scripts/post-release-dashboard/lib/cron-status.sh
scripts/post-release-dashboard/lib/format-dashboard.sh
scripts/post-release-dashboard/lib/redaction-check.sh
scripts/post-release-dashboard/__tests__/
```

Result: present in local worktree.
