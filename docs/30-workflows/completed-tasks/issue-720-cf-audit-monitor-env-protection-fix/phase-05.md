# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | completed |

## 目的

Phase 4 で分解された T-01〜T-17 を、実行スケジュール / ブランチ運用 / 失敗時の rollback 計画も含めて実装計画として固定する。

## 実装計画

### ブランチ運用

| 項目 | 値 |
| --- | --- |
| feature ブランチ名 | `fix/issue-720-cf-audit-monitor-env-protection` |
| ベースブランチ | `dev` |
| 作業 worktree | `.worktrees/task-20260516-*` 配下 |
| マージ戦略 | squash or rebase（CLAUDE.md ブランチ戦略に準拠） |
| PR ベース | `dev` |
| production 反映 | `dev → main` で別 PR（本タスクスコープ外） |

### 実行フェーズ

#### Phase A: 事前準備 (user 同期前)

- T-01: `gh secret list --repo daishiman/UBM-Hyogo` / `gh secret list --repo daishiman/UBM-Hyogo --env production` の出力を取得
- T-01: `gh variable list --repo daishiman/UBM-Hyogo` / `gh variable list --repo daishiman/UBM-Hyogo --env production` の出力を取得
- T-02: 1Password の vault / item / field 名を確認し `outputs/phase-06/secret-injection-checklist.md` を生成

#### Phase B: secrets / vars 投入 (user-gated)

- T-03: user が `gh secret set` を 5 回実行 (`op read op://...` 経由)
- T-04: user が `gh variable set` を 9 回実行
- T-05: Claude が再度 `gh secret list` / `gh variable list` を取り、新規 5 + 9 が反映されていることを確認

#### Phase C: workflow yaml 修正

- T-06: `.github/workflows/cf-audit-log-monitor.yml` の L39 を削除
- T-07: `actionlint` / `yamllint` で構文確認
- T-08: user 明示承認後に feature ブランチへ commit、`git push -u origin fix/issue-720-cf-audit-monitor-env-protection`、`gh pr create --base dev`

#### Phase D: PR merge と疎通確認

- T-09: user が PR merge (solo 運用で CI gate 緑であれば self-merge)
- T-10: user 明示承認後に `gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev`
- T-11: dry_run run URL を evidence 化

#### Phase E: 6h runtime evidence

- T-12: hourly cron (xx:05 UTC) の最初 6 run を観察
- T-13: 6 連続 success を確認し evidence 記録

#### Phase F: 正本同期 / 振り返り

- T-14: runbook 追記 / ADR commit
- T-15: Phase 12 の 7 必須 output 作成
- T-16: Phase 13 振り返り
- T-17: 後続 followup 登録（production env 側 secret 削除）

## スケジュール (wallclock)

| Phase | 想定所要 | 備考 |
| --- | --- | --- |
| A | 30 min | Claude 主導 |
| B | 30 min | user 承認 + 操作 |
| C | 30 min | Claude 主導 |
| D | 1〜2 hour | PR merge 待ち + dry_run 確認 |
| E | 6h+ | hourly schedule 観察 |
| F | 2 hour | docs 作成 + 振り返り |
| **合計** | **約 1 日** | E が wallclock 律速 |

## rollback 計画

### Case 1: dry_run が secret 不在で fail

原因: T-03/T-04 で投入漏れ。
復旧: 漏れた secret / variable を投入し、再度 T-10 を実行。yaml は revert しない（root cause が secret 側のため）。

### Case 2: dry_run は success だが hourly が fail

原因: cron スケジュールタイミング起因、または `concurrency.cancel-in-progress: false` 待ち。
復旧: `gh run list --workflow=cf-audit-log-monitor.yml --limit 10` で実態確認。本物 fail なら個別 step ログを analyze し原因を特定。

### Case 3: 6h 観察中に security incident（secret 漏洩疑い）

復旧:
1. `gh secret delete <NAME> --repo daishiman/UBM-Hyogo` で repo-level secret を即時削除
2. 該当 token を 1Password 側でローテーション
3. workflow yaml に `environment: production` を一時的に復活させ rollback PR を出す
4. インシデント runbook に従い対応

### Case 4: workflow merge 後に他 workflow が同名 secret を参照して挙動が変化

リスクは低い (`CF_AUDIT_*_PROD` 等の専用 prefix が付いている) が、念のため `grep -rn "CF_AUDIT_D1_TOKEN_PROD" .github/workflows/` で他参照箇所を事前確認する手順を Phase 06 に含める。

## CI gate

- 既存 CI (`required_status_checks`) は通常通り通過する必要あり。本 PR は yaml 1 行削除のため typecheck / lint への影響は最小だが、`verify-env-secrets` などのワークフロー検証 gate がある場合は事前に確認する。

## 実行タスク

- [ ] `outputs/phase-05/implementation-plan.md` を作成
- [ ] rollback 計画 4 ケースを記述
- [ ] スケジュールを反映

## 次 Phase

- 次: 6 (実装手順)
- 引き継ぎ事項: Phase A〜F の実行順序、user-gate 境界、rollback case
