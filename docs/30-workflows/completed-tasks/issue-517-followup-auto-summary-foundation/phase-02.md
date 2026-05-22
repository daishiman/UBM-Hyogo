# Phase 2: 設計（workflow YAML / shell script / Secrets contract）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（workflow YAML / shell script / Secrets contract） |
| 作成日 | 2026-05-07 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビューゲート） |
| 状態 | spec_created |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |
| タスク分類 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #517（CLOSED 維持） |

## 目的

Phase 1 で固定した FR-1〜FR-12 / NFR-1〜NFR-7 を、(1) **workflow YAML 構造設計**、(2) **shell script 設計（関数構造 / 入出力契約 / exit code）**、(3) **GitHub Secrets / permissions 契約**、(4) **失敗パターン早見表**、(5) **既存 workflow / lib との interface** の 5 軸で設計する。Phase 3 がレビュー観点で MAJOR / MINOR / PASS を機械判定できる粒度の設計を出力する。

---

## 軸 1: workflow YAML 構造設計

### 1-1. ファイル: `.github/workflows/post-release-30day-auto-summary.yml`

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Configure git identity
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

      - name: Run 30day summary
        id: summary
        run: |
          if [ "${DRY_RUN}" = "true" ]; then
            bash scripts/post-release-dashboard/30day-summary.sh --dry-run
          else
            bash scripts/post-release-dashboard/30day-summary.sh
          fi
```

### 1-2. trigger / inputs / outputs / env

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| trigger | schedule (`0 1 * * *`) + workflow_dispatch | D-1 |
| inputs.dry_run | boolean / default false | D-9 / FR-2 |
| permissions | `contents: write` / `pull-requests: write` / `actions: read` | NFR-6 |
| concurrency | `post-release-30day-auto-summary` 単一 group / cancel-in-progress: false | 同月内重複実行を直列化 |
| timeout-minutes | 10 | gh run list + jq + git push + gh pr create + curl の合計の安全 margin |
| env.GH_TOKEN | `${{ secrets.GITHUB_TOKEN }}` | gh CLI 認証 |
| env.SLACK_WEBHOOK_URL | `${{ secrets.SLACK_WEBHOOK_URL }}` | NFR-3 / Secrets 契約 |
| env.DRY_RUN | `${{ inputs.dry_run || 'false' }}` | schedule 起動時は false 固定 |

### 1-3. 単一 step に集約する根拠

YAML 上で複数 step に分割するのではなく `30day-summary.sh` 1 本に集約する。理由:

- ローカル `--dry-run` と GHA 実行の **挙動同型性**（NFR-5）を保証するため。step 分割は GHA 専用ロジックを scattered させ DRY を壊す。
- redaction / 冪等チェックの順序を script 内で固定し、step 間の env 受け渡しによる事故を排除（NFR-4）。

---

## 軸 2: shell script 設計

### 2-1. ファイル構成

```
scripts/post-release-dashboard/
├── 30day-summary.sh                 # 新規・エントリポイント
├── lib/
│   ├── aggregate.sh                 # 新規・jq 集計ロジック
│   └── redaction-check.sh           # 既存・再利用（source）
└── __tests__/
    ├── 30day-summary.test.sh        # 新規
    └── fixtures/30day-summary/      # 新規 fixture（4 ケース）
        ├── gate-not-satisfied.json
        ├── gate-satisfied-clean.json
        ├── gate-satisfied-failure-rate-high.json
        └── gate-satisfied-redaction-trigger.txt
```

### 2-2. 関数構造と入出力契約

すべての関数は `set -euo pipefail` 配下で動作し、副作用（git / gh / curl）は明示関数に閉じる。

| 関数 | 入力 | 出力 | exit code |
| --- | --- | --- | --- |
| `aggregate_runs(runs_json_path)` | gh run list JSON のパス | stdout: 集計 JSON `{conclusion_dist, longest_failure_streak, failure_rate, runs_total, schedule_runs_total, oldest_schedule_created_at}` | 0=ok / 2=parse error |
| `redact_log(file_path)` | テキストファイルパス | stdout: redacted 内容（`token` / `bearer` / `secret` / `Authorization` を含む行を `(redacted: <pattern>)` に置換） | 0=ok |
| `is_30day_gate_satisfied(oldest_created_at, today_iso)` | ISO 8601 文字列 2 つ | exit 0 = 成立 / exit 1 = 不成立 | 0/1 |
| `find_existing_pr(year_month)` | `YYYYMM` 文字列 | stdout: PR URL（存在時） / 空文字（不存在時） | 0=ok |
| `render_pr_body(summary_json_path, year_month)` | 集計 JSON path / `YYYYMM` | stdout: markdown 文字列。failure_rate >= 0.10 の場合「retry/alert 追加検討」セクションを末尾に追記 | 0=ok |
| `render_slack_payload(summary_json_path, pr_url)` | 集計 JSON path / PR URL | stdout: 5 行以内の text payload | 0=ok |
| `post_slack(payload)` | 5 行以内の text | Slack POST。dry-run 時は stdout に `[dry-run] would post` のみ | 0=ok / 3=curl failure |

### 2-3. エントリポイント `30day-summary.sh` の制御フロー

```text
1. parse args (--dry-run flag → DRY_RUN=true)
2. source lib/aggregate.sh / lib/redaction-check.sh
3. mkdir -p tmp/30day-summary
4. RUNS_JSON=tmp/30day-summary/runs.json
   gh run list --workflow=post-release-dashboard.yml --limit=80 \
     --json conclusion,createdAt,event,databaseId,url > "$RUNS_JSON"
