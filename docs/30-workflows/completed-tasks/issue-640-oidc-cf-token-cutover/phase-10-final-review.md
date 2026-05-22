# Phase 10: 最終レビュー

> [実装区分: 実装仕様書]

## 1. acceptance criteria 突合

| criteria | 検証方法 | PASS/FAIL |
|---|---|---|
| `web-cd.yml` の deploy step 以外で `CLOUDFLARE_API_TOKEN` が unavailable | `workflow-env-scope.test.sh` | completed |
| `backend-ci.yml` 4 箇所が step-scoped | `workflow-env-scope.test.sh` | completed |
| staging deploy が新方式で green | gh run view | runtime_pending（user-gated） |
| `scripts/cf.sh` 互換性維持 | env var 名固定 + static review | completed |
| redaction-check で token leak ゼロ | `redaction-check.test.sh` | completed_local / runtime_pending for real deploy logs |
| `permissions:` 最小化（OIDC 採用時のみ） | OIDC 未採用なのでスキップ | N/A |

## 2. MINOR / blocker

- 本タスクで MINOR 指摘が発生した場合は `unassigned-task/issue-640-followup-*.md` に未タスク化
- OIDC 完全移行は **既に Phase 12 で formalize 予定**（重複起票しない）

## 3. blocker 判定

- blocker なし。staging green は Phase 11 runtime evidence として user approval 後に取得する。

## 4. DoD

- [x] local acceptance criteria は completed
- [x] runtime-only acceptance criteria は `runtime_pending` として user-gated
- [x] MINOR は unassigned-task として登録
