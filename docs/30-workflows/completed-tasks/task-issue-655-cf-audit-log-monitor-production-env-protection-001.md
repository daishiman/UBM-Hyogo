# issue-655 cf-audit-log-monitor production environment 保護解除ゲート

## メタ情報

```yaml
issue_number: 720
parent_issue: 655
github_issue_url: https://github.com/daishiman/UBM-Hyogo/issues/720
parent_workflow: docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/
discovered_phase: phase-12-unassigned-task-detection
gate_type: external-governance-mutation
priority_label: priority:high
```

| 項目         | 内容                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| タスクID     | task-issue-655-cf-audit-log-monitor-production-env-protection-001                                                   |
| タスク名     | `cf-audit-log-monitor.yml` の `dev` ブランチ実行を阻んでいる GitHub `production` environment 保護ルールの解放/再設計 |
| 分類         | external-governance-operation / user-gated                                                                          |
| 対象機能     | `.github/workflows/cf-audit-log-monitor.yml`（毎時 audit log snapshot）                                             |
| 優先度       | High（D'+0 起点で hourly snapshot が止まり続けると 2nd cycle 自体が成立しない）                                     |
| 見積もり規模 | 小〜中規模                                                                                                          |
| ステータス   | consumed_via_issue_720_followup_spec（採用方針 B'：read-only monitor から `environment: production` を外し、repo-level secret/variable mirror は user-gated） |
| 発見元       | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/outputs/phase-12/unassigned-task-detection.md`                  |
| 発見日       | 2026-05-15                                                                                                          |

---

## Consumed Status

This historical unassigned task has been consumed by
`docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/` and moved out of
`unassigned-task/` to prevent rediscovery as open work.

Executable current plan:

- Adopted plan: 案B' (`environment: production` removal + repository-level mirror for read-only / notification-only monitor credentials).
- Do not execute the older A/B/C environment mutation plan below.
- Do not change GitHub production environment branch policies.
- Runtime evidence, repository secret / variable mirroring, push, PR, D'+0 declaration, and cleanup remain user-gated.

The sections below are retained as historical discovery context only.

## 1. 概要

> 2026-05-16 同期: 本タスクは `docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/` に消費された。production environment の branch policy は変更せず、read-only monitor workflow から `environment: production` を外す最小実装に再構成した。repo-level secrets / variables の投入、push、PR、runtime evidence は user-gated のまま残す。

issue-655 D'+7 recovery 2nd cycle の前提となる毎時 audit log snapshot ワークフロー `cf-audit-log-monitor.yml` が、GitHub `production` environment の branch 保護ルール (`Branch dev is not allowed to deploy to production due to environment protection rules`) によって `dev` ブランチからの実行を阻まれており、最新 run `25887044451` も `failure` で終了している。これを解消しないと recovery 2nd cycle 期間中に snapshot が再び欠落し、`actualSnapshots = 168` を満たせず `pass_runtime_synced` 昇格が不可能になる。

このタスクは、phase-12 unassigned-task-detection で唯一明示された外部 governance mutation 課題であり、production environment 保護トポロジーを変更するため user 承認が必須。

## 2. 背景

- issue-586 で `cf-audit-log-monitor.yml` を `production` environment 配下に置く設計を採用済み（secrets 隔離目的）
- その後の branch protection 厳格化により、`dev` ブランチから `production` environment を参照する job が deploy 扱いとなり拒否されるようになった
- read-only な hourly snapshot 用途であっても同じ environment を共有しているため巻き添えで失敗
- recovery 2nd cycle の D'+0 起算（user 承認時点）後 168 時間の snapshot 取得が runtime 必須前提

## 3. 目的

`dev` ブランチで `cf-audit-log-monitor.yml` の hourly snapshot run が 168 連続成功できる構成を、production deploy 経路の安全性を維持したまま再構築する。

## 4. スコープ

### 含むもの (in)

- 現行 `production` environment の `branch policy` / `required reviewers` / `wait timer` の read-only inventory（`gh api` で diff evidence 取得）
- 採用方針の選択肢提示と user による意思決定の record（下表 3 案のいずれか / 別案）
  - A: `production` environment の allowed branch に `dev` を追加（最小変更・production 保護の弱体化を伴う）
  - B: `cf-audit-log-monitor.yml` を `production` から外し別 environment（例: `monitor-readonly`）に移設
  - C: 専用 read-only monitor environment を新設し、secrets を限定再配布
- 採用案に基づく `gh api -X PUT` / `.github/workflows/cf-audit-log-monitor.yml` の差分プラン
- 適用後の runtime 検証（連続 6 時間 snapshot 成功 + 1 件以上の 200 OK run URL）
- D'+0 再起算とその evidence の `outputs/phase-11/evidence/` 反映

### 含まないもの (out)

- D'+7 集計 (`cf-audit-log-7day-summary.yml`) 自体の挙動修正（PR-A で完了済み）
- recovery aggregation 結果の `pass_runtime_synced` 昇格 (PR-B 範疇)
- secrets / variable の値変更（必要が判明した時点で別 followup を切り出す）

## 5. 苦戦箇所として想定される観点

| 項目                       | 内容                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| environment 保護の同心円構造 | `production` environment 1 つに「deploy 系」「read-only 監視系」が混在しており、片方を緩めると deploy 系の保護も同時に弱体化する。粒度を分離する判断が要点 |
| user-gate 境界             | Claude 自律で `gh api -X PUT repos/:owner/:repo/environments/production` を発火しない。read-only `gh api -X GET` は事前 evidence として取得可        |
| recovery D'+0 起算         | environment 解放と D'+0 起算が同一トランザクションでないと、解放前の snapshot 欠落が D'+0 ウィンドウに混入する                                       |
| secrets の再配布           | 案 B/C を採用すると monitor 用 secrets を別 environment に再展開する必要があり、1Password / Cloudflare Secrets / GitHub Secrets の三重整合が必要      |
| 同様課題の再発防止         | 監視系 workflow と deploy 系 workflow の environment 共有は将来も発生するので、今回の選択を ADR 化しないと同じ判断が再度必要になる                  |

## 6. リスクと対策

| リスク                                                              | 影響度 | 発生確率 | 対策                                                                                                          |
| ------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| 案 A 採用で production deploy 経路の保護が弱体化                    | 高     | 中       | 案 B/C を default 候補として提示し、案 A を採用する場合は最小スコープの allowed branch のみに限定              |
| 解放後も別の保護ルール（required reviewers 等）で hourly が止まる   | 中     | 中       | 適用前 inventory と適用後 6h 連続成功 evidence の取得を完了条件に含める                                       |
| environment 切替時に secrets 欠落で snapshot が 401/403 で fail     | 高     | 中       | 案 B/C の場合は secrets 再配布手順を本タスクの実行手順に組み込み、適用直後の dry run で検証                   |
| 変更が他 workflow（deploy / rollback）に副作用                      | 中     | 低       | `gh api repos/:owner/:repo/actions/workflows` で `production` environment 参照 workflow を列挙し影響面を明示  |
| recovery D'+0 を解放前に起算してしまい snapshot 欠落が混入          | 高     | 低       | 解放適用と D'+0 起算を 1 PR 内 / 同一 commit で記録し、`outputs/phase-11/evidence/` に timestamp evidence 配置 |

## 7. 検証方法

### 受け入れ基準

- 採用案が user 承認の record とともに本仕様書に追記されている
- `gh api repos/daishiman/UBM-Hyogo/environments/<env>` の before/after JSON が evidence として保存されている
- `cf-audit-log-monitor.yml` の最新 6 連続 run が `success` であり run URL が evidence に列挙されている
- `outputs/phase-11/evidence/recovery-rootcause.md` の root cause が「resolved」に更新されている
- D'+0 timestamp が evidence に明記され、その後 168h snapshot 取得カウンタが開始している
- 同一課題再発防止のための ADR / runbook 追記がある（最低限 `15-infrastructure-runbook.md` に operation note 追加）

### 検証手順

1. read-only inventory: `gh api repos/daishiman/UBM-Hyogo/environments/production` を実行し JSON evidence 化
2. workflow 影響面列挙: `production` environment を参照する workflow を `grep -rn "environment: production" .github/workflows/`
3. user に案 A/B/C/別案を提示し選択を record
4. 適用 PR を作成（branch protection 経由）し user 承認後に merge
5. `gh workflow run cf-audit-log-monitor.yml --ref dev` を発火 → 1 件成功を確認
6. 1 時間ごとに 6 連続 success を確認 → run URL を evidence 化
7. D'+0 を起算しその timestamp を `outputs/phase-11/evidence/d-zero.md` に記録
8. `recovery-rootcause.md` に resolved status を追記

## 8. 依存関係

| 依存元                                                                          | 依存内容                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/`                            | parent workflow（PR-A 実装は local 完了済 / runtime 起動条件本タスク） |
| `.github/workflows/cf-audit-log-monitor.yml`                                    | 解放対象 workflow                                                 |
| `.github/workflows/cf-audit-log-7day-summary.yml`                               | 集計 workflow（D'+7 起点が本タスク完了に依存）                    |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`             | 運用手順書（ADR 追記先）                                          |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | aiworkflow ledger（解決後の status 同期先）                       |

