# Phase 7 / coverage report

## redaction pattern coverage (100%)

| Pattern | regex 例 | TC | 結果 |
| --- | --- | --- | --- |
| R-01 generic 40+ | `[A-Za-z0-9_-]{40,}` | unit "R-01 long token" | PASS |
| R-02 Bearer / Auth | `Bearer\s+\S+`, `Authorization: \S+` | unit "R-02 Bearer header" | PASS |
| R-03 URL query | `https?://host/path?...` → `?***REDACTED***` | unit "R-03 URL query" | PASS |
| R-04 AKIA | `AKIA[0-9A-Z]{16}` | unit "R-04 AKIA key" | PASS |
| R-05 named credentials | `dataset_credential=...`, `access_key_id=...` | unit "R-05 dataset_credential" | PASS |
| R-06 OAuth ya29 | `ya29\.[A-Za-z0-9_-]+` | unit "R-06 ya29 oauth" | PASS |

## exit code coverage

| code | TC | 観測 / 設計 |
| --- | --- | --- |
| 0 | 双方一致時 (TC-10 shared / shared-empty) | 観測 (TC-10) |
| 1 | 差分検出 | 観測 (smoke で current-only=1) |
| 2 | API 失敗 / config 不在 | 設計 (config 不在で `err` → exit 2) |
| 3 | 認証失敗 | 設計 (現状 cf_call allowlist 経路では到達せず、parse_args の category) |
| 64 | 引数不正 | 観測 (TC-12) |

## case branch coverage

| 分岐 | TC |
| --- | --- |
| `parse_args` 各 case (`--current-worker` / `--legacy-worker` / `--config` / `--format` / `--no-color` / `-h` / unknown) | TC-12 + smoke |
| `cf_call` allowlist (whoami / d1 / kv / r2 / tail / deployments / *) | 設計レビュー |
| `classify_axis` (shared / shared-empty / current-only / legacy-only) | smoke で current-only / shared / shared-empty が同時発火 |

## golden 一致
- `tests/golden/diff-mismatch.md`: 現環境 (legacy worker が wrangler.toml に section 持たない) でのスナップショット
- `tests/golden/usage.txt`: usage 出力の正本

## no-secret-leak audit
- `grep -rnE 'AKIA[0-9A-Z]{16}|ya29\.[A-Za-z0-9_-]{8,}' tests/` → 全 hit が `AKIAFAKE` / `MOCK_OAUTH_VALUE` 等の合成値
- 実 token / 実 credential ヒット: **0 件**

## 計測対象 allowlist (変更ファイル)
```
scripts/observability-target-diff.sh
scripts/lib/redaction.sh
tests/unit/redaction.test.sh
tests/integration/observability-target-diff.test.sh
tests/fixtures/observability/**
tests/golden/**
```

## 禁止パターン (本タスクで触らない)
```
apps/web/**
apps/api/**
.claude/**
docs/** (本タスク仕様書ディレクトリ・親タスク runbook 追記先以外)
```
