# Phase 5: 仕様 runbook 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 仕様 runbook（workflow YAML 雛形 / shell script 雛形 / README 追記 / Secrets 登録手順） |
| 作成日 | 2026-05-07 |
| 前 Phase | 4（検証戦略） |
| 次 Phase | 6（異常系） |
| 状態 | spec_created |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |
| タスク分類 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #517（CLOSED 維持） |

## 目的

Phase 1〜4 で確定した設計と TC を、コピペで実装着手できる粒度の **runbook** に落とし込む。本 Phase の出力は (1) workflow YAML 完全雛形、(2) shell script 完全雛形（関数本体スケルトン）、(3) README 追記内容、(4) Slack channel bootstrap + GitHub Secrets 登録手順、(5) branch 命名 / PR タイトル / PR body / Slack payload テンプレ。Phase 11 手動検証はこの runbook をそのまま実行する。

---

## 0. Slack channel bootstrap（実装前 preflight）

workflow / shell script は Slack channel 作成 API を持たない。Slack App / Bot OAuth 化を避け、Incoming Webhook の手動準備だけを Phase 11 preflight として固定する。

README には次の手順をそのまま記載する:

1. Slack で通知先 channel `w1618436027-ek2505248` を作成または存在確認する
2. Incoming Webhook を作成し、投稿先を `w1618436027-ek2505248` に bind する
3. Webhook URL を 1Password 正本へ保存する（repo には実値を書かない）
4. user approval 後に `op run` 経由で GitHub Secret `SLACK_WEBHOOK_URL` へ派生登録する
5. Phase 11 で `[TEST FROM ISSUE-517 PHASE-11]` prefix の test post を送り、HTTP 200 と Slack 受信時刻を `outputs/phase-11/evidence/slack-test-post.log` に記録する
6. test post は確認後に Slack 側で削除する

この preflight が未完了の場合、実装は `CONTRACT_READY_SECRET_PENDING` とし、Slack test post を PASS 扱いしない。

---

## 1. workflow YAML 完全雛形

ファイル: `.github/workflows/post-release-30day-auto-summary.yml`

```yaml
name: post-release-30day-auto-summary

on:
  schedule:
    - cron: '0 1 * * *'   # UTC 01:00 daily（post-release-dashboard が UTC 00:00 起動の 1h 後）
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Skip PR creation and Slack notification (stdout only)'
        required: false
        type: boolean
        default: false

permissions:
  contents: write          # branch push 用
  pull-requests: write     # gh pr create --draft 用
  actions: read            # gh run list 用

concurrency:
  group: post-release-30day-auto-summary
  cancel-in-progress: false

jobs:
  summarize:
    name: summarize-30day
    runs-on: ubuntu-latest
    timeout-minutes: 10
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      DRY_RUN: ${{ inputs.dry_run || 'false' }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Configure git identity
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

      - name: Validate parent workflow exists
        run: |
          test -f .github/workflows/post-release-dashboard.yml \
            || { echo "error: parent workflow missing"; exit 64; }

      - name: Run 30day summary
        id: summary
        run: |
          set -euo pipefail
          if [ "${DRY_RUN}" = "true" ]; then
            bash scripts/post-release-dashboard/30day-summary.sh --dry-run
          else
            bash scripts/post-release-dashboard/30day-summary.sh
          fi
```

---

## 2. shell script 完全雛形

ファイル: `scripts/post-release-dashboard/30day-summary.sh`