5. SUMMARY_JSON=tmp/30day-summary/summary.json
   aggregate_runs "$RUNS_JSON" > "$SUMMARY_JSON"
6. OLDEST=$(jq -r '.oldest_schedule_created_at' "$SUMMARY_JSON")
   TODAY=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   if ! is_30day_gate_satisfied "$OLDEST" "$TODAY"; then
     echo "skipped: 30-day gate not satisfied (oldest=$OLDEST)"
     exit 0
   fi
7. YEAR_MONTH=$(date -u +%Y%m)
   EXISTING_PR=$(find_existing_pr "$YEAR_MONTH")
   if [ -n "$EXISTING_PR" ]; then
     echo "skipped: existing PR found ($EXISTING_PR)"
     exit 0
   fi
8. redact_log "$SUMMARY_JSON" > tmp/30day-summary/summary.redacted.json
9. PR_BODY=$(render_pr_body tmp/30day-summary/summary.redacted.json "$YEAR_MONTH")
10. if DRY_RUN: echo "$PR_BODY"; render_slack_payload + echo "[dry-run] ..."; exit 0
11. BRANCH="auto/post-release-30day-summary-${YEAR_MONTH}"
    git checkout -b "$BRANCH"
    # references / changelog markdown を生成して commit
    git push -u origin "$BRANCH"
12. PR_URL=$(gh pr create --draft --base main \
      --title "[auto-summary] post-release-dashboard 30d ${YEAR_MONTH}" \
      --body "$PR_BODY")
13. SLACK_PAYLOAD=$(render_slack_payload tmp/30day-summary/summary.redacted.json "$PR_URL")
    post_slack "$SLACK_PAYLOAD"
```

### 2-4. exit code semantics

| code | 意味 |
| --- | --- |
| 0 | success（gate 不成立 silent skip / 重複 PR silent skip / 正常完了 / dry-run 成功 すべて含む） |
| 2 | parse / aggregate error（gh run list 出力が JSON でない等） |
| 3 | Slack POST failure（curl 非 2xx）。PR は既に作成済のため再実行で重複検出により安全 |
| 64 | 引数不正 |

### 2-5. 失敗 isolation 設計

- gate 不成立 / 重複 PR は **exit 0** で silent skip（NFR-2 通り log だけ残す）。
- step 7 で重複 PR を検出した時点で **Slack POST は実行しない**（AC-4）。
- step 12 で PR 作成成功 → step 13 の Slack 失敗の場合、PR は残るが Slack 通知は次月までスキップ（運用者は draft PR list を見れば気付ける）。

### 2-6. dry-run mode 仕様

- `--dry-run` flag が立つと:
  - step 4〜10 までは production と同一実行
  - step 11（git push）/ step 12（gh pr create）/ step 13（curl Slack）を **すべてスキップ**
  - PR_BODY と SLACK_PAYLOAD を stdout に出力
  - exit 0
- Slack URL や GH token が未設定でも fail しない（read-only operation のみ）

---

## 軸 3: GitHub Secrets / permissions 契約

| 種別 | 名前 | 値の取得元 | 用途 | 露出禁止 |
| --- | --- | --- | --- | --- |
| Secret | `SLACK_WEBHOOK_URL` | 運用者が GitHub repo Settings > Secrets で登録 | Slack Incoming Webhook POST | log / PR body / Slack payload |
| Secret | `GITHUB_TOKEN` | GHA 自動 | gh CLI 認証 / branch push / PR 作成 | 既存実装通り |
| Variable | （なし） | - | - | - |

### 3-1. permissions

```yaml
permissions:
  contents: write
  pull-requests: write
  actions: read
