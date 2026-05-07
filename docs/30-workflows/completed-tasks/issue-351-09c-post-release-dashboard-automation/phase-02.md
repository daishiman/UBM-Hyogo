# Phase 2: 設計（workflow / collector / artifact schema / token scope）

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 02 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | completed |

Phase 01 で確定した FR / NFR / AC を実装可能な粒度に落とし込む。本 Phase の出力は Phase 04（テスト戦略）以降の入力。


## 目的

GitHub Actions workflow、collector、artifact schema、read-only token scope の設計を固定する。


## 実行タスク

- 既存本文の該当 Phase 内容を確認する。
- artifacts.json の phase status と outputs 宣言に矛盾がないことを確認する。
- 後続実装が必要な項目は user gate と evidence path を明示する。


## 参照資料

- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/index.md`
- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`


## 成果物

- `phase-02.md`
- `outputs/phase-02/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## 1. ディレクトリ / ファイル構成（変更対象一覧）

| 種別 | path | 変更種別 | 役割 |
| --- | --- | --- | --- |
| workflow | `.github/workflows/post-release-dashboard.yml` | 新規 | schedule / workflow_dispatch / collector 起動 / artifact upload |
| script | `scripts/post-release-dashboard/collect.sh` | 新規 | エントリポイント。lib/* を順次呼び `dashboard.json` / `dashboard.md` を生成 |
| script | `scripts/post-release-dashboard/lib/cf-graphql.sh` | 新規 | Cloudflare GraphQL Analytics API 呼び出し（Workers req / errors） |
| script | `scripts/post-release-dashboard/lib/d1-metrics.sh` | 新規 | D1 reads / writes 取得（GraphQL `d1AnalyticsAdaptiveGroups`） |
| script | `scripts/post-release-dashboard/lib/cron-status.sh` | 新規 | GitHub Actions schedule run の最新ステータス取得（`gh run list --json`） |
| script | `scripts/post-release-dashboard/lib/format-dashboard.sh` | 新規 | metrics 配列を `dashboard.json` と `dashboard.md` に整形 |
| script | `scripts/post-release-dashboard/lib/redaction-check.sh` | 新規 | `dashboard.{json,md}` に token / Bearer / Authorization が含まれないことを grep で検証 |
| 仕様参照 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 編集（追記） | post-release dashboard 章追記 |
| 仕様参照 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | 編集（追記） | analytics token 分離 / dashboard artifact 章追記 |
| skill changelog | `.claude/skills/aiworkflow-requirements/changelog/20260505-issue351-post-release-dashboard.md` | 新規 | 反映行追加（Phase 12 必須エントリ。root `LOGS.md` は現構造に存在しない） |
| skill log | `.claude/skills/aiworkflow-requirements/SKILL.md` | 編集（必要時のみ） | top-level 変更がある場合のみ |

> 仕様書サイクル内では上記ファイルを **作成しない**。Phase 5 implementation runbook に従い、後続実装サイクルで作成する。

## 2. GitHub Actions workflow 設計（`.github/workflows/post-release-dashboard.yml`）

### 2.1 トップレベル

```yaml
name: post-release-dashboard

on:
  schedule:
    - cron: '0 0 * * *'   # 毎日 UTC 00:00（NFR-3）
  workflow_dispatch:
    inputs:
      target_date:
        description: 'UTC date (yyyy-mm-dd) to collect. Default = today UTC'
        required: false
        type: string
        default: ''
      lookback_hours:
        description: 'Hours of analytics window'
        required: false
        type: string
        default: '24'

permissions:
  contents: read     # checkout のみ。write 不要
  actions: read      # cron-status.sh が gh run list 用に参照

concurrency:
  group: post-release-dashboard-${{ github.ref }}
  cancel-in-progress: false   # schedule 連続走行を打ち切らない