```bash
#!/usr/bin/env bash
# scripts/post-release-dashboard/30day-summary.sh
# 30 日 follow-up auto-summary 基盤エントリポイント
# 使い方:
#   bash scripts/post-release-dashboard/30day-summary.sh [--dry-run]
#
# exit code:
#   0  success（gate skip / 重複 PR skip / 正常 / dry-run）
#   2  parse / aggregate error
#   3  Slack POST failure
#   64 引数不正 / 前提欠落
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
# shellcheck source=lib/aggregate.sh
source "${SCRIPT_DIR}/lib/aggregate.sh"
# shellcheck source=lib/redaction-check.sh
source "${SCRIPT_DIR}/lib/redaction-check.sh"

DRY_RUN="${DRY_RUN:-false}"
WORKFLOW_FILE='.github/workflows/post-release-dashboard.yml'
TITLE_PREFIX='[auto-summary] post-release-dashboard 30d'
TMP_DIR='tmp/30day-summary'

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --dry-run) DRY_RUN='true'; shift ;;
      -h|--help) echo "Usage: $0 [--dry-run]"; exit 0 ;;
      *) echo "error: unknown arg: $1" >&2; exit 64 ;;
    esac
  done
}

# aggregate_runs <runs_json_path>
# stdout: 集計 JSON（conclusion_dist / longest_failure_streak / failure_rate / runs_total / schedule_runs_total / oldest_schedule_created_at）
aggregate_runs() {
  local runs="$1"
  jq -s '
    .[0] as $rs
    | {
        runs_total: ($rs | length),
        schedule_runs_total: ([$rs[] | select(.event=="schedule")] | length),
        oldest_schedule_created_at: ([$rs[] | select(.event=="schedule") | .createdAt] | min // ""),
        conclusion_dist: ([$rs[] | .conclusion] | group_by(.) | map({key: .[0], value: length}) | from_entries),
        failure_rate: (
          ([$rs[] | select(.conclusion=="failure")] | length) as $f
          | if ($rs|length) == 0 then 0 else ($f / ($rs|length)) end
        ),
        longest_failure_streak: (
          [$rs[] | .conclusion]
          | reduce .[] as $c ({cur:0,max:0}; if $c=="failure" then {cur:(.cur+1), max:([.max,(.cur+1)]|max)} else {cur:0,max:.max} end)
          | .max
        )
      }
  ' "$runs" || return 2
}

# is_30day_gate_satisfied <oldest_iso> <today_iso>
# exit 0 = 成立 / exit 1 = 不成立
is_30day_gate_satisfied() {
  local oldest="$1" today="$2"
  [ -n "$oldest" ] || return 1
  # 30 日前の ISO 文字列を生成（GNU date / BSD date 両対応）
  local cutoff
  if date --version >/dev/null 2>&1; then
    cutoff=$(date -u -d "${today} -30 days" +%Y-%m-%dT%H:%M:%SZ)
  else
    cutoff=$(date -u -j -v-30d -f '%Y-%m-%dT%H:%M:%SZ' "$today" +%Y-%m-%dT%H:%M:%SZ)
  fi
  # 文字列比較（ISO 8601 は辞書順 = 時系列順）
  [ "$oldest" \< "$cutoff" ] || [ "$oldest" = "$cutoff" ]
}

# redact_log <file_path>
# stdout: redacted 内容
redact_log() {
  local f="$1"
  # token / bearer / secret / Authorization を含む行を置換
  sed -E \
    -e 's/.*([Tt]oken=[^[:space:]]*).*/(redacted: token)/' \
    -e 's/.*([Bb]earer [^[:space:]]+).*/(redacted: bearer)/' \
    -e 's/.*([Ss]ecret:[[:space:]]*[^[:space:]]+).*/(redacted: secret)/' \
    -e 's/.*([Aa]uthorization:[[:space:]]*[^[:space:]]+).*/(redacted: authorization)/' \
    "$f"
}

# find_existing_pr <YYYYMM>
# stdout: 既存 PR URL or 空文字
find_existing_pr() {
  local ym="$1"
  gh pr list --state open --draft --json url,title --limit 50 \
    --search "${TITLE_PREFIX} ${ym} in:title" \
    --jq '.[0].url // ""'
}

# render_pr_body <summary_json_path> <YYYYMM>
render_pr_body() {
  local s="$1" ym="$2"
  local fr; fr=$(jq -r '.failure_rate' "$s")
  cat <<EOF
# post-release-dashboard 30d auto-summary (${ym})

Refs #517, Refs #497, Refs #351

## 集計結果

- runs_total: $(jq -r '.runs_total' "$s")
- schedule_runs_total: $(jq -r '.schedule_runs_total' "$s")
- oldest_schedule_created_at: $(jq -r '.oldest_schedule_created_at' "$s")
- conclusion 分布: $(jq -c '.conclusion_dist' "$s")
- longest_failure_streak: $(jq -r '.longest_failure_streak' "$s")
- failure_rate: ${fr}

## 原因分類

（失敗 run の原因は手動レビューで埋める。0 件の場合は「該当なし」）

EOF
  # failure_rate >= 0.10 のときのみ追記
  awk -v fr="$fr" 'BEGIN{ exit !(fr+0 >= 0.10) }' && cat <<'EOF'
## retry/alert 追加検討

failure_rate が 10% 以上です。retry / alert 実装を別 issue で検討してください。

EOF
  return 0
}

# render_slack_payload <summary_json_path> <pr_url>
# stdout: 5 行以内の text payload（JSON {"text": "..."}）
render_slack_payload() {
  local s="$1" url="$2"
  local txt
  txt=$(printf '%s\n' \
    "post-release-dashboard 30d auto-summary" \
    "runs=$(jq -r '.runs_total' "$s") schedule=$(jq -r '.schedule_runs_total' "$s")" \
    "failure_rate=$(jq -r '.failure_rate' "$s") longest_streak=$(jq -r '.longest_failure_streak' "$s")" \
    "draft PR: ${url}" \
    "Refs #517, #497, #351"
  )
  jq -n --arg t "$txt" '{text:$t}'
}

# post_slack <payload_json>
post_slack() {
  local payload="$1"
  if [ "$DRY_RUN" = "true" ]; then
    echo "[dry-run] would post to slack: $payload"
    return 0
  fi
  : "${SLACK_WEBHOOK_URL:?SLACK_WEBHOOK_URL is not set}"
  set +x  # webhook URL を log に出さない
  curl -sS -f -X POST -H 'Content-Type: application/json' \
    --data "$payload" "$SLACK_WEBHOOK_URL" >/dev/null || return 3
}

main() {
  parse_args "$@"
  mkdir -p "$TMP_DIR"
  local runs="$TMP_DIR/runs.json" summary="$TMP_DIR/summary.json"
  local redacted="$TMP_DIR/summary.redacted.json"

  gh run list --workflow=post-release-dashboard.yml --limit=80 \
    --json conclusion,createdAt,event,databaseId,url > "$runs" || exit 2

  aggregate_runs "$runs" > "$summary" || exit 2

  local oldest today
  oldest=$(jq -r '.oldest_schedule_created_at' "$summary")
  today=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  if ! is_30day_gate_satisfied "$oldest" "$today"; then
    echo "skipped: 30-day gate not satisfied (oldest=$oldest)"
    exit 0
  fi

  local ym; ym=$(date -u +%Y%m)
  local existing; existing=$(find_existing_pr "$ym")
  if [ -n "$existing" ]; then
    echo "skipped: existing PR found ($existing)"
    exit 0
  fi

  redact_log "$summary" > "$redacted"
  local pr_body; pr_body=$(render_pr_body "$redacted" "$ym")

  if [ "$DRY_RUN" = "true" ]; then
    echo "----- PR_BODY -----"
    echo "$pr_body"
    echo "----- SLACK_PAYLOAD -----"
    render_slack_payload "$redacted" "https://example.invalid/dry-run"
    echo "[dry-run] no side effects"
    exit 0
  fi

  local branch="auto/post-release-30day-summary-${ym}"
  git checkout -b "$branch"
  mkdir -p .claude/skills/aiworkflow-requirements/changelog
  printf '%s\n' "$pr_body" > ".claude/skills/aiworkflow-requirements/changelog/${ym}-30day-auto-summary.md"
  git add ".claude/skills/aiworkflow-requirements/changelog/${ym}-30day-auto-summary.md"
  git commit -m "chore(skill): post-release-dashboard 30d auto-summary ${ym}"
  git push -u origin "$branch"

  local pr_url
  pr_url=$(gh pr create --draft --base main \
    --title "${TITLE_PREFIX} ${ym}" \
    --body "$pr_body")

  local payload; payload=$(render_slack_payload "$redacted" "$pr_url")
  post_slack "$payload"
}

# テスト時は __main__ を呼ばないため、source 用に main 起動を分岐
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  main "$@"
fi
```

