# Phase 2 / redaction rules

## allowlist (出力可)
- Worker 名 (`ubm-hyogo-web-production` / `ubm-hyogo-web`)
- dataset 名 (Logpush / Analytics)
- URL の host 部 (例: `s3.amazonaws.com`)
- enabled flag (true/false)
- head_sampling_rate (数値)
- Logpush job 名
- filter 概要 (`script_name == <Worker>` の事実のみ)

## denylist (置換)

| ID | 種別 | regex | 置換後 |
| --- | --- | --- | --- |
| R-01 | Cloudflare API token / 長いランダム文字列 | `[A-Za-z0-9_-]{40,}` | `***REDACTED_TOKEN***` |
| R-02 | Authorization / Bearer / Basic header 値 | `(?i)(authorization\|bearer\|basic)[: ]+\S+` | `***REDACTED_AUTH***` |
| R-03 | URL の query string / userinfo (host 残し) | `\?[^[:space:]]*` | `?***REDACTED***` |
| R-04 | AWS Access Key | `AKIA[0-9A-Z]{16}` | `***REDACTED_ACCESS_KEY***` |
| R-05 | dataset credential | `dataset_credential[:= ]+\S+` | `dataset_credential=***REDACTED***` |
| R-06 | OAuth token (Google) | `ya29\.[A-Za-z0-9_-]+` | `***REDACTED_OAUTH***` |

## 適用範囲
- stdout: 出力前に必ず通過
- stderr: error message も同じ redaction
- log file: 生成しない

## golden 安定化
- 改行 LF / 末尾改行あり / UTF-8 / BOM なし
- 動的値 (タイムスタンプ等) は `<TIMESTAMP>` placeholder に置換してから比較
- golden 内に実値は一切書かない (合成 placeholder のみ)
