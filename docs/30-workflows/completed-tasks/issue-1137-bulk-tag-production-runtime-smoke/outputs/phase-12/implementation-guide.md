# 実装ガイド — issue-1137-bulk-tag-production-runtime-smoke

## Part 1: 概念説明（初学者・中学生レベル）

### なぜ必要か

学校の文化祭で、来場者に配る「名札シール」を全員にまとめて貼る係を想像してください。練習用の会場（staging）では、シールを貼ったり剥がしたりする練習を、毎回ちゃんとできるか自動でチェックする仕組みがすでにあります。でも本番の会場（production）ではまだそのチェックがありません。本番でシールを貼る機械（bulk tag endpoint）が壊れていないか、本番でも一度きちんと確かめたい、というのがこのタスクです。

### 何をするか

本番でシールを貼る確認は、練習よりずっと慎重にやる必要があります。なぜなら本番のデータは「本物の会員さんの名簿」だからです。間違えると本物の名簿が汚れてしまいます。そこで次の安全ルールを作ります。

- **本物の名簿には触らない**: 確認専用の「ダミーの会員」（名前の先頭が `e2e_test_prod_tagbulk_` で始まる）だけを使い、終わったら必ず全部消します。1つでも消し残しがあったら「失敗」とみなします。
- **二重のカギ**: 本番の確認は、2つの承認（GitHub の承認ボタン + 合言葉の入力）が両方そろわないと動きません。練習会場の安全ルール（`assert_staging_guard`）はそのまま壊さず、本番用の新しいカギ（`assert_production_guard`）を別に作ります。
- **記録を残す（でも秘密は隠す）**: 何をしたかのログは残しますが、パスワードのような秘密の文字は黒塗り（redact）します。

### この作業で「やらないこと」

- 実際に本番でシールを貼る確認（実走）は、人が「やっていい」と2回許可してから。今回は runner / SQL / CI job / local test までを作り、本番 D1 への実走だけを承認後に分けます。
- シールを貼る機械そのもの（endpoint）は直しません。すでに正しく動いているからです。

## Part 2: 技術的詳細（開発者・技術者レベル）

### 背景

`POST /admin/members/tags/bulk`（`apps/api/src/routes/admin/members.ts`・issue-1036 で landed）は次の contract を返す:

```
body: { memberIds: string[], tagIds: string[], op: "assign" | "unassign" }
200:  { batchId: string, results: Array<{ memberId: string, tagId: string, status: BulkTagStatus }> }
type BulkTagStatus = "assigned" | "noop" | "unassigned" | "skipped_deleted" | "tag_not_found"
audit: status==="assigned"   → admin.member.tag_assigned   (after_json.batchId)
       status==="unassigned" → admin.member.tag_unassigned (before_json.batchId)
       status ∈ {noop, skipped_deleted, tag_not_found} → audit append なし
```

staging runtime smoke（`scripts/smoke/runtime-tag-bulk.sh`・issue-1081）はこれを `--env staging` 固定で検証する。本タスクは production 経路を同一 runner に追加する。

### 要約

| 観点 | 内容 |
| ---- | ---- |
| 方針 | 単一 runner を `staging\|production` env 分岐で拡張（先行事例 #922 `runtime-admin-web.sh` 踏襲） |
| 安全 | `assert_staging_guard` 逐語不変 + 別関数 `assert_production_guard`（dual marker + production allowlist + D1 名） |
| fixture | production prefix `e2e_test_prod_tagbulk_`（staging `e2e_test_issue1081_` と分離） |
| CI | `production-runtime-smoke.yml` に `workflow_dispatch` 限定かつ input 明示 opt-in の job を追加 |

### 関数シグネチャ / 構造（bash）

```bash
# parse_args: env 受理を staging|production に拡張
case "$ENVIRONMENT" in
  staging|production) ;;
  *) echo "Only staging or production bulk tag runtime smoke is allowed" >&2; exit 2 ;;
esac
configure_environment

# configure_environment: env 名から API base / bearer env を選び、production では専用値へ切替
#   PREFIX=e2e_test_prod_tagbulk_  CF_D1_DATABASE=ubm-hyogo-db-prod
#   SEED_SQL=bulk-tag-production-seed.sql  CLEANUP_SQL=bulk-tag-production-cleanup.sql
#   MEMBER_IDS/TAG_IDS=e2e_test_prod_tagbulk_*  api_base=PRODUCTION_API_BASE  bearer=PRODUCTION_ADMIN_BEARER

# assert_production_guard: 新設（別関数・staging guard は不変）
assert_production_guard() {
  local allow_regex="${PRODUCTION_API_HOST_ALLOW_REGEX:-^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev|api\.ubm-hyogo\.workers\.dev)$}"
  local host_port="${BASE#*://}"
  host_port="${host_port%%/*}"
  local host="${host_port%%:*}"
  [[ "$CF_D1_DATABASE" == "ubm-hyogo-db-prod" ]] || { echo "CF_D1_DATABASE must be ubm-hyogo-db-prod" >&2; exit 2; }
  [[ "${BULK_TAG_PRODUCTION_SMOKE_APPROVAL:-}" == "issue-1137-production-bulk-tag-smoke" ]] || { echo "BULK_TAG_PRODUCTION_SMOKE_APPROVAL missing/invalid" >&2; exit 2; }
  [[ "${BULK_TAG_PRODUCTION_SMOKE_CONFIRM:-}" == "I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1" ]] || { echo "BULK_TAG_PRODUCTION_SMOKE_CONFIRM (confirmation marker) required" >&2; exit 2; }
  printf '%s\n' "$host" | grep -Eiq "$allow_regex" || { echo "PRODUCTION_API_BASE must match production allowlist" >&2; exit 2; }
}

# run_d1: env 一般化（staging では ENVIRONMENT=staging で挙動不変）
run_d1() { bash "$CF_SH" d1 execute "$CF_D1_DATABASE" --env "$ENVIRONMENT" --remote "$@"; }
```

