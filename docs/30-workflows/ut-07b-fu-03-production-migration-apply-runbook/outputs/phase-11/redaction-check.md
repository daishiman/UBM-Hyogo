# Redaction Check（F3 evidence.sh redact 関数の検証）

## Scope

F3 `scripts/d1/evidence.sh` の redact 関数が、実行ログに混入し得る Token / Account ID / 40 文字級英数字を `***REDACTED***` に置換することを bats（ケース 7-9）と grep の二重で確認する。

## F3 redact ロジック仕様

| パターン | 入力例 | 出力 |
| --- | --- | --- |
| 40+ 文字英数字 | `Bearer abcdef0123456789ABCDEF0123456789abcdef01234567` | `Bearer ***REDACTED***` |
| `account_id=[a-f0-9]{32}` | `account_id=0123456789abcdef0123456789abcdef` | `account_id=***REDACTED***` |
| `CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{20,}` | `CLOUDFLARE_API_TOKEN=xyz...` | `CLOUDFLARE_API_TOKEN=***REDACTED***` |
| 通常 SQL 出力（`schema_aliases` / `0008_schema_alias_hardening` 等） | そのまま | そのまま |

## bats ケース（再掲）

| ケース | 内容 | 期待 |
| --- | --- | --- |
| 7 | 40+ 文字英数字 token を redact | `***REDACTED***` |
| 8 | `account_id=` 32-hex を redact | `***REDACTED***` |
| 9 | 通常 SQL 出力は変更しない | 入力 == 出力 |

## サンプル fixture（bats 内で使用）

```
# input
Bearer FAKE
account_id=0123456789abcdef0123456789abcdef
CREATE TABLE schema_aliases (...)
SELECT name FROM sqlite_master;

# expected output (after redact)
Bearer ***REDACTED***
account_id=***REDACTED***
CREATE TABLE schema_aliases (...)
SELECT name FROM sqlite_master;
```

> 注意: `FAKE_` プレフィックスを付したサンプルは grep redaction の allow-list に含める。実 Token は本仕様書 / 全 evidence ファイルで一切記述しない。

## phase-11 全体に対する grep redaction（最終チェック）

```bash
rg -nE '\b[A-Za-z0-9_-]{40,}\b' \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-11/ \
  | grep -vE '(commit|sha|hash|run-id|migration|FAKE|REDACTED)'
```

期待: 0 hit。

## Redaction Rules（運用合意）

| Rule | Result |
| --- | --- |
| F3 redact が Token-like を mask する | bats ケース 7 で確認 |
| F3 redact が Account ID を mask する | bats ケース 8 で確認 |
| F3 redact が通常 SQL を破壊しない | bats ケース 9 で確認 |
| 仕様書 / evidence に raw Token 値を書かない | grep 0 hit |
| `set -x` / `wrangler --debug` を使わない | runbook で禁止明記 |
| production 実 apply 結果（行数・hash・時刻）を記録しない | A-4 grep 0 hit |
