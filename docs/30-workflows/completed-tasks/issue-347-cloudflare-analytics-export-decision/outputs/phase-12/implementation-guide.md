# Implementation Guide

state: completed

## Part 1: 中学生レベル

このタスクは、Cloudflare で動いているサイトの利用状況を、あとから見返せる数値ファイルとして保存する方法を決めるものです。

スクリーンショットだけだと、1 か月後に「リクエスト数が増えたか」「エラーが増えたか」を正確に比べにくくなります。そのため、毎月 1 回、必要な数値だけを JSON として保存します。

保存してよいのは合計値だけです。メールアドレス、URL の `?token=...` のような文字、本文、IP アドレスなど、個人につながる情報は保存しません。

## Part 2: 技術者レベル

Canonical export は Cloudflare GraphQL Analytics API の aggregate-only query とする。保存先は 09c post-release verification の `outputs/phase-11/long-term-evidence/` で、active retention は直近 12 件、13 件目以降は `archive/YYYY-MM/` へ移動する。

保存対象は 4 metric groups / 5 scalar values:

- HTTP request volume: `requests`
- HTTP error rate: `totalRequests`, `errors5xx`
- D1 reads/writes: `readQueries`, `writeQueries`
- Worker cron/event volume: `invocations`

Runtime sample は Cloudflare dashboard session または API token が必要なため、user approval 後に取得する。今回の docs-only cycle では schema sample と redaction-check を配置し、runtime 取得時に同じ field set / grep command で置換する。

後続の GitHub Actions cron + fetch script は `docs/30-workflows/unassigned-task/task-issue-347-cloudflare-analytics-export-automation-001.md` で formalize した。これは decision 完了後に発生する独立 implementation / ops task であり、本 decision workflow の未完了理由ではない。