`post_bulk` / `assert_status_file` / `audit_count` / `count_by_table` / `cleanup` / `write_summary` は env 非依存のため変更なし（`PREFIX`/`CF_D1_DATABASE`/`ENVIRONMENT` が production 値に切り替わる）。

### SQL テーブル名（production seed/cleanup）

- seed/cleanup の touch table: `member_responses` / `member_identities` / `member_status` / `tag_definitions` / `member_tags` / `audit_log`。
- 全 INSERT/DELETE が `e2e_test_prod_tagbulk_` prefix。`member_status.publish_state = 'member_only'`（公開面非露出）。

### CI job YAML（骨格）

```yaml
on:
  workflow_dispatch:
    inputs:
      run_bulk_tag_mutation:
        default: "false"
      bulk_tag_confirmation:
        default: ""
jobs:
  bulk-tag-production-runtime-smoke:
    if: ${{ inputs.run_bulk_tag_mutation == 'true' && inputs.bulk_tag_confirmation == 'I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1' }}
    environment: production-runtime-smoke      # 第1承認
    env:
      PRODUCTION_API_BASE: ${{ secrets.PRODUCTION_API_BASE }}
      PRODUCTION_ADMIN_BEARER: ${{ secrets.PRODUCTION_ADMIN_BEARER }}
      BULK_TAG_PRODUCTION_SMOKE_APPROVAL: issue-1137-production-bulk-tag-smoke
      BULK_TAG_PRODUCTION_SMOKE_CONFIRM: I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1
      CF_D1_DATABASE: ubm-hyogo-db-prod
      CLOUDFLARE_ENV: production
    steps:
      - run: bash scripts/smoke/runtime-tag-bulk.sh production --out-dir ci-evidence-bulk-tag-prod --ci-summary
      # + verify secrets / mask / redaction grep gate / upload artifact / Slack on failure
```

### contract 検証（jq）

```bash
# results[].status 全件が期待値か（assigned / noop / unassigned）
jq -e --arg expected "assigned" --argjson n 4 '
  (.batchId|type=="string" and length>0)
  and (.results|type=="array" and length==$n)
  and ([.results[]|select(.status==$expected)]|length==$n)' "$body_file"
```

### 定数

| 定数 | 値 |
| ---- | -- |
| production prefix | `e2e_test_prod_tagbulk_` |
| production D1 | `ubm-hyogo-db-prod` |
| production API worker | `ubm-hyogo-api` |
| production API URL | `https://api.ubm-hyogo.workers.dev` |
| workflow opt-in input | `run_bulk_tag_mutation=true` |
| confirmation phrase / runner marker | `I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1` |
| EXPECTED_ITEMS | 4（memberIds 2 × tagIds 2） |

### エラー処理 / エッジケース

- guard 不成立（allowlist 不一致 / marker 欠落 / D1 名不一致）→ `exit 2`（fail-closed）。
- non-200 / status mismatch / audit count drift / cleanup 残件あり → `fail_and_exit`（exit 1）+ summary FAIL。
- `trap EXIT` で cleanup を必ず実行（途中 fail でも synthetic data を残さない）。
- secret は `redact.sh` でマスク + CI redaction grep gate。

### 検証コマンド（本サイクルで実行済み）

```bash
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh
mise exec -- pnpm typecheck
mise exec -- pnpm lint
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/production-runtime-smoke.yml
# production 実走（user 二重承認後）:
bash scripts/smoke/runtime-tag-bulk.sh production --out-dir docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/outputs/phase-11/evidence --ci-summary
```

### 既知制限

- 本サイクルは `implemented_local_runtime_pending`。コード実装は完了済みで、production real D1 runtime evidence は user 二重承認後に取得する。
- production 実走は user 二重承認 + production secrets 登録（`PRODUCTION_API_BASE` / `PRODUCTION_ADMIN_BEARER`）が前提。
- smoke runner 共通 lib 抽出（followup-007）には依存しない。共通化は将来の別タスク。

## 視覚証跡

NON_VISUAL（CI / runtime smoke gate 拡張）のため Phase 11 スクリーンショット不要。代替証跡として `outputs/phase-11/evidence/runtime-tag-bulk-test.log` と `outputs/phase-11/evidence/runtime-tag-bulk-actionlint.log` を取得済み。production runtime evidence（`runtime-tag-bulk-prod-*.log` / `summary.json`）は Gate-B（user 二重承認）後に取得する。
