# Phase 11 — evidence inventory

`outputs/phase-11/` 配下に格納する runtime evidence の一覧。すべて Phase 05 の各ステップから生成される。

## 11.1 evidence ファイル一覧

| # | path | source step | status (実行前) | 内容 / 取扱注意 |
|---|------|-------------|-----------------|-----------------|
| 1 | `outputs/phase-11/snapshot-before.json` | S1 | pending | `secretsReadiness` は bool のみ。`latestSyncRuns.errorMessage` に PII を含めないこと (snapshot 側で string 化済) |
| 2 | `outputs/phase-11/cf-secret-list.txt` | S3 | pending | キー名のみ。値は含まない (`cf.sh secret list` 仕様) |
| 3 | `outputs/phase-11/wrangler-cron-grep.txt` | S4 | pending | `grep` 出力。drift 0 件確認 |
| 4 | `outputs/phase-11/cron-tail.log` | S5 | pending | `cf.sh tail` 出力抜粋。Forms API レスポンス本文を含む場合は redact |
| 5 | `outputs/phase-11/stale-lock-select.txt` | S6 | pending | `sync_jobs` SELECT 出力。`job_id` のみ含み機密無 |
| 6 | `outputs/phase-11/stale-lock-reset.txt` | S7 (該当時のみ) | conditional | UPDATE 結果。0 件時は本ファイル省略 |
| 7 | `outputs/phase-11/snapshot-after.json` | S8 | pending | AC-2/3/4 evidence の正本 |
| 8 | `outputs/phase-11/snapshot-diff.md` | S9 | pending | before/after 差分 + AC マッピング |

## 11.2 redact ルール

- snapshot JSON は schema 上 secrets を bool 化しているため redact 不要
- `cron-tail.log` は次のパターンを `***` に置換してから保存:
  - Bearer token / Authorization header 値
  - service account email の `@` 直前 (`***@<domain>`)
  - private key PEM 行 (-----BEGIN/END PRIVATE KEY----- ブロック全体)
- `cf-secret-list.txt` は `cf.sh` ラッパー仕様で value を出力しないため pass-through

## 11.3 evidence 保存後の処理

- 上記 1〜8 のファイルは `git add` してコミット対象とする (実値非含)
- snapshot JSON はサイズが 50KB を超える場合は `latestSyncRuns` 直近 10 件 + counts + secretsReadiness + hypothesisFlags のみに pretty-truncate