ファイル: `scripts/post-release-dashboard/lib/aggregate.sh`（jq ロジックは上の `aggregate_runs` を share するため、初期は空関数集合 + 将来の helper 拡張用 placeholder）。

```bash
#!/usr/bin/env bash
# 集計関連ヘルパ。aggregate_runs() は 30day-summary.sh 本体に定義。
# 拡張時はここに helper を追加。
:
```

### 2-1. exit code 表

| code | 意味 | 経路 |
| --- | --- | --- |
| 0 | success / silent skip / dry-run 成功 | gate skip / 重複 PR skip / 正常 / --dry-run |
| 2 | parse / aggregate error | gh run list 失敗 / jq 失敗 |
| 3 | Slack POST failure | curl 非 2xx |
| 64 | 引数不正 / 前提欠落 | unknown arg / 親 workflow 不在 |

---

## 3. README 追記内容

ファイル: `scripts/post-release-dashboard/README.md`（未存在時は新規作成）

```markdown
## 30-day auto-summary

post-release-dashboard.yml の運用 30 日経過後に conclusion 分布 / failure 比率 / 連続失敗を
自動集計し、draft PR と Slack 通知を起票する自動化基盤。

### 実行手順

#### ローカル dry-run

```bash
bash scripts/post-release-dashboard/30day-summary.sh --dry-run
```

PR 起票・Slack 送信なし。集計 JSON / PR_BODY / SLACK_PAYLOAD を stdout 出力。

#### GHA workflow_dispatch

GitHub Actions UI > `post-release-30day-auto-summary` > Run workflow > `dry_run: true/false`。

#### 自動 cron

UTC 01:00 daily に自動起動。30 日 gate 不成立なら silent skip。

### Secrets 設定

`SLACK_WEBHOOK_URL` を GitHub repo Settings > Secrets and variables > Actions に登録。

```bash
# 1Password から実値を取り出し、GH Secrets に登録（ローカルファイルに残さない）
gh secret set SLACK_WEBHOOK_URL --body "$(op read 'op://Personal/UBM-Slack-Webhook/url')"
```

Slack channel: `w1618436027-ek2505248`（Webhook がこの channel にバインド済前提）。

### 関連ファイル

- workflow: `.github/workflows/post-release-30day-auto-summary.yml`
- script: `scripts/post-release-dashboard/30day-summary.sh`
- helper: `scripts/post-release-dashboard/lib/aggregate.sh` / `lib/redaction-check.sh`
- tests: `scripts/post-release-dashboard/__tests__/30day-summary.test.sh`
```

