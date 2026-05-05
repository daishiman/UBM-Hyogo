# Phase 5 成果物: 実装

## 確定事項

| 項目 | 値 |
| --- | --- |
| script 配置 | `scripts/observability-target-diff.sh` (スタンドアロン bash) |
| redaction module | `scripts/lib/redaction.sh` (純粋関数 `redact_stream` / `redact_string`) |
| 言語 | bash (POSIX 拡張) |
| 依存 | `bash scripts/cf.sh` (allowlist 経由のみ) |
| HTTP method | GET only (read-only) |

## 新規作成ファイル

| パス | 役割 |
| --- | --- |
| `scripts/observability-target-diff.sh` | 本 script 本体 (CLI / fetch / diff / format / 出力) |
| `scripts/lib/redaction.sh` | redaction 共通関数 R-01〜R-06 |

## 関数構造 (SRP)

| 関数 | 責務 |
| --- | --- |
| `parse_args` | CLI 引数解析 + usage |
| `cf_call` | `bash scripts/cf.sh` 唯一の呼び出し点 (allowlist) |
| `fetch_r1_workers_logs` / `fetch_r2_tail` / `fetch_r3_logpush` / `fetch_r4_analytics` | 4 軸ごとの read-only 取得 |
| `classify_axis` | 軸ごとの diff 分類 (legacy-only / current-only / shared / shared-empty) |
| `format_md` / `format_json` | 出力整形 (純粋関数) |
| `redact_stream` / `redact_string` | redaction 適用 (`scripts/lib/redaction.sh`) |
| `log` / `warn` / `err` | stderr ログ (redaction 通過後) |

## CLI 仕様 (確定)

```
bash scripts/observability-target-diff.sh \
  --current-worker ubm-hyogo-web-production \
  --legacy-worker  ubm-hyogo-web \
  [--config apps/web/wrangler.toml] \
  [--format md|json] \
  [--no-color]
```

| exit | 意味 |
| --- | --- |
| 0 | 一致 (差分なし、または plan 制限による N/A 同士の一致) |
| 1 | 差分あり (一方のみ target を持つ軸が 1 個以上) |
| 2 | API 失敗 / network / config 不在 |
| 3 | 認証失敗 (現状未到達。`cf_call` allowlist 違反時は 2) |
| 64 | 引数不正 |

## redaction module 仕様 (実装版)

| ID | regex (sed -E) | 置換後 |
| --- | --- | --- |
| R-02 (先) | `(Bearer\|bearer\|...)\s+[^[:space:],]+` | `Bearer ***REDACTED_AUTH***` |
| R-02 (副) | `(Authorization)[: =]+\S+` | `Authorization: ***REDACTED_AUTH***` |
| R-06 | `ya29\.[A-Za-z0-9_-]+` | `***REDACTED_OAUTH***` |
| R-04 | `AKIA[0-9A-Z]{16}` | `***REDACTED_ACCESS_KEY***` |
| R-05 | `(dataset_credential\|access_key_id\|secret_access_key\|api_key\|...)[: =]+"?[^",[:space:]]+` | `\1: ***REDACTED***` |
| R-01 | `[A-Za-z0-9_-]{40,}` | `***REDACTED_TOKEN***` |
| R-03 | `(https?://host(/path)?)\?[^[:space:]]*` | `host?***REDACTED***` |

R-02 → R-06 → R-04 → R-05 → R-01 → R-03 の順で適用 (specific patterns first)。

## read-only 保証
- script 冒頭で `HTTP method は GET のみ` を宣言コメント
- `cf_call` allowlist: `whoami` / `d1` / `kv` / `r2` / `tail` / `deployments` のみ通す。`secret put` / `deploy` / `rollback` は到達しない。
- `wrangler` 直叩き 0 件 (Phase 9 grep で検証)

## env / 副作用
- `OBS_DIFF_FETCH_LOGPUSH=1` で `cf_call` 経由 logpush 取得を試行 (それ以外は即 dashboard fallback)
- 一時ファイル / log file 生成しない (on-memory のみ)
- ターミナル history への漏洩防止: 引数で実値を取らない (token は op 経由)

## 動作確認 (smoke test, 2026-05-01)
- `bash scripts/observability-target-diff.sh --current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web --config apps/web/wrangler.toml`
- exit=1 (diff summary: current-only=1 R1 Workers Logs)
- 出力に token / secret 0 件