```

### 2.2 job 構成（単一 job）

```yaml
jobs:
  collect:
    name: collect-post-release-dashboard
    runs-on: ubuntu-latest
    timeout-minutes: 5     # NFR-4 free-tier 配慮
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY }}   # AC-2
      CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
      TARGET_DATE: ${{ inputs.target_date }}
      LOOKBACK_HOURS: ${{ inputs.lookback_hours || '24' }}
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}     # cron-status.sh が gh run list 用
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.2 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: pnpm }
      - name: Verify token presence
        run: |
          if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then echo "missing analytics token"; exit 1; fi
      - name: Resolve UTC date
        id: date
        run: |
          if [ -z "$TARGET_DATE" ]; then
            TARGET_DATE="$(date -u +%Y-%m-%d)"
          fi
          echo "target_date=$TARGET_DATE" >> "$GITHUB_OUTPUT"
      - name: Collect dashboard
        run: bash scripts/post-release-dashboard/collect.sh "${{ steps.date.outputs.target_date }}" "${LOOKBACK_HOURS}"
      - name: Redaction grep gate
        run: bash scripts/post-release-dashboard/lib/redaction-check.sh "outputs/post-release-dashboard/${{ steps.date.outputs.target_date }}"
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: post-release-dashboard-${{ steps.date.outputs.target_date }}
          path: outputs/post-release-dashboard/${{ steps.date.outputs.target_date }}/
          retention-days: 90
          if-no-files-found: error
```

### 2.3 設計ポイント

- step 名は `Verify token presence` / `Resolve UTC date` / `Collect dashboard` / `Redaction grep gate` / `Upload artifact` の 5 段で固定。Phase 06 失敗モードはこの境界で評価する。
- workflow runtime 自体に `wrangler` 直接実行を含めない（NFR-6）。`cf.sh` を必要とするのは collector が curl 直 API を打つ補助の場合のみで、analytics は GraphQL `https://api.cloudflare.com/client/v4/graphql` を curl で直接叩く（`bash scripts/cf.sh api-post` を利用可能）。

## 3. collector 設計（`scripts/post-release-dashboard/collect.sh`）

### 3.1 関数シグネチャ

```bash
#!/usr/bin/env bash
# scripts/post-release-dashboard/collect.sh
# Usage: collect.sh <UTC-yyyy-mm-dd> <lookback_hours>
# Inputs (env): CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, GH_TOKEN
# Outputs:      outputs/post-release-dashboard/<date>/{dashboard.json,dashboard.md}

set -euo pipefail
TARGET_DATE="${1:?yyyy-mm-dd required}"
LOOKBACK_HOURS="${2:-24}"
OUT_DIR="outputs/post-release-dashboard/${TARGET_DATE}"
mkdir -p "$OUT_DIR"

source "$(dirname "$0")/lib/cf-graphql.sh"
source "$(dirname "$0")/lib/d1-metrics.sh"
source "$(dirname "$0")/lib/cron-status.sh"
source "$(dirname "$0")/lib/format-dashboard.sh"

WORKERS_REQ_JSON="$(cf_graphql_workers_requests "$TARGET_DATE" "$LOOKBACK_HOURS")"
WORKERS_ERR_JSON="$(cf_graphql_workers_errors "$TARGET_DATE" "$LOOKBACK_HOURS")"
D1_READS_JSON="$(d1_metrics_reads "$TARGET_DATE" "$LOOKBACK_HOURS")"
D1_WRITES_JSON="$(d1_metrics_writes "$TARGET_DATE" "$LOOKBACK_HOURS")"
CRON_STATUS_JSON="$(cron_status_latest)"

format_dashboard \
  "$TARGET_DATE" "$LOOKBACK_HOURS" \
  "$WORKERS_REQ_JSON" "$WORKERS_ERR_JSON" \
  "$D1_READS_JSON" "$D1_WRITES_JSON" \
  "$CRON_STATUS_JSON" \
  > "$OUT_DIR/dashboard.json"

format_dashboard_markdown < "$OUT_DIR/dashboard.json" > "$OUT_DIR/dashboard.md"
```

### 3.2 各 lib 関数の入出力契約