```

`SLACK_WEBHOOK_URL` 登録手順は `scripts/post-release-dashboard/README.md` に記載（Phase 12 で生成）。実値はリポジトリにコミットしない（CLAUDE.md シークレット方針 / NFR-3）。

### 3-2. Slack channel bootstrap

`w1618436027-ek2505248`（D-10）を通知先 channel とする。

実装側は channel 作成や Webhook 作成を自動化しない。Slack App / Bot OAuth 化を避けるため、Phase 11 preflight で次を手動確認する:

1. channel `w1618436027-ek2505248` が存在し、運用者が閲覧 / 投稿確認できる
2. Incoming Webhook が当該 channel に bind されている
3. Webhook URL が 1Password 正本に保存されている
4. GitHub Secret `SLACK_WEBHOOK_URL` が 1Password 正本から派生登録されている
5. `[TEST FROM ISSUE-517 PHASE-11]` prefix の test post が HTTP 200 で届き、確認後に削除される

この preflight を PASS するまで `post_slack` の本番経路は実行可能とみなさない。

---

## 軸 4: 失敗パターン早見表

| パターン | 検出 step | 期待挙動 | exit code |
| --- | --- | --- | --- |
| gate 不成立（運用 30 日未満） | step 6 | silent skip / `skipped: 30-day gate not satisfied` を log | 0 |
| dry-run | step 1 / step 10 | stdout 出力のみで終了 | 0 |
| 重複 PR（同月内既存） | step 7 | silent skip / Slack 送信なし | 0 |
| Slack 通信失敗 | step 13 | error log / PR は残置 | 3 |
| redaction trigger（4 パターン hit） | step 8 (redact_log) | 該当行を `(redacted: <pattern>)` に置換し処理継続。stderr に hit 件数 | 0 |
| gh run list 異常応答 | step 4 / 5 (aggregate_runs) | error log / 中断 | 2 |
| failure_rate >= 10% | step 9 (render_pr_body) | retry/alert 追加検討セクションを PR body に追記 | 0（正常分岐） |

---

## 軸 5: 既存 interface との整合

### 5-1. workflow path existence gate

実行時に `.github/workflows/post-release-dashboard.yml` の存在を script 起動時に確認:

```bash
if [ ! -f .github/workflows/post-release-dashboard.yml ]; then
  echo "error: post-release-dashboard.yml not found (parent workflow missing)" >&2
  exit 64
fi
```

実在確認手順（spec 作成時 / 2026-05-07 時点）:

- `ls .github/workflows/post-release-dashboard.yml` で存在確認済（本仕様書作成時に確認済）
- 当該 workflow の `on.schedule` は `cron: '0 0 * * *'`（UTC 00:00）であることを確認済 → 本タスク cron `0 1 * * *` の 1 時間遅延設計と整合

### 5-2. 既存 lib/redaction-check.sh との関係

- `scripts/post-release-dashboard/lib/redaction-check.sh` は既存 (artifact directory に対する gate チェック用 / issue-497 hardening で導入)。
- 本タスクの `redact_log()` 関数は **同 lib を source または同等パターンを share** する DRY 制約。Phase 5 で実装方針を確定する（本 Phase ではパターン同一性 4 件 (`token` / `bearer` / `secret` / `Authorization`) のみ固定）。

### 5-3. issue-497 アウトプットとの interface

- 本タスクは issue-497 仕様書（`docs/30-workflows/issue-497-...`）を **read-only 参照**。編集禁止。
- 集計 JSON / markdown のフォーマットは issue-497 Phase 2 軸 1 / 軸 3 と互換（同月内同一構造）。

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | workflow YAML / 関数構造 / exit code semantics が機械的に AC-1〜AC-10 を充足。dry-run 同型性で運用 onboarding コスト最小 |
| 実現性 | PASS | gh / jq / curl / git のみ。GHA permissions / Secrets / cron / draft PR は標準。timeout 10 分は安全 margin |
| 整合性 | PASS | 既存 redaction lib を source 再利用（DRY）。post-release-dashboard.yml に手を入れない（read-only）。issue-497 仕様書編集禁止 |
| 運用性 | PASS | exit code 0/2/3/64 で運用判別可能。gate / 重複 PR / dry-run の 3 silent-skip 経路明示。failure_rate >= 10% 自動検討節挿入 |

---

## DoD（Phase 2）

- [ ] workflow YAML 構造（trigger / permissions / env / steps）が一意に確定
- [ ] 関数 7 件（aggregate_runs / redact_log / is_30day_gate_satisfied / find_existing_pr / render_pr_body / render_slack_payload / post_slack）の入出力 / exit code 契約が固定
- [ ] dry-run 仕様（step 11〜13 スキップ / stdout 出力 / 副作用なし）が明示
- [ ] exit code 0 / 2 / 3 / 64 の意味が表で固定
- [ ] failure パターン早見表 7 件が漏れなし
- [ ] Secrets / permissions 契約が least-privilege で記述
- [ ] 既存 `lib/redaction-check.sh` との DRY 整合方針が記述
- [ ] 4 条件評価が全 PASS

---

## 次 Phase への引き渡し

- 次 Phase: 3（設計レビューゲート）
- 引き継ぎ事項:
  - workflow YAML 草稿（軸 1-1）
  - 関数 7 件の入出力契約（軸 2-2）
  - 制御フロー 13 ステップ（軸 2-3）
  - 失敗パターン早見表 7 件（軸 4）
  - workflow path existence gate コード片（軸 5-1）
- ブロック条件:
  - 関数の入出力契約が曖昧
  - silent-skip 経路（gate / 重複 PR）と副作用 step の境界が不明確
  - SLACK_WEBHOOK_URL の log 露出可能性
