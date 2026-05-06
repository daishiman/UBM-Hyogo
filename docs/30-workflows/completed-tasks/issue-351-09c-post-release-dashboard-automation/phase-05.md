# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | completed |

後続実装プロンプト（03.実装.md）の 1 サイクル内で完遂できる手順を順序固定で記述する（CONST_007）。


## 目的

後続実装サイクルで 1 回の作業単位として実装できる手順を固定する。


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

- `phase-05.md`
- `outputs/phase-05/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## 0. ブランチ前提

実装ブランチは `feat/issue-351-09c-post-release-dashboard-automation` を使用する（本仕様書の `docs/issue-351-...-task-spec` ブランチとは別）。

## 1. 1Password Item 払い出し（実装の事前準備）

| step | 内容 |
| --- | --- |
| 1-1 | Cloudflare ダッシュボード → My Profile → API Tokens → Create Token |
| 1-2 | scope を以下に限定: `Account.Account Analytics:Read` / `Account.Workers Scripts:Read` / `Account.D1:Read` |
| 1-3 | 払い出した token を 1Password Vault `UBM-Hyogo` の Item `Cloudflare/Analytics Read-Only Token` に保管。fields: `value`, `scope`, `created_at` |
| 1-4 | GitHub repository secret `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` に同 value を登録 |
| 1-5 | 既存 `CLOUDFLARE_API_TOKEN` は **触らない**（write scope のまま据え置き） |

> 1-1〜1-4 は人間 operator が実行する。AI は手順をユーザーに案内するのみ。secret 値は AI のコンテキストに渡らない。

## 2. ファイル新規追加

実装サイクルで以下の順で作成する。

### 2.1 `scripts/post-release-dashboard/lib/cf-graphql.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

_cf_graphql_post() {
  # Usage: _cf_graphql_post <query_json>
  local payload="$1"
  curl --fail --silent --show-error \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "https://api.cloudflare.com/client/v4/graphql"
}

cf_graphql_workers_requests() {
  local target_date="$1" lookback="$2"
  local since until query payload raw value
  until="${target_date}T00:00:00Z"
  since="$(date -u -d "${until} -${lookback} hours" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
            || gdate -u -d "${until} -${lookback} hours" +%Y-%m-%dT%H:%M:%SZ)"
  query='query($a:String!,$s:Time!,$u:Time!){viewer{accounts(filter:{accountTag:$a}){httpRequestsAdaptiveGroups(limit:10000,filter:{datetime_geq:$s,datetime_lt:$u}){sum{requests}}}}}'
  payload=$(jq -nc --arg a "$CLOUDFLARE_ACCOUNT_ID" --arg s "$since" --arg u "$until" --arg q "$query" \
              '{query:$q,variables:{a:$a,s:$s,u:$u}}')
  raw="$(_cf_graphql_post "$payload")"
  value="$(echo "$raw" | jq '[.data.viewer.accounts[0].httpRequestsAdaptiveGroups[].sum.requests] | add // 0')"
  jq -nc --argjson v "$value" '{value:$v,unit:"req/24h",source_endpoint:"graphql:httpRequestsAdaptiveGroups"}'
}

cf_graphql_workers_errors() { :; }   # 同様に実装。errors は status_code >= 500 で filter
```

### 2.2 `scripts/post-release-dashboard/lib/d1-metrics.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

d1_metrics_reads()  { :; }    # d1AnalyticsAdaptiveGroups の sum.readQueries
d1_metrics_writes() { :; }    # 同 sum.writeQueries
```

> dataset 名 `d1AnalyticsAdaptiveGroups` は dry-run 前に discover step で確認する（Phase 11）。

### 2.3 `scripts/post-release-dashboard/lib/cron-status.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

