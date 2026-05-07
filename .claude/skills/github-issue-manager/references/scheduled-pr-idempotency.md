# 月次冪等 scheduled PR 自動化

cron / `workflow_dispatch` で起動する scheduled job が、同月内に何度走っても
**重複 PR を発行せず・branch を上書きせず・副作用を残さず** に exit する設計パターン。
issue-517 follow-up auto-summary（post-release-dashboard 30d）で確立した正本パターン。

## 適用対象

- 月次サマリー / レポート PR を自動起票したい場合
- cron が daily で発火するが PR は月 1 件で十分な場合
- gate（30 日経過など）が満たされた最初の発火だけで PR を作りたい場合

## 構成要素

### 1. Branch 命名規則

```
auto/post-release-30day-summary-YYYYMM
```

- `YYYYMM` (UTC) で月単位に固定する。日次 cron で何度 push されても **同じ branch を再利用しない**
- prefix `auto/` を付け、人間の feature branch と視覚的に分離する
- `git checkout -b "$branch"` で常に新規作成し、既存 branch がある場合の上書きは silent skip 側で防ぐ

### 2. PR title prefix

```
[auto-summary] post-release-dashboard 30d YYYYMM
```

- 機械検索しやすい固定 prefix（`[auto-summary]`）+ ドメイン名 + `YYYYMM` を必ず含む
- `gh pr list --search "<prefix> <YYYYMM> in:title"` で確実に既存 PR を一意検出できる
- prefix を欠くと検索 noise（人手 PR の merge title など）を拾うので必須

### 3. Silent skip 条件（idempotency gate）

`exit 0` で副作用なしに終了する 2 段階のガード:

| 段 | 条件 | exit |
|----|------|------|
| (a) ドメイン gate（例: 30 日経過） | データ不成立 | 0 |
| (b) 既存 open PR 検知 | 同 `YYYYMM` の open PR が 1 件以上 | 0 |

両ガードとも **失敗 (`exit != 0`) ではなく成功 skip** とすることで、
cron 監視に false alert を出さない。Slack / dashboard も発火させない。

### 4. Schedule trigger（cron + workflow_dispatch）

```yaml
on:
  schedule:
    - cron: '0 1 * * *'   # daily UTC 01:00
  workflow_dispatch:
    inputs:
      dry_run:
        type: boolean
        default: false
```

- `schedule` は daily で十分（gate と PR 検知が冪等性を担保するため）
- `workflow_dispatch` を必ず併設し、手動再現・dry-run・debug を可能にする
- `concurrency.group` を固定し `cancel-in-progress: false` で多重起動を直列化

## 実装例（参照元）

### workflow（`.github/workflows/post-release-30day-auto-summary.yml`）

```yaml
on:
  schedule:
    - cron: '0 1 * * *'
  workflow_dispatch:
    inputs:
      dry_run:
        type: boolean
        default: false

concurrency:
  group: post-release-30day-auto-summary
  cancel-in-progress: false

jobs:
  summarize:
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Configure git identity
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
      - run: bash scripts/post-release-dashboard/30day-summary.sh
```

### Open PR 検知 silent skip（`scripts/post-release-dashboard/30day-summary.sh`）

```bash
TITLE_PREFIX='[auto-summary] post-release-dashboard 30d'

find_existing_pr() {
  local ym="$1"
  gh pr list --state open --limit 50 \
    --search "${TITLE_PREFIX} ${ym} in:title" \
    --json url --jq '.[0].url // ""'
}

ym=$(date -u +%Y%m)
existing=$(find_existing_pr "$ym")
if [ -n "$existing" ]; then
  echo "skipped: existing PR found ($existing)"
  exit 0
fi

branch="auto/post-release-30day-summary-${ym}"
git checkout -b "$branch"
git push -u origin "$branch"
gh pr create --draft --base main \
  --title "${TITLE_PREFIX} ${ym}" \
  --body "$pr_body"
```

### ドメイン gate（30 日経過判定）

```bash
# scripts/post-release-dashboard/lib/aggregate.sh が summary.json を生成
# 30day-summary.sh:is_30day_gate_satisfied
is_30day_gate_satisfied() {
  local summary="$1" today="$2"
  oldest=$(jq -r '.oldest_schedule_created_at' "$summary")
  schedule_days=$(jq -r '.schedule_days_total' "$summary")
  gap_days=$(jq -r '.missing_schedule_gap_days' "$summary")
  [ "$schedule_days" -ge 30 ] || return 1
  [ "$gap_days" -eq 0 ]       || return 1
  # cutoff 比較で 30 日経過を確認
}

if ! is_30day_gate_satisfied "$summary" "$today"; then
  echo "skipped: 30-day gate not satisfied ..."
  exit 0
fi
```

## アンチパターン

| アンチパターン | 何が起きるか | 正しいやり方 |
|---------------|-------------|-------------|
| タイトル prefix なし（自由フォーマット） | `gh pr list --search` で既存検知できず重複起票 | `[auto-summary] <domain> <YYYYMM>` を必須化 |
| Branch 上書き（`git push -f` / `checkout -B`） | 既存 open PR の HEAD を破壊し review コメントが孤立 | open PR 検知で先に exit 0、branch は新規作成のみ |
| 重複起票（gate なしで daily cron が PR 作成） | 同月に 30 件以上の同種 PR が乱立 | open PR 検知 + ドメイン gate の 2 段階ガード |
| skip を `exit 1` で表現 | cron が失敗扱い、監視 alert が誤発火 | skip は必ず `exit 0` + 標準出力に理由 |
| `YYYYMMDD` で branch 命名 | daily cron で日次 branch が増殖 | `YYYYMM` で月単位に固定 |
| `concurrency` 未設定 | cron と手動 dispatch の race で push 競合 | `concurrency.group` 固定 + `cancel-in-progress: false` |
| dry-run モード非対応 | 本番 cron でしか挙動検証できない | `--dry-run` で PR/Slack 副作用を skip |

## 参照元ファイル

- `.github/workflows/post-release-30day-auto-summary.yml` — workflow 定義
- `scripts/post-release-dashboard/30day-summary.sh` — silent skip / branch / PR 作成本体
- `scripts/post-release-dashboard/lib/aggregate.sh` — gate 用集計ロジック

## 関連リファレンス

- `references/scheduled-reminder-issue-pattern.md` — 同系列の **Issue** 自動起票パターン（D+7 / D+30 reminder）
- `references/d1-parity-followup.md` — execution follow-up Issue / blocker 双方向更新