| 関数 | 入力 | 出力 (stdout) | 副作用 |
| --- | --- | --- | --- |
| `cf_graphql_workers_requests <date> <lookback>` | UTC date / hours | `{"value": <int>, "unit":"req/24h", "source_endpoint":"graphql:httpRequestsAdaptiveGroups"}` | curl 1 回 |
| `cf_graphql_workers_errors <date> <lookback>` | 同上 | `{"value": <int>, "unit":"err/24h", "source_endpoint":"graphql:httpRequestsAdaptiveGroups"}` | curl 1 回 |
| `d1_metrics_reads <date> <lookback>` | 同上 | `{"value": <int>, "unit":"reads/24h", "source_endpoint":"graphql:d1AnalyticsAdaptiveGroups"}` | curl 1 回 |
| `d1_metrics_writes <date> <lookback>` | 同上 | `{"value": <int>, "unit":"writes/24h", "source_endpoint":"graphql:d1AnalyticsAdaptiveGroups"}` | curl 1 回 |
| `cron_status_latest` | なし | `{"latest_run_id":<int>,"conclusion":"success\|failure\|skipped\|null","run_started_at":"..."}` | `gh run list --workflow=post-release-dashboard.yml --limit=10 --json` から `event=="schedule"` かつ `status=="completed"` かつ `databaseId != GITHUB_RUN_ID` を選ぶ |
| `format_dashboard ...` | 上記 5 つの JSON | `dashboard.json`（schema は §4） | なし |
| `format_dashboard_markdown` | stdin = dashboard.json | `dashboard.md`（人間可読 表） | なし |
| `redaction_check <dir>` | `outputs/post-release-dashboard/<date>` dir | exit 0 / 1 | grep し検出時 fail |

> いずれの関数も **secret を log / stdout に echo しない**。curl の `-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"` は process arg としてのみ渡し、`-v` を付けない（NFR-7）。

### 3.3 GraphQL クエリテンプレ（cf-graphql.sh の例）

```graphql
query WorkersReq($accountTag: String!, $since: Time!, $until: Time!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      httpRequestsAdaptiveGroups(
        limit: 10000
        filter: { datetime_geq: $since, datetime_lt: $until }
      ) {
        sum { requests }
      }
    }
  }
}
```

D1 用は `d1AnalyticsAdaptiveGroups` を `sum { readQueries writeQueries }` で取得（dataset 名は Cloudflare API バージョンで揺れる可能性があるため、Phase 11 dry-run 前に `bash scripts/cf.sh api-post /client/v4/graphql -d '{"query":"{ __schema { types { name } } }"}'` で discover する手順を Phase 11 evidence に記録する）。

## 4. artifact JSON schema（`dashboard.json`）

```json
{
  "$schema": "https://example.invalid/post-release-dashboard.schema.json",
  "schema_version": "1",
  "collected_at_utc": "2026-05-05T00:01:23Z",
  "target_date_utc": "2026-05-05",
  "lookback_hours": 24,
  "release": {
    "tag": null,
    "commit": null,
    "deployed_at_utc": null
  },
  "metrics": [
    {
      "metric_id": "workers_requests",
      "label": "Workers requests",
      "value": 1234,
      "unit": "req/24h",
      "threshold": { "operator": "<", "value": 5000 },
      "judgment": "PASS",
      "source_endpoint": "graphql:httpRequestsAdaptiveGroups",
      "source_query_hash": "sha256:..."
    },
    {
      "metric_id": "workers_errors",
      "label": "Workers errors",
      "value": 0,
      "unit": "err/24h",
      "threshold": { "operator": "<=", "value": 50 },
      "judgment": "PASS",
      "source_endpoint": "graphql:httpRequestsAdaptiveGroups",
      "source_query_hash": "sha256:..."
    },
    {
      "metric_id": "d1_reads",
      "label": "D1 reads",
      "value": 0,
      "unit": "reads/24h",
      "threshold": { "operator": "<=", "value": 50000 },
      "judgment": "PASS",
      "source_endpoint": "graphql:d1AnalyticsAdaptiveGroups",
      "source_query_hash": "sha256:..."
    },
    {
      "metric_id": "d1_writes",
      "label": "D1 writes",
      "value": 0,
      "unit": "writes/24h",
      "threshold": { "operator": "<=", "value": 10000 },
      "judgment": "PASS",
      "source_endpoint": "graphql:d1AnalyticsAdaptiveGroups",
      "source_query_hash": "sha256:..."
    },
    {
      "metric_id": "cron_status",
      "label": "Latest schedule run",
      "value": "success",
      "unit": "enum",
      "threshold": { "operator": "in", "value": ["success", "skipped"] },
      "judgment": "PASS",
      "source_endpoint": "github:actions/runs",
      "source_query_hash": null
    }
  ],
  "notes": []
}
```

