# Phase 9: 運用準備 / observability（pass_runtime_synced 昇格手順）

## 目的

production switch merge 後 7 日間の hourly observation を **読み取り専用** に運用するための監視手順、4 観測軸の集計手順、alert 発火条件、`pass_runtime_synced` 昇格判定、rollback runbook 起動条件を確定する。runbook の物理ファイル更新は Phase 6 ステップ 5 / Phase 12 で行うため、本 Phase ではパスと内容契約のみを宣言する。

## 前 Phase 依存

- Phase 3: hourly workflow / 7day summary workflow / aggregation 出力 schema
- Phase 8: secret leakage gate 3 層 / forward-safe 検証コマンド / governance

## 完了条件

- [ ] 7 日 hourly observation の運用手順（hourly run 成否監視 / fallback rate 集計 / leakage grep 日次確認 / artifact 件数確認）を確定
- [ ] alert 条件（fallback rate / FP / FN / hourly run 失敗）を閾値付きで列挙
- [ ] runbook 参照パス（post-switch-observation / rollback / `pass_runtime_synced` 昇格）を確定し、内容契約を記述
- [ ] D1 列に touch しない（forward-safe）ことを再宣言
- [ ] `pnpm sync:check` / `gh run list` などの read-only コマンドのみで運用が完結することを確認

## 9-1. 7 日 hourly observation 運用手順

| サイクル | 操作 | コマンド / 確認先 |
| --- | --- | --- |
| Daily（D+1〜D+6） | hourly run 成否確認 | `gh run list --workflow cf-audit-log-monitor.yml --limit 25` |
| Daily | fallback rate alert 発火確認 | `gh issue list --label "type:alert,cf-audit-log" --state open` |
| Daily | leakage grep 日次集計 | hourly run の log を artifact から download し `secret-leakage-grep.ts` で再走（read-only） |
| Daily | artifact 件数確認 | `gh api repos/daishiman/UBM-Hyogo/actions/artifacts?name=hourly-snapshot-*` |
| D+7 | 7day summary workflow trigger | `gh workflow run cf-audit-log-7day-summary.yml --ref dev` |
| D+7 | evidence PR review & merge | 起票された PR を review。leakage 0 件 / 168 snapshots を確認後 merge |
| D+7 | SSOT 4 ファイルを `pass_runtime_synced` に書き換え | 別 PR で `task-workflow-active.md` 等を更新 |

## 9-2. alert 条件

| 軸 | 閾値 | 発火 |
| --- | --- | --- |
| fallback rate | > 5% を 3 hour 連続 | `fallback-rate-alert.ts` が GitHub Issue 起票（hourly run は fail させない）|
| leakage grep | hit ≥ 1 件（hourly） | `--exit-on-detect` で hourly run fail。manual escalation: token revoke + Issue 削除 |
| hourly run 失敗 | 連続 3 回 fail | `gh run list` で確認。GitHub Actions infra 起因なら静観、code 起因なら revert |
| Issue 起票数 | baseline（threshold 期）の 1.5 倍超 | 7day summary 出力で検出。`pass_runtime_synced` 昇格不可 |
| p95 latency | baseline の 2 倍超 | 7day summary 出力で検出。昇格判断に warning として記録 |

## 9-3. `pass_runtime_synced` 昇格判定

D+7 で 7day summary workflow が起票した PR の evidence をもとに、次の 4 条件を AND で満たした場合に昇格する:

1. `actualSnapshots === 168`
2. `fallbackRateMean ≤ 0.05`
3. `leakageHits === 0`
4. `issuesOpenedTotal ≤ baseline × 1.5`

1 つでも未達なら `pass_boundary_synced_runtime_pending` 維持し、再観測 7 日サイクルへ。

## 9-4. runbook 参照パス（内容契約）

| ランブック | 内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` § post-switch 7-day observation | daily check 手順 / 7day summary trigger / `pass_runtime_synced` 昇格条件 / canonical evidence path |
| 同 § forward-safe rollback (cf-audit-log) | `gh variable set` 1 行 + revert PR / D1 列残置を再掲 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` § cf-audit-log monitoring | 4 観測軸の閾値 / `pass_runtime_synced` 状態定義 / canonical evidence path |

## 9-5. D1 列 touch 禁止

- 本タスクでは `cf_audit_log` テーブルの DDL に一切触らない
- `apps/api/migrations/` 配下に diff を作らないことを CI 段階で `git diff dev...HEAD --stat apps/api/migrations/` が空であることを目視確認

## 9-6. read-only コマンド一覧

| 用途 | コマンド |
| --- | --- |
| リモート遅れ確認 | `mise exec -- pnpm sync:check` |
| hourly run 一覧 | `gh run list --workflow cf-audit-log-monitor.yml --limit 25` |
| artifact 一覧 | `gh api repos/daishiman/UBM-Hyogo/actions/artifacts` |
| open alert Issue | `gh issue list --label "type:alert,cf-audit-log" --state open` |

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 09 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 参照資料

- `phase-03.md`
- `phase-08.md`
- 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-09.md`