---

## 4. GitHub Secrets 登録手順

```bash
# 1. 1Password に Slack Incoming Webhook URL を保管（Item: UBM-Slack-Webhook / Field: url）
# 2. gh secret set で GitHub repo に登録（実値は端末履歴・リポジトリに残さない）
gh secret set SLACK_WEBHOOK_URL \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://Personal/UBM-Slack-Webhook/url')"

# 3. 登録確認（値は表示されない）
gh secret list --repo daishiman/UBM-Hyogo | grep SLACK_WEBHOOK_URL
```

**禁止事項**:

- `.env` への実値記載
- `echo` / `cat` / `gh secret set --body 'https://...'` の直書き
- Slack channel ID 以外の URL 識別子をドキュメントに記載すること

Slack channel: `w1618436027-ek2505248`（Webhook 紐付け先）

---

## 5. 命名規約 / テンプレ集

### 5-1. branch 命名

| パターン | 値 | 説明 |
| --- | --- | --- |
| 自動集計用 | `auto/post-release-30day-summary-YYYYMM` | 月次重複防止 / force-push 不可 |

例: `auto/post-release-30day-summary-202605`

### 5-2. PR タイトル

```
[auto-summary] post-release-dashboard 30d YYYYMM
```

例: `[auto-summary] post-release-dashboard 30d 202605`

