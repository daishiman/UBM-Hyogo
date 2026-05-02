# Discovered Issues

## Summary

NO_BLOCKER — 仕様化過程で blocking issue は検出されず。MINOR 課題は Phase 11 / Phase 12 の補助 evidence で解消済み、または future task として登録済み。

## MINOR / FYI

| # | Issue | Severity | Mitigation |
| --- | --- | --- | --- |
| 1 | bats と mock wrangler の組み合わせで `cf.sh` 内 `op run` 呼び出しが mock を貫通するリスク | MINOR | `MOCK_WRANGLER=1` 環境下では `cf.sh` 内 `op run` も bypass し fixture から返す mock 戦略を Phase 4 で確定 |
| 2 | redaction grep の false-positive（`op://Vault/Item/Field` 参照を Token と誤認）| MINOR | 正規表現で `op://` 参照を除外。Phase 11 redaction-check で確認 |
| 3 | CI gate の secret 取り違え（production secret を staging job で参照）| MEDIUM | F6 yml で `secrets.CLOUDFLARE_API_TOKEN_STAGING` 限定 + `if: env == 'staging'` ガード |
| 4 | `set -x` の事故有効化で Token がログに混入 | MEDIUM | 全 script で `set -x` 禁止、bats テストで `set -x` 出力検出時 fail させる guard |
| 5 | UNIQUE index 作成失敗時の即興 SQL 実行誘惑 | MINOR | Phase 6 failure handling で「中止 + 判断待ち + 別 migration」を明文化 |

## Open Runtime Boundary

Production migration apply 運用実行は意図的に UT-07B-FU-03 のスコープ外。`docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md` として formalize 済。本タスクで取得する evidence は staging DRY_RUN のみ。production 実走 evidence は FU-04 で取得。

## Out of scope（再掲）

- queue / cron split for large back-fill → UT-07B-FU-01
- admin UI retry label → UT-07B-FU-02
- aiworkflow-requirements skill の D1 migration 逆引き index 整備 → 将来 skill 改修 wave

## Final

`spec_created` 段階で blocking issue なし。Phase 13 PR 作成（ユーザー承認待ち）に進行可能。
