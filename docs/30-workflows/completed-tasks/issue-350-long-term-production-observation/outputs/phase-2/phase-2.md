# Phase 2 — アーキテクチャ設計

**[実装区分: 実装仕様書]**

## 1. アーキテクチャ全体像

```
[GitHub release tag / workflow_dispatch input]
            │
            ▼
[.github/workflows/post-release-observation-reminder.yml]
            │   schedule: cron '0 0 * * *' (daily UTC)
            │   if: 今日 == release_date + 7 OR + 30
            ▼
[scripts/observation/create-reminder-issue.sh]
            │   - 観測指標 / 閾値 / evidence path テンプレ展開
            │   - gh issue create --title "[D+N observation] ..." --body @-
            ▼
[GitHub Issue (open)]
            │   担当者が manual で metrics を埋め、判定
            ▼
[CRITICAL → rollback runbook] / [PASS → close]
```

## 2. 採用技術と却下案

| 候補 | 採否 | 理由 |
| --- | --- | --- |
| **GitHub Actions schedule** | ✅ 採用 | 無料 / 既存運用整合 / Cloudflare cron 枠不消費 |
| Cloudflare Workers cron 追加 | ❌ 却下 | free plan 3 本上限を既に消費（C-01） |
| 外部 SaaS（PagerDuty / Datadog） | ❌ 却下 | 有料 / scope 外（C-02） |
| 手動カレンダーのみ | ❌ 却下 | 期日忘れリスク（FR-01 不充足） |

## 3. 観測トリガー設計

### 3.1 release_date の伝達経路

GitHub Actions に「直近 production release 日」を渡す経路は 2 つ:

1. **workflow_dispatch input**: `release_date: YYYY-MM-DD`（手動運用 — fallback）
2. **schedule + release lookup**: `gh api repos/$REPO/releases/latest` の JSON から最新 release の `published_at` を取得（自動運用 — primary）

primary は schedule で日次起動、その日が「release+7」「release+30」のいずれかに合致したら reminder Issue を起票。それ以外は no-op で終了。

### 3.2 冪等性

```
タイトル: "[D+{N} observation] post-release {release_date}"
```

同タイトルの open Issue が存在すれば作成 skip（`gh issue list --state open --search`）。

## 4. ファイル変更レイアウト

```
.github/workflows/
  └── post-release-observation-reminder.yml      # 新規

scripts/observation/
  ├── create-reminder-issue.sh                   # 新規（POSIX shell）
  ├── check-thresholds.md                        # 新規（手動チェック手順）
  └── reminder-issue-template.md                 # 新規（Issue body テンプレ）

docs/runbooks/
  └── post-release-long-term-observation.md      # 新規

.claude/skills/aiworkflow-requirements/references/
  └── post-release-long-term-observation.md      # 新規（SSOT mirror）

.claude/skills/aiworkflow-requirements/indexes/
  ├── resource-map.md                          # 編集（エントリ追加）
  ├── topic-map.md                             # 編集（エントリ追加）
  └── keywords.json                              # 編集（D+7 / D+30 / 長期観測）

docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/
  └── unassigned-task-detection.md               # 編集（task-09c-long-term-... 行を consumed trace へ）
```

## 5. データフロー / スキーマ

### 5.1 reminder-issue-template.md schema

```
# [D+{N} observation] post-release {release_date}

## 観測対象
| 指標 | 閾値 | 実測 | 判定 | evidence |
| --- | --- | --- | --- | --- |
| req/day | < 100k | _________ | ☐ PASS / ☐ WARN / ☐ CRIT | link/path |
| D1 reads/day | < 5M | ... | ... | ... |
| ... | | | | |

## 異常時の分岐
- WARN: コメント追記し継続観測
- CRITICAL: docs/runbooks/post-release-long-term-observation.md §4 → rollback 判断
- silent (authz fail / cron 0%): 即時 rollback + postmortem

## クローズ条件
- [ ] 全指標 PASS または WARN で経過観察判断
- [ ] evidence path がリンク可能
```

### 5.2 workflow YAML 構造（疑似）

```yaml
name: post-release-observation-reminder
on:
  schedule:
    - cron: '0 9 * * *'   # daily 09:00 UTC = 18:00 JST
  workflow_dispatch:
    inputs:
      release_date: { description: 'YYYY-MM-DD', required: false }
      offset_days: { description: '7 or 30', required: false }

jobs:
  remind:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Compute target offset
        id: compute
        run: scripts/observation/create-reminder-issue.sh --resolve-only
      - name: Create reminder issue
        if: steps.compute.outputs.should_remind == 'true'
        run: scripts/observation/create-reminder-issue.sh --create
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 6. 関心ごとの分離

| 関心 | 責務ファイル |
| --- | --- |
| trigger（when） | `post-release-observation-reminder.yml` |
| business logic（offset 計算 / 冪等性判定） | `scripts/observation/create-reminder-issue.sh` |
| Issue 本文（what to observe） | `scripts/observation/reminder-issue-template.md` |
| 判断手順（how to act） | `docs/runbooks/post-release-long-term-observation.md` |
| SSOT 検索導線 | `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` |

## 7. 完了条件（Phase 2）

- [ ] アーキ図 / 採否判断 / レイアウト / schema 全て記述済
- [ ] Phase 3 に渡せる粒度のファイル一覧が確定
