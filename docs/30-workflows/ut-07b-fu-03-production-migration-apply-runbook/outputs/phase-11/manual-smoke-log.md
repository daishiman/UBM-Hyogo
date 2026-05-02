# bats local 実行ログ仕様（`pnpm test:scripts`）

## 目的

F1-F4 scripts（`scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh`）に対する bats unit tests の期待 stdout / exit code を本仕様書で確定する。実走時は本ファイルへ実出力を redact 後に追記する。

## 実行コマンド

```bash
pnpm test:scripts
# = bats scripts/d1/__tests__/*.bats
```

## 期待 stdout（TAP 形式）

```
1..12
ok 1 preflight: rejects unknown db name (exit=2)
ok 2 preflight: requires --env production for prod target
ok 3 preflight: propagates migrations list failure (exit=3)
ok 4 postcheck: returns 0 when all 5 objects exist
ok 5 postcheck: returns 4 when any object missing
ok 6 postcheck: contains no destructive SQL (DROP/DELETE/TRUNCATE)
ok 7 evidence: redacts 40+ char alphanumeric token to ***REDACTED***
ok 8 evidence: redacts account_id 32-hex hash pattern
ok 9 evidence: preserves normal SQL output unchanged
ok 10 apply-prod: DRY_RUN=1 skips wrangler d1 migrations apply
ok 11 apply-prod: forces DRY_RUN=1 for non-staging in test mode
ok 12 apply-prod: stops at preflight failure without invoking apply
# all tests passed
```

## 期待 exit code

`0`（全 PASS）。

## bats ファイル構成

| ファイル | 検証対象 | ケース |
| --- | --- | --- |
| `scripts/d1/__tests__/preflight.bats` | F1 | 1〜3 |
| `scripts/d1/__tests__/postcheck.bats` | F2 | 4〜6 |
| `scripts/d1/__tests__/evidence.bats` | F3 | 7〜9 |
| `scripts/d1/__tests__/apply-prod.bats` | F4 | 10〜12 |

## 失敗時の運用

- `not ok` が出た場合、対応する F1-F4 script を修正してから再実行
- bats stdout は本ファイルへ redact 後にコピー（Token 値・Account ID 値は `***REDACTED***` に置換）

## 実走時に追記する項目

| 項目 | 値 |
| --- | --- |
| 実施日時 | YYYY-MM-DD HH:MM (JST) |
| 実施者 | （ユーザー名 / GitHub handle） |
| Node version | （`node -v`） |
| bats version | （`bats --version`） |
| 実 stdout（redact 後） | 期待 stdout との diff |
| 実 exit code | `0` 期待 |

## 現状

NOT_EXECUTED_IN_THIS_REVIEW. bats 実装と実走は Phase 11 実施タスク（operator）で取得する。本仕様書段階では期待値のみ確定。
