# Phase 7 Output: カバレッジ確認

## 観測対象カバレッジ

| workflow | SSOT反映 | 備考 |
| --- | --- | --- |
| `ci.yml` | PASS | dev / main |
| `backend-ci.yml` | PASS | deploy-staging / deploy-production |
| `validate-build.yml` | PASS | main build validation |
| `verify-indexes.yml` | PASS | drift gate |
| `web-cd.yml` | PASS | deploy-staging / deploy-production |

## スコープ外

`e2e-tests.yml` / `pr-build-test.yml` / `pr-target-safety-gate.yml` は Phase 12 の未タスク検出で扱う。
