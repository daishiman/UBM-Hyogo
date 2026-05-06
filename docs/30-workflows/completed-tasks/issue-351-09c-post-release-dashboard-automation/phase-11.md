# Phase 11: dry-run 実行 + dashboard evidence 取得（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | implemented-local / runtime-gated |

`taskType: implementation` / `visualEvidence: NON_VISUAL` のため、screenshot は不要。代わりに **CLI / GitHub Actions log / artifact JSON** を evidence として確定させる。

ローカル fixture evidence は取得済み。real Cloudflare API / GitHub Actions `workflow_dispatch` / schedule evidence はユーザー承認後に取得する runtime gate として分離する。


## 目的

NON_VISUAL evidence として CLI / workflow log / artifact JSON の取得手順と placeholder を実体化する。


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

- `phase-11.md`
- `outputs/phase-11/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## 1. evidence 一覧（実装サイクルで取得）

| evidence file | 内容 | 取得方法 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 の総括（PASS / PASS_WITH_BLOCKER / BLOCKED） | 後続まとめ |
| `outputs/phase-11/structure-verification.md` | ファイル構成が phase-02 §1 と一致することの確認 | `find .github/workflows/post-release-dashboard.yml scripts/post-release-dashboard/ -type f` |
| `outputs/phase-11/grep-verification.md` | AC-2 / AC-4 / AC-7 の grep 結果 | `rg` 各種（phase-09 §1.1 / §1.3） |
| `outputs/phase-11/dataset-discover.md` | Cloudflare GraphQL の dataset 名 discover 結果 | `bash scripts/cf.sh api-post /client/v4/graphql -d '{"query":"{__schema{queryType{fields{name}}}}"}' \| jq` |
| `outputs/phase-11/dry-run-evidence.md` | local dry-run + workflow_dispatch dry-run 双方の出力抜粋 | local `bash scripts/.../collect.sh ...` + `gh workflow run post-release-dashboard.yml -f target_date=YYYY-MM-DD` |
| `outputs/phase-11/redaction-check.md` | redaction grep が exit 0 / 0 件の証跡 | `bash scripts/post-release-dashboard/lib/redaction-check.sh outputs/post-release-dashboard/<date>` |
| `outputs/phase-11/schema-check.md` | dashboard.json の jq 適合性チェック | phase-07 §2 AC-8 の jq 式 |

## 2. dry-run 手順（後続実装サイクル用）

### 2.1 local dry-run

```bash
# 1Password で token 注入。実 token は AI コンテキストに渡らない
op run --env-file=.env -- bash -lc '
  CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY" \
  CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}" \
  GH_TOKEN="$(gh auth token)" \
  bash scripts/post-release-dashboard/collect.sh "$(date -u +%Y-%m-%d)" 24
'

# 1) 構造確認
ls outputs/post-release-dashboard/$(date -u +%Y-%m-%d)/

# 2) schema check（AC-8）
jq -e '
  .schema_version=="1" and
  (.metrics|length)==5 and
  ([.metrics[].metric_id]==["workers_requests","workers_errors","d1_reads","d1_writes","cron_status"]) and
  ([.metrics[].judgment]|all(. as $j | ["PASS","WARN","FAIL","UNKNOWN"]|index($j)))
' outputs/post-release-dashboard/$(date -u +%Y-%m-%d)/dashboard.json

# 3) redaction grep（AC-5）
bash scripts/post-release-dashboard/lib/redaction-check.sh outputs/post-release-dashboard/$(date -u +%Y-%m-%d)

# 4) artifact 抜粋を evidence に保存
cp outputs/post-release-dashboard/$(date -u +%Y-%m-%d)/dashboard.{json,md} \
   docs/30-workflows/issue-351-09c-post-release-dashboard-automation/outputs/phase-11/sample/
```

### 2.2 workflow_dispatch dry-run

```bash
# main へ implementation PR を merge した後（あるいは PR 上で workflow_dispatch を使い）
gh workflow run post-release-dashboard.yml -f target_date=YYYY-MM-DD -f lookback_hours=24

# 直近の run id を取得
RUN_ID=$(gh run list --workflow=post-release-dashboard.yml --limit=1 --json databaseId --jq '.[0].databaseId')

# log と artifact を取得
gh run view "$RUN_ID" --log > docs/30-workflows/issue-351-09c-post-release-dashboard-automation/outputs/phase-11/workflow-log.txt
gh run download "$RUN_ID" --dir docs/30-workflows/issue-351-09c-post-release-dashboard-automation/outputs/phase-11/artifact/
```

## 3. evidence template（仕様書サイクルで placeholder のみ書き起こす）

仕様書サイクルでは下記 placeholder を `outputs/phase-11/main.md` 等に置く（実 evidence は実装サイクルで上書き）:

```
# Phase 11 — main (PLACEHOLDER)

state: PENDING_IMPLEMENTATION_FOLLOW_UP
runtime evidence: not yet collected
expected evidence (取得後に上書き):
  - structure-verification.md: <find 結果>
  - grep-verification.md     : <rg 結果>
  - dataset-discover.md      : <Cloudflare schema 抜粋>
  - dry-run-evidence.md      : <local + workflow_dispatch 出力抜粋>
  - redaction-check.md       : EXIT_CODE=0 + grep 0 件
  - schema-check.md          : jq -e 結果

判定基準:
  - 全 evidence が揃い、AC-1 〜 AC-8 の検証コマンドが PASS の場合のみ workflow_state を `completed` に昇格可
  - schedule 起動の実 run conclusion 取得は最初の cron 起動以降。仕様書サイクルでは PASS_WITH_BLOCKER で記録
```

## 4. 仕様書サイクル時点での Phase 11 ステータス

`implemented-local-runtime-gated`（artifacts.json と一致）。ローカル fixture test は PASS、real workflow evidence はユーザー承認待ち。

## 5. 完了条件（仕様書サイクル）

- [x] evidence 一覧と取得手順が確定
- [x] schema-check / redaction-check の jq / grep 式が確定
- [x] placeholder が phase-11 outputs 配下に作成可能な形で記述

## 6. 完了条件（実装サイクル / 後続）

- [ ] `outputs/phase-11/main.md` に PASS / PASS_WITH_BLOCKER の判定が記録
- [ ] AC-1 〜 AC-8 の検証コマンドが evidence と紐付く
- [ ] dataset discover 結果が evidence にある
- [ ] redaction grep 0 件
- [ ] schema-check jq exit 0
- [ ] workflow_dispatch run の log + artifact が `outputs/phase-11/artifact/` にダウンロード済み

## outputs（仕様書サイクルでは template のみ）

- `outputs/phase-11/main.md`
- `outputs/phase-11/structure-verification.md`
- `outputs/phase-11/grep-verification.md`
- `outputs/phase-11/dataset-discover.md`
- `outputs/phase-11/dry-run-evidence.md`
- `outputs/phase-11/redaction-check.md`
- `outputs/phase-11/schema-check.md`