cron_status_latest() {
  local raw conclusion started_at run_id
  raw="$(gh run list --workflow=post-release-dashboard.yml --limit=10 --json databaseId,conclusion,startedAt,event,status \
    | jq -c --arg current "${GITHUB_RUN_ID:-}" '[.[] | select(.event=="schedule" and .status=="completed" and ((.databaseId|tostring) != $current))][0] // null')"
  if [ "$raw" = "null" ]; then
    jq -nc '{latest_run_id:null, conclusion:null, run_started_at:null}'
    return
  fi
  echo "$raw" | jq -c '{latest_run_id:.databaseId, conclusion:.conclusion, run_started_at:.startedAt}'
}
```

### 2.4 `scripts/post-release-dashboard/lib/format-dashboard.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# format_dashboard <date> <lookback_hours> <workers_req_json> <workers_err_json> <d1_reads_json> <d1_writes_json> <cron_status_json>
format_dashboard() {
  local date="$1" lb="$2" wr="$3" we="$4" dr="$5" dw="$6" cs="$7"
  jq -nc \
    --arg date "$date" --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --argjson lb "$lb" \
    --argjson wr "$wr" --argjson we "$we" --argjson dr "$dr" --argjson dw "$dw" --argjson cs "$cs" \
    '{
       schema_version:"1",
       collected_at_utc:$now,
       target_date_utc:$date,
       lookback_hours:$lb,
       release:{tag:null,commit:null,deployed_at_utc:null},
       metrics:[
         {metric_id:"workers_requests",label:"Workers requests",value:$wr.value,unit:$wr.unit,
          threshold:{operator:"<",value:5000},source_endpoint:$wr.source_endpoint,source_query_hash:$wr.source_query_hash} |
           .judgment = (if .value==null then "UNKNOWN" elif .value < .threshold.value then (if .value > (.threshold.value*0.8) then "WARN" else "PASS" end) else "FAIL" end),
         {metric_id:"workers_errors",label:"Workers errors",value:$we.value,unit:$we.unit,
          threshold:{operator:"<=",value:50},source_endpoint:$we.source_endpoint,source_query_hash:$we.source_query_hash} |
           .judgment = (if .value==null then "UNKNOWN" elif .value <= .threshold.value then "PASS" else "FAIL" end),
         {metric_id:"d1_reads",label:"D1 reads",value:$dr.value,unit:$dr.unit,
          threshold:{operator:"<=",value:50000},source_endpoint:$dr.source_endpoint,source_query_hash:$dr.source_query_hash} |
           .judgment = (if .value==null then "UNKNOWN" elif .value <= .threshold.value then "PASS" else "FAIL" end),
         {metric_id:"d1_writes",label:"D1 writes",value:$dw.value,unit:$dw.unit,
          threshold:{operator:"<=",value:10000},source_endpoint:$dw.source_endpoint,source_query_hash:$dw.source_query_hash} |
           .judgment = (if .value==null then "UNKNOWN" elif .value <= .threshold.value then "PASS" else "FAIL" end),
         {metric_id:"cron_status",label:"Latest schedule run",value:$cs.conclusion,unit:"enum",
          threshold:{operator:"in",value:["success","skipped"]},source_endpoint:"github:actions/runs",source_query_hash:null} |
           .judgment = (if .value==null then "UNKNOWN" elif (.threshold.value|index(.value)) then "PASS" else "FAIL" end)
       ],
       notes:[]
     }'
}

format_dashboard_markdown() {
  jq -r '
    "# Post-release dashboard — \(.target_date_utc) (UTC)\n\n" +
    "| Metric | Value | Unit | Threshold | Judgment |\n|---|---|---|---|---|\n" +
    ([.metrics[] | "| \(.label) | \(.value) | \(.unit) | \(.threshold.operator) \(.threshold.value|tostring) | \(.judgment) |"] | join("\n")) +
    "\n\nCollected at: \(.collected_at_utc)  (lookback \(.lookback_hours)h)\n"
  '
}
```

### 2.5 `scripts/post-release-dashboard/lib/redaction-check.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: redaction_check <dir>
redaction_check() {
  local dir="$1"
  local hits report
  report="$dir/redaction-check.md"
  hits="$(rg -n -i --hidden -e 'Bearer ' -e 'Authorization' -e 'CLOUDFLARE_API_TOKEN' -e '[A-Fa-f0-9]{40,}' "$dir" || true)"
  if [ -n "$hits" ]; then
    printf '# Redaction check\n\nEXIT_CODE=1\n\n```text\n%s\n```\n' "$hits" > "$report"
    echo "Redaction check FAILED. Detected secret-like patterns:" >&2
    echo "$hits" >&2
    return 1
  fi
  printf '# Redaction check\n\nEXIT_CODE=0\nfindings=0\n' > "$report"
  return 0
}