### 4.1 judgment 判定ルール

| operator | rule |
| --- | --- |
| `<` | `value < threshold.value` → PASS、 `value >= threshold.value` → FAIL |
| `<=` | `value <= threshold.value` → PASS、 `value > threshold.value` → FAIL |
| `in` | `value` が `threshold.value`（配列）に含まれれば PASS、それ以外 FAIL |
| value が `null` または取得失敗 | UNKNOWN |
| value が threshold の 80% を超える数値 metric | WARN（PASS の派生。FAIL ではない） |

### 4.2 metric naming 一致表（AC-4）

| 09c `post-release-summary.md` 表記 | `metric_id` | `label` |
| --- | --- | --- |
| Workers requests | `workers_requests` | Workers requests |
| D1 reads | `d1_reads` | D1 reads |
| D1 writes | `d1_writes` | D1 writes |
| （新規） | `workers_errors` | Workers errors |
| （新規） | `cron_status` | Latest schedule run |

> `Workers errors` / `cron_status` は 09c には未掲載だが、運用上必須として本仕様書で初めて導入する。導入根拠は phase-12 で `aiworkflow-requirements` に追記する。

## 5. dashboard.md 表形式

```
# Post-release dashboard — 2026-05-05 (UTC)

| Metric | Value | Unit | Threshold | Judgment |
|---|---|---|---|---|
| Workers requests | 1234 | req/24h | < 5000 | PASS |
| Workers errors | 0 | err/24h | <= 50 | PASS |
| D1 reads | 0 | reads/24h | <= 50000 | PASS |
| D1 writes | 0 | writes/24h | <= 10000 | PASS |
| Latest schedule run | success | enum | in [success, skipped] | PASS |

Collected at: 2026-05-05T00:01:23Z  (lookback 24h)
```

## 6. token scope 設計（NFR-1 / NFR-2 / AC-2）

### 6.1 GitHub 側の secret / variable

| 名前 | 種別 | scope | 用途 | 配置 |
| --- | --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` | Repository secret | Account.Account Analytics:Read + Workers Scripts:Read + D1:Read | post-release-dashboard.yml のみ | repository secret（Environments 不使用） |
| `CLOUDFLARE_ACCOUNT_ID` | Repository variable（既存） | n/a | account id 共通 | 既存 `vars.CLOUDFLARE_ACCOUNT_ID` を再利用 |

### 6.2 1Password 側の管理

| 1Password Item | Field | 値 |
| --- | --- | --- |
| `Cloudflare/Analytics Read-Only Token` | `value` | 実 token |
| `Cloudflare/Analytics Read-Only Token` | `scope` | 上記 read-only 3 種 |
| `Cloudflare/Analytics Read-Only Token` | `created_at` | 払い出し日 |

`.env` での参照は本 workflow が GitHub Actions 上のみで動くため不要（ローカル dry-run 時のみ `op://Vault/Cloudflare-Analytics-Read-Only-Token/value` を `.env` 参照に追加可能。CLAUDE.md 「平文 .env 禁止」規約遵守）。

### 6.3 既存 token との分離

- `secrets.CLOUDFLARE_API_TOKEN`（既存; web-cd / backend-ci で利用; write scope を含む）は本 workflow から**参照しない**（AC-2）。
- token rotate 手順は phase-05 implementation runbook §6 に記述する。

## 7. 完了条件

- [x] 変更対象ファイル一覧と変更種別が確定
- [x] workflow yaml の skeleton が確定
- [x] collector lib 関数の入出力契約が確定
- [x] artifact JSON / Markdown の schema が確定
- [x] metric naming 一致表が確定（AC-4）
- [x] token scope 設計が確定（AC-2 / NFR-1 / NFR-2）

## outputs

- `outputs/phase-02/workflow-design.md`
- `outputs/phase-02/collector-design.md`
- `outputs/phase-02/artifact-schema.md`
- `outputs/phase-02/token-scope-design.md`
