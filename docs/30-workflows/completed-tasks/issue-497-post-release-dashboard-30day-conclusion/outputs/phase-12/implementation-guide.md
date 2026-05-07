# Implementation Guide

## Part 1: 中学生レベル

この作業は、GitHub Actions（GitHub の中で自動で動く作業係）が 30 日間、毎日 0 時に正しく走ったかを確認するための準備書です。

今はまだ 30 日分の成績表がそろっていないため、実際の点数は書きません。30 日分がそろったあとで、workflow（毎日動く作業の決まり）を確認し、conclusion（今日の成績通知: 合格 / 失敗 / 途中棄権 / 起動失敗 / 時間切れ / 要対応）を数えます。

失敗が 30 日のうち 3 日以上、つまり failure rate（失敗の割合）が 10% 以上なら、通知や再試行を追加する別作業を作ります。cron（決まった時刻に動かす時計係）が止まっていた場合も、ここで見つけられるようにします。

専門用語セルフチェック:

| 用語 | 日常語 |
| --- | --- |
| GitHub Actions | GitHub の中で自動で動く作業係 |
| workflow | 毎日動く作業の決まり |
| conclusion | 今日の成績通知 |
| cron | 決まった時刻に動かす時計係 |
| failure rate | 失敗した日の割合 |
| redaction | 見せてはいけない秘密を消す確認 |

Screenshot: N/A（NON_VISUAL。画面 UI 変更なし。`apps/` / `packages/` 変更なし。）

## Part 2: 技術者レベル

### 現状態

この Phase 12 出力は **Issue #497 の実測完了証跡ではなく、30 日 gate 後に実行する follow-up contract の formalize 証跡**である。`workflow_state` は `spec_created` を維持し、Phase 11 runtime PASS は主張しない。

### 実行時コマンド

Gate A は次で判定する。

```bash
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json createdAt \
  --jq 'min_by(.createdAt) | .createdAt'
```

Gate 成立後、raw JSON を取得する。

```bash
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json conclusion,createdAt,databaseId,status,event,updatedAt,url \
  --jq '[.[] | select(.event=="schedule")]' \
  > docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/post-release-dashboard-30d.json
```

### データ契約

| フィールド | 用途 |
| --- | --- |
| `databaseId` | failure log 取得用 run id |
| `conclusion` | conclusion 分布と failure rate 算出 |
| `status` | run 完了状態の補助確認 |
| `createdAt` | 30 日 gate と連続 failure window 算出 |
| `event` | `schedule` のみを 30 日連続判定に採用 |
| `updatedAt` | run 所要時間の概算 |
| `url` | 監査時の run 導線 |

raw JSON は配列 root とする。`conclusion` は `success`, `failure`, `cancelled`, `startup_failure`, `timed_out`, `action_required`, `null` を許容し、未完了 run は分布表で別行にする。

### schedule continuity

manual `workflow_dispatch` は 30 日連続判定に含めない。`createdAt[0:10]` を昇順に並べ、日次 gap が 0 であることを `outputs/phase-11/schedule-gap-check.md` に記録する。gap がある場合、AC-1 は PENDING / FAIL とし、`deployment-gha.md` に実測完了として転記しない。

### failure rate

failure rate の分子は `failure`, `startup_failure`, `timed_out` の 3 種に統一する。

| 条件 | 判断 |
| --- | --- |
| `< 10%` | 現状維持。追加未タスクなし |
| `>= 10%` | retry / alert 追加を別 unassigned task として起票。Issue #497 は CLOSED 維持 |

### redaction

failure log は skill references に原文転記しない。転記前に次を実行する。

```bash
rg -n -i 'token|bearer|secret|Authorization|ya29\.|ghp_|ghs_' \
  docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/log-failed-*.log
```

### 追記先

| 対象 | 内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 30 日 gate / evidence / redaction / threshold の契約。実測値は gate 成立後に追記 |
| `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` | formalized follow-up contract の履歴 |
| `references/task-workflow-active.md` / indexes | Issue #497 への導線 |

### artifact / duration evidence

Gate 成立後は各 run id に対して `gh run download <id>` を実行し、downloadability を `outputs/phase-11/artifact-downloadability.csv` に保存する。artifact 取得不可の run は retention / upload failure / permission failure のいずれかに分類し、failure root cause とは別表で記録する。

Run 所要時間は `createdAt` から `updatedAt` までの差分で概算し、min / median / max を `aggregation.md` に記録する。`updatedAt` 欠損は `duration_unknown` として扱う。

### same-cycle implementation hardening

Review found one Issue #351 implementation drift that could be fixed in this cycle: `scripts/post-release-dashboard/lib/redaction-check.sh` now writes `redaction-check.md` into the uploaded artifact directory, and `ci.yml` runs `pnpm post-release-dashboard:test`. This does not convert Issue #497 runtime evidence to PASS; it only aligns the parent automation contract.