## 9. user-gate / 不可逆操作リスト

以下は Claude 自律で実行禁止。user 明示承認が必要。

- `gh api -X PUT repos/:owner/:repo/environments/*`（保護ルール変更）
- `gh api -X DELETE repos/:owner/:repo/environments/*`
- environment secrets の追加 / 削除
- `cf-audit-log-monitor.yml` の environment 参照行の commit / push
- `D'+0` 起算宣言 commit

## 10. 完了条件 (DoD)

- 受け入れ基準 7 項目すべて充足
- 採用案の ADR / 運用 note が `15-infrastructure-runbook.md` に追記されている
- aiworkflow ledger（observability-monitoring.md）に status: resolved が反映
- parent workflow `outputs/phase-11/evidence/` に D'+0 と 6h smoke evidence が配置
- 本仕様書ステータスが `completed` に更新され `completed-tasks/` に移送されている

## 11. Phase 12: 中学生レベル概念説明

GitHub には「production 部屋」という鍵付きの部屋があって、その鍵は「main ブランチの人」しか持っていない設定になっています。今回、毎時 1 回見守りログを撮る係（`cf-audit-log-monitor.yml`）も、たまたまこの「production 部屋」に置かれていたため、`dev` ブランチから動かそうとすると鍵が無くて入れず、ログが撮れない状態が続いています。

このタスクでは、(A)「dev ブランチの人にも入室許可を出す」(B)「見守り係だけ別の部屋に移す」(C)「見守り係専用の小さい部屋を新しく作る」のどれにするかをまず決めて、決めたとおりに鍵の設定を直し、本当に毎時ログが撮れるようになったかを 6 時間連続で確認する、という手順を踏みます。直接「鍵を全部開ける」ような乱暴な変更は禁止です。

## 12. 関連リンク

- parent: `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/index.md`
- 検出元: `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/outputs/phase-12/unassigned-task-detection.md`
- evidence root: `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/outputs/phase-11/evidence/recovery-rootcause.md`
- aiworkflow inventory: `.claude/skills/aiworkflow-requirements/references/workflow-issue-655-d7-recovery-2nd-cycle-artifact-inventory.md`
- 運用 runbook: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
