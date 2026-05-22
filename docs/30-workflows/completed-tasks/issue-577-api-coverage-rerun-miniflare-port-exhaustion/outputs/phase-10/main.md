# Phase 10 — `scripts/api-coverage-rerun.sh` smoke test 計画

Status: PLAN_READY (実装は helper 採用時のみ)
Date: 2026-05-09

## 1. smoke test ケース表

| # | コマンド | 期待結果 |
| --- | --- | --- |
| 1 | `bash scripts/api-coverage-rerun.sh --help` | exit 0、stdout に Usage を表示 |
| 2 | `bash scripts/api-coverage-rerun.sh baseline --count=0` | exit 0、log file 0 件 |
| 3 | `VITEST_DRY_RUN=1 bash scripts/api-coverage-rerun.sh baseline --count=1`（vitest を mock 可能なら） | `baseline-rerun-1.log` 1 件作成、`# command_result` ブロック付き |
| 4 | `bash scripts/api-coverage-rerun.sh matrix --axis=B --value=maxWorkers=1` | `triage-matrix-maxWorkers-1.log` 作成、log 末尾に `exit_code` / `eaddrnotavail_count` 含む |
| 5 | `bash scripts/api-coverage-rerun.sh badcommand` | exit 2、stderr に `unknown subcommand` |
| 6 | `bash scripts/api-coverage-rerun.sh matrix --axis=Z --value=foo` | exit 2、stderr に `unknown axis` |

## 2. 検証コマンド

```bash
shellcheck scripts/api-coverage-rerun.sh
bash -n scripts/api-coverage-rerun.sh
```

## 3. 採用判断

- helper script を実コードとして導入する場合のみ smoke test も配置する（`scripts/__tests__/api-coverage-rerun.test.ts` または shell smoke）。
- baseline 3 回連続 PASS による no-code verification close-out 時は **smoke test 配置も skip**（helper script 自体を導入しないため整合）。
- shellcheck は採用時に CI 任意 gate として既存 lint pipe に追加可能（別 Issue 候補）。