### 5-3. PR body テンプレ（render_pr_body の出力）

```markdown
# post-release-dashboard 30d auto-summary (202605)

Refs #517, Refs #497, Refs #351

## 集計結果

- runs_total: 80
- schedule_runs_total: 30
- oldest_schedule_created_at: 2026-04-07T00:00:00Z
- conclusion 分布: {"success":27,"failure":3}
- longest_failure_streak: 2
- failure_rate: 0.10

## 原因分類

（失敗 run の原因は手動レビューで埋める。0 件の場合は「該当なし」）

## retry/alert 追加検討（failure_rate >= 10% 時のみ）

failure_rate が 10% 以上です。retry / alert 実装を別 issue で検討してください。
```

### 5-4. Slack payload テンプレ（5 行以内）

```text
post-release-dashboard 30d auto-summary
runs=80 schedule=30
failure_rate=0.10 longest_streak=2
draft PR: https://github.com/daishiman/UBM-Hyogo/pull/XXX
Refs #517, #497, #351
```

JSON 形式で POST:

```json
{"text":"post-release-dashboard 30d auto-summary\nruns=80 schedule=30\nfailure_rate=0.10 longest_streak=2\ndraft PR: https://github.com/.../pull/XXX\nRefs #517, #497, #351"}
```

---

## 6. ローカル実行コマンド（一括）

```bash
# 1. 単体 test
bash scripts/post-release-dashboard/__tests__/run-all.sh

# 2. dry-run
bash scripts/post-release-dashboard/30day-summary.sh --dry-run

# 3. workflow YAML 構文確認
yq '.' .github/workflows/post-release-30day-auto-summary.yml >/dev/null

# 4. permissions 確認
yq '.jobs.summarize.permissions' .github/workflows/post-release-30day-auto-summary.yml
```

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | workflow YAML / script / README / Secrets / branch / PR / Slack の 7 雛形が漏れなく揃い、Phase 11 でそのまま再現可能 |
| 実現性 | PASS | bash + jq + gh + curl のみ。Secrets 登録は 1Password + gh secret set の標準手順 |
| 整合性 | PASS | 既存 `lib/redaction-check.sh` を source 再利用。命名規約は D-4 / D-5 と完全一致 |
| 運用性 | PASS | dry-run / silent skip / 重複 PR skip の 3 経路が runbook に明記。SLACK_WEBHOOK_URL は op 参照経由で登録 |

---

## DoD（Phase 5）

- [ ] workflow YAML 完全雛形がコピペ可能
- [ ] shell script 雛形が関数 7 件 + main 制御フロー込みで完備
- [ ] README 追記内容に Secrets 登録 / dry-run / cron 起動が含まれる
- [ ] gh secret set 手順が op 参照経由で実値非露出
- [ ] branch / PR title / PR body / Slack payload テンプレが固定
- [ ] exit code 0 / 2 / 3 / 64 が表で固定
- [ ] 4 条件評価が全 PASS

---

## 次 Phase への引き渡し

- 次 Phase: 6（異常系）
- 引き継ぎ事項:
  - script 雛形 + exit code 表（異常系で trigger / exit code を突き合わせ）
  - branch / PR title / Slack payload テンプレ（異常系で「失敗時の残置」評価に利用）
- ブロック条件:
  - 雛形にハードコード secret が残存
  - exit code 表が異常系シナリオ表と乖離
