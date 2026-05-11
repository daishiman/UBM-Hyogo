# Phase 2: 既存実装調査（#549 成果 / workflow / runbook / leakage grep）

## 目的

親 Issue #549（production ML switch）と上位親 #515（ML-ready abstraction）で実装済みの成果物・既存 workflow・runbook・leakage grep を棚卸しし、本タスクで **新規追加** / **流用** / **編集** の 3 区分に振り分ける。重複実装を防ぎ、forward-safe 設計の境界を明確にする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 棚卸し対象

### 1. 親 #549 で実装済み（流用）

| ファイル | 役割 | 本タスクでの扱い |
| --- | --- | --- |
| `scripts/cf-audit-log/observation/post-switch-monitor.ts` | hourly JSON snapshot 集計 | 流用（promotion 後の hourly run で `classifier_version` 切替確認に使用） |
| `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | fallback rate 閾値超で Issue 起票 | 流用（promotion 後の rollback トリガとして連動） |
| `.github/workflows/cf-audit-log-monitor.yml` | hourly run | 参照のみ（本タスクで編集しない。canary は別 workflow） |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rollback runbook（env 戻し） | 編集（rotation セクション追記。env 戻しの隣に artifact 戻しを並置） |

### 2. 上位親 #515 で実装済み（流用）

| ファイル | 役割 | 本タスクでの扱い |
| --- | --- | --- |
| `scripts/cf-audit-log/classifier/ml.ts` | ML classifier skeleton（`ML_MODEL_PATH` load） | 流用（candidate path を渡せるよう既存 interface のまま） |
| `scripts/cf-audit-log/classifier/index.ts` | Classifier 抽象 | 参照のみ |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | leakage grep gate | **流用**（`artifact-canary.ts` 内から呼出。再実装禁止） |
| `apps/api/migrations/0016_cf_audit_log_classification.sql` | D1 forward-safe 列追加 | 参照のみ。`classifier_version` 列を rotation で利用する旨を SSOT に追記 |

### 3. SSOT（編集）

| ファイル | 編集内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | rotation telemetry（candidate evaluation / canary / promotion / rollback の 4 段）+ canary evidence JSON schema |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `..._CANDIDATE` op 参照新設の追記。`..._PROD` の rotation 手順 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rotation セクション追記。runbook 本体（`docs/30-workflows/runbooks/ml-model-artifact-rotation.md`）への相互リンク |

### 4. 新規追加

| ファイル | 役割 |
| --- | --- |
| `scripts/cf-audit-log/rotation/artifact-canary.ts` | candidate を staging で load + offline replay + leakage grep |
| `scripts/cf-audit-log/rotation/rotation-evidence-collector.ts` | canary / baseline / rollback evidence の JSON 集約 |
| `scripts/cf-audit-log/rotation/__tests__/artifact-canary.test.ts` | canary focused test |
| `scripts/cf-audit-log/rotation/__tests__/rotation-evidence-collector.test.ts` | evidence collector focused test |
| `.github/workflows/cf-audit-log-artifact-canary.yml` | `workflow_dispatch` 起動 canary |
| `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` | rotation runbook 本体 |

## 重複防止 / 流用方針

- `secret-leakage-grep.ts` は本タスクで **再実装しない**。`artifact-canary.ts` から `child_process.spawnSync` または直接 import で呼出。`--exit-on-detect` オプションが既存実装にない場合のみ #549 で追加済みのものを利用する（#549 完了済み前提）。
- `post-switch-monitor.ts` と `fallback-rate-alert.ts` は promotion 後の運用で連動させるが、本タスクで **編集しない**。
- `cf-audit-log-monitor.yml` の hourly run は **編集しない**。canary は `cf-audit-log-artifact-canary.yml`（新規 workflow）に分離する。

## ギャップ（本タスクで埋める必要があるもの）

- candidate path を input に取る workflow が存在しない（`workflow_dispatch` + `inputs.candidatePath`）
- candidate を staging で load する dry-run script が存在しない
- canary 結果と baseline を 1 ファイルに集約する evidence collector が存在しない
- rotation 専用 runbook（4 段）が存在しない
- `..._CANDIDATE` op 参照が deployment-secrets-management に登録されていない
- raw feature dataset 不混入の grep evidence 手順が SSOT に明記されていない

## 完了条件

- [ ] 流用 / 編集 / 新規追加の 3 区分が確定
- [ ] 既存 leakage grep / classifier ml の interface を変更しない方針を明記
- [ ] canary workflow を hourly workflow から分離する方針を明記
- [ ] ギャップが Phase 3-6 の設計入力として整理されている

## 参照資料

- `index.md`
- `phase-01.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/index.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/index.md`

## 統合テスト連携

- Phase 9 で `artifact-canary.ts` の focused test、`rotation-evidence-collector.ts` の focused test、leakage grep 流用 test を計画する。

## 出力

- `outputs/phase-02/main.md`（流用 / 編集 / 新規追加 3 区分の表 + ギャップ list）

## Next Phase

- [Phase 3](phase-03.md): 設計
