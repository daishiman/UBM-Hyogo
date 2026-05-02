# Manual Test Checklist（bats × AC マッピング）

## Scope

NON_VISUAL — 実装仕様書スコープ。bats / staging dry-run / CI gate / grep 検証の AC トレース。

## bats ケース × AC マトリクス

| bats # | テスト名 | 対応 AC |
| --- | --- | --- |
| 1 | preflight: rejects unknown db name | AC-4 / AC-9 |
| 2 | preflight: requires --env production for prod target | AC-4 / AC-5 |
| 3 | preflight: propagates migrations list failure | AC-4 / AC-8 |
| 4 | postcheck: returns 0 when all 5 objects exist | AC-3 / AC-6 |
| 5 | postcheck: returns 4 when any object missing | AC-6 / AC-8 |
| 6 | postcheck: contains no destructive SQL | AC-10 |
| 7 | evidence: redacts 40+ char alphanumeric token | AC-7 / AC-12 |
| 8 | evidence: redacts account_id 32-hex pattern | AC-7 / AC-12 |
| 9 | evidence: preserves normal SQL output | AC-7 |
| 10 | apply-prod: DRY_RUN=1 skips wrangler apply | AC-9 / AC-16 / AC-19 |
| 11 | apply-prod: forces DRY_RUN=1 for non-staging in test | AC-9 / AC-16 |
| 12 | apply-prod: stops at preflight failure | AC-8 / AC-19 |

## CI gate × AC マッピング

| CI job | 対応 AC |
| --- | --- |
| `pnpm test:scripts`（bats） | AC-13 / AC-17 / AC-18 |
| `list-syntax-check`（staging） | AC-4 / AC-18 |

## checks（spec 段階）

- [x] bats ケース 12 件が `manual-smoke-log.md` で確定
- [x] staging dry-run 期待出力が `staging-dry-run.md` で確定
- [x] CI gate job 構成が phase-11.md / `d1-migration-verify.yml` 仕様で確定
- [x] redaction 仕様が `redaction-check.md` で確定
- [x] 5 オブジェクト存在確認 SQL が `structure-verification.md` で確定
- [x] 全 AC-1〜AC-20 が bats / CI gate / grep のいずれかにマッピング済み

## 実走 evidence

NOT_EXECUTED_IN_THIS_REVIEW. operator 実施タスク（別タスク or Phase 11 実走）で取得。本仕様書段階では期待値のみ確定。
