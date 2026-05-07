# Phase 12 Implementation Guide

state: implemented-local
workflow_id: issue-351-09c-post-release-dashboard-automation
visualEvidence: NON_VISUAL

## Part 1: 中学生レベル

リリースした後、Cloudflare のサーバーがどれくらい動いたか、エラーが何件出たか、データベースが何回読まれたかを、毎日 GitHub Actions が自動で集めて表にする。

前は人が Cloudflare の画面を開いて数字を書き写す必要があった。今回の実装では、読むだけの Cloudflare API token を使い、GitHub Actions が `outputs/post-release-dashboard/<日付>/dashboard.json` と `dashboard.md` を作る。秘密の token が表に混ざっていないかも `redaction-check.sh` で確認する。

画面は変更していないため、スクリーンショットは不要。代わりに CLI テスト、JSON schema check、redaction check、GitHub Actions artifact を証跡にする。

## Part 2: 技術者レベル

### 実装ファイル

| path | 内容 |
| --- | --- |
| `.github/workflows/post-release-dashboard.yml` | `schedule: '0 0 * * *'` UTC + `workflow_dispatch`。read-only secret `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` を `CLOUDFLARE_API_TOKEN` env に渡して collector を起動 |
| `scripts/post-release-dashboard/collect.sh` | `<UTC-yyyy-mm-dd> [lookback_hours]` を受け取り `dashboard.json` / `dashboard.md` を生成 |
| `scripts/post-release-dashboard/lib/cf-graphql.sh` | Workers requests / errors の Cloudflare GraphQL 呼び出し |
| `scripts/post-release-dashboard/lib/d1-metrics.sh` | D1 reads / writes の Cloudflare GraphQL 呼び出し |
| `scripts/post-release-dashboard/lib/cron-status.sh` | 最新 schedule run conclusion を `gh run list` から取得。未取得時は `null` |
| `scripts/post-release-dashboard/lib/format-dashboard.sh` | metric JSON を統一 schema と Markdown 表へ整形 |
| `scripts/post-release-dashboard/lib/redaction-check.sh` | artifact 内の `token` / `bearer` / `Authorization` 等を grep し、検出時 fail |
| `scripts/post-release-dashboard/__tests__/` | fixture ベースの schema / judgment / redaction テスト |
| `package.json` | `post-release-dashboard:test` を追加 |
| `.gitignore` | `outputs/post-release-dashboard/**` を commit 対象外に追加 |

### 入出力

```bash
bash scripts/post-release-dashboard/collect.sh 2026-05-05 24
```

入力 env:

| env | 用途 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions では `secrets.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` を注入 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare GraphQL account filter |
| `GH_TOKEN` | `cron-status.sh` が `gh run list` を読むために使用 |
| `POST_RELEASE_DASHBOARD_FIXTURE_DIR` | ローカルテスト用 fixture ディレクトリ |

出力:

```text
outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.json
outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.md
```

### dashboard schema

`dashboard.json` は `schema_version: "1"`、`target_date_utc`、`lookback_hours`、`metrics[]` を持つ。metric id は次の順序で固定する。

```text
workers_requests
workers_errors
d1_reads
d1_writes
cron_status
```

各 metric は `metric_id` / `label` / `value` / `unit` / `threshold` / `judgment` / `source_endpoint` / `source_query_hash` を持つ。`judgment` は `PASS` / `WARN` / `FAIL` / `UNKNOWN` のいずれか。

### エラー境界

| ケース | 挙動 |
| --- | --- |
| 日付形式が `yyyy-mm-dd` でない | `collect.sh` exit 64 |
| `lookback_hours` が整数でない | `collect.sh` exit 64 |
| analytics token 不在 | workflow の `Verify analytics token presence` で fail |
| Cloudflare GraphQL 取得失敗 | `curl -fsS` により collector fail |
| `gh` / `GH_TOKEN` 不在 | `cron_status` は `null` として `UNKNOWN` |
| artifact に secret marker が混入 | `redaction-check.sh` exit 1 |

### 検証

```bash
pnpm post-release-dashboard:test
```

追加 runtime evidence は、ユーザー承認後に `workflow_dispatch` または最初の schedule 実行で取得し、`outputs/phase-11/` に log / artifact / schema / redaction 結果を追記する。