# 直接呼び出し時のエントリ
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  redaction_check "${1:?dir required}"
fi
```

### 2.6 `scripts/post-release-dashboard/collect.sh`

phase-02 §3.1 の通り。

### 2.7 `.github/workflows/post-release-dashboard.yml`

phase-02 §2 の skeleton をそのまま実装する。

### 2.8 テストファイル群

phase-04 §2 のとおり `scripts/post-release-dashboard/__tests__/` 配下に追加。

## 3. 編集対象ファイル

| path | 編集内容 |
| --- | --- |
| `package.json` | `scripts.post-release-dashboard:test` を追加（`bash scripts/post-release-dashboard/__tests__/run-all.sh`） |
| `.gitignore` | `outputs/post-release-dashboard/**` を追加し、ローカル dry-run artifact の誤コミットを防止 |
| `lefthook.yml` | 影響なし（既存の test gate は触らない） |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | post-release dashboard 章を追記（phase-12 で diff plan 確定） |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | 「analytics token 分離」「dashboard artifact」段落を追記 |
| `.claude/skills/aiworkflow-requirements/changelog/20260505-issue351-post-release-dashboard.md` | 反映行を追記（Phase 12 必須。現構造では root `LOGS.md` ではなく changelog fragment を正本履歴にする） |

## 4. 削除対象

なし。

## 5. ローカル検証コマンド

```bash
# 1. yaml / actionlint
yamllint .github/workflows/post-release-dashboard.yml
actionlint .github/workflows/post-release-dashboard.yml

# 2. shell unit tests
bash scripts/post-release-dashboard/__tests__/run-all.sh

# 3. typecheck / lint（影響範囲が薄いことを確認）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 4. dry-run（local 環境で 1Password 経由 token 注入）
op run --env-file=.env -- bash -lc '
  CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY" \
  CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}" \
  GH_TOKEN="$(gh auth token)" \
  bash scripts/post-release-dashboard/collect.sh "$(date -u +%Y-%m-%d)" 24
'
ls outputs/post-release-dashboard/$(date -u +%Y-%m-%d)/

# 5. redaction grep
bash scripts/post-release-dashboard/lib/redaction-check.sh outputs/post-release-dashboard/$(date -u +%Y-%m-%d)
```

## 6. token 運用ルール

| ルール | 内容 |
| --- | --- |
| 命名 | read-only token は接尾辞 `_READONLY` を必ず付ける |
| 配置 | repository secret に登録。Environment secret は使わない（複数環境 split 不要のため） |
| 1Password Item field `scope` に scope 列挙を必須化 |
| rotate | 90 日ごと（Phase 12 で skill feedback として記録） |
| 失効時の rollback | secret を削除 → workflow は `Verify token presence` 段で fail し、自動取得は停止する。production deploy は影響を受けない |

## 7. 完了条件（実装側 DoD）

- [ ] `.github/workflows/post-release-dashboard.yml` が新規追加され、`yamllint` / `actionlint` が pass
- [ ] `scripts/post-release-dashboard/{collect.sh,lib/*.sh}` が追加され `set -euo pipefail` を含む
- [ ] `scripts/post-release-dashboard/__tests__/run-all.sh` が pass
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` が pass
- [ ] local dry-run が `dashboard.json` / `dashboard.md` を生成
- [ ] `redaction-check.sh` が dry-run 出力に対して exit 0
- [ ] `secrets.CLOUDFLARE_API_TOKEN` が新 workflow から参照されていない（grep 0 件）
- [ ] aiworkflow-requirements references の差分が phase-12 計画通り

## 8. 完了後の報告事項（実装サイクル → ユーザー）

- 追加ファイル一覧
- `pnpm typecheck` / `pnpm lint` / shell test のログ抜粋
- dry-run の `dashboard.json` 抜粋（先頭 50 行）
- redaction-check 出力（exit 0 の旨）
- 残課題（Phase 11 で取得予定の real schedule 起動証跡）

## outputs

- `outputs/phase-05/implementation-runbook.md`
