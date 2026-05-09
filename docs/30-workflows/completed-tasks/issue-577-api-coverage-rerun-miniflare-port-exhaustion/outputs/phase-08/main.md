# Phase 08 — runbook / evidence manifest / 30day-contract / 失敗率 gate

Status: COMPLETED
Date: 2026-05-09

## 1. 簡易 runbook（再発時手順）

### 1.1 再発検知

- CI または local で `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` 実行時に `EADDRNOTAVAIL` を含む test fail を観測。

### 1.2 対応

1. ローカル ephemeral port range / TIME_WAIT 蓄積を緩和するため、各 rerun 間に **10 秒 sleep**。
2. baseline rerun を 3 回実行:
   ```bash
   bash scripts/api-coverage-rerun.sh baseline --count=3
   ```
   または手動で:
   ```bash
   for i in 1 2 3; do mise exec -- pnpm --filter @ubm-hyogo/api test:coverage; sleep 10; done
   ```
3. 1 回でも EADDRNOTAVAIL が再現したら matrix 軸を **B → A → C → D** の順で実行:
   ```bash
   bash scripts/api-coverage-rerun.sh matrix --axis=B --value=maxWorkers=1
   bash scripts/api-coverage-rerun.sh matrix --axis=A --value=pool=forks
   bash scripts/api-coverage-rerun.sh matrix --axis=C --value=no-file-parallelism
   bash scripts/api-coverage-rerun.sh matrix --axis=D --value=shard=1/2
   bash scripts/api-coverage-rerun.sh matrix --axis=D --value=shard=2/2
   ```
4. PASS が得られた最小侵襲軸を採用し、Phase 5 patch を適用。
5. 採用後 1 回 rerun し `full-coverage-rerun.log` として保存。

### 1.3 採用判断

| 結果 | 採用 |
| --- | --- |
| baseline 3 回連続 PASS | no-code verification close-out（patch なし） |
| 軸 B PASS | `apps/api/package.json` に `--maxWorkers=1 --minWorkers=1` 追加 |
| 軸 A PASS | `apps/api/package.json` に `--pool=forks` 追加 |
| 軸 C PASS | `apps/api/package.json` に `--no-file-parallelism` 追加 |
| 軸 D PASS | shard 戦略採用は別 Issue 候補として escalate |
| 全軸 FAIL | 30day-contract で持ち越し、`unassigned-task` へ |

## 2. evidence manifest

| 種別 | path | 必須 |
| --- | --- | --- |
| 概要 + 採用判断 | `outputs/phase-11/main.md` | yes |
| 環境 snapshot | `outputs/phase-11/evidence/env-snapshot.txt` | yes |
| baseline log（3 件） | `outputs/phase-11/evidence/baseline-rerun-{1,2,3}.log` | yes |
| 最終採用 log | `outputs/phase-11/evidence/full-coverage-rerun.log` | yes |
| triage summary | `outputs/phase-11/evidence/triage-summary.md` | yes |
| matrix log | `outputs/phase-11/evidence/triage-matrix-<axis>-<value>.log` | 再現時のみ |

## 3. 30day-contract 判定ロジック

- **適用条件**: 本タスク 1 サイクル内で matrix 全軸が再現不安定（PASS / FAIL が log で混在）または baseline / matrix 双方で再現が確定しないケース。
- **適用結果**:
  - `docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` に schedule feedback として残し、30 日以内に 3 回以上の再発があれば Issue を再起票し恒久対応に格上げする。
  - 失敗率の計測は CI 側で `EADDRNOTAVAIL` の grep 件数を週次で集計（別 Issue 候補）。
- **非適用**: baseline 3 回連続 PASS、または matrix で安定 PASS 軸が確定したケース。

## 4. 失敗率 gate

- **trigger**: rerun 3 回中 1 回でも EADDRNOTAVAIL を観測した時点で triage 採用フローへ強制遷移（Phase 1 しきい値表と整合）。
- **再発閾値**: 同一 host で 30 日以内に EADDRNOTAVAIL 再現が 3 回以上 → Issue 再起票。
- **measurement**: log 末尾の `eaddrnotavail_count` を機械集計可能。
