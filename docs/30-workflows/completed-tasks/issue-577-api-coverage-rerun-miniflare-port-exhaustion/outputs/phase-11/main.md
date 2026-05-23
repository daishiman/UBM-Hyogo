# Phase 11 — runtime evidence 取得（rerun 実行・log 保存・triage 実施）

Status: COMPLETED
Date: 2026-05-09
Workflow: issue-577-api-coverage-rerun-miniflare-port-exhaustion

## 1. サマリ

`mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` の baseline rerun を 3 回実施したところ全て EADDRNOTAVAIL を再現（23 / 38 / 51 件）。Phase 1 失敗率 gate により triage 採用フローへ強制遷移し、Phase 3 matrix の **軸 B（`--maxWorkers=1 --minWorkers=1`）で 133/133 PASS / 0 EADDRNOTAVAIL** を確認した。最小侵襲の patch を `apps/api/package.json#scripts.test:coverage` に適用し、post-patch rerun でも PASS を再確認（133/133・0 EADDR・506s）。

## 2. 環境

`evidence/env-snapshot.txt` 参照。Node v24.15.0 / pnpm 10.33.2 / Darwin 25.3.0 / port range 49152-65535。

## 3. 結果表

| 種別 | exit_code | EADDRNOTAVAIL count | duration_sec | log path |
| --- | --- | --- | --- | --- |
| baseline rerun 1 | 1 | 23 | 200 | `evidence/baseline-rerun-1.log` |
| baseline rerun 2 | 1 | 38 | 140 | `evidence/baseline-rerun-2.log` |
| baseline rerun 3 | 1 | 51 | 111 | `evidence/baseline-rerun-3.log` |
| triage 軸 B | 0 | 0 | 567 | `evidence/triage-matrix-maxWorkers-1.log` |
| post-patch full rerun | 0 | 0 | 506 | `evidence/full-coverage-rerun.log` |

## 4. 採用判断

- **軸 B（`--maxWorkers=1 --minWorkers=1`）採用**。
- 適用先: `apps/api/package.json` の `scripts.test:coverage` に `--maxWorkers=1 --minWorkers=1` を追加（最小差分）。
- `vitest.config.ts` は編集せず、`apps/web` / `packages/*` への副作用ゼロ。

## 5. 後続 Phase

- Phase 5: 採用軸 B のスケルトン → 実コード patch 確定済み。
- Phase 6: helper script `scripts/api-coverage-rerun.sh` は採用 skip（手動 baseline+matrix で目的達成済みのため、CONST_009 の例外条件を理由化せず実コード追加せず。再発時は Phase 8 runbook に従い手動 or 別 Issue で導入判断）。
- Phase 9: Issue #532 完了タスク Phase 11 / 12 へ same-wave sync 追記（本 Phase 完了で実施可）。
- Phase 12: implementation-guide / strict 7 outputs を実測値で上書き。

## 6. evidence 一覧

| path | 役割 |
| --- | --- |
| `evidence/env-snapshot.txt` | 環境固定 |
| `evidence/baseline-rerun-1.log` | baseline 1（FAIL, EADDR=23） |
| `evidence/baseline-rerun-2.log` | baseline 2（FAIL, EADDR=38） |
| `evidence/baseline-rerun-3.log` | baseline 3（FAIL, EADDR=51） |
| `evidence/triage-matrix-maxWorkers-1.log` | 軸 B（PASS, EADDR=0） |
| `evidence/full-coverage-rerun.log` | post-patch verification（PASS, EADDR=0） |
| `evidence/triage-summary.md` | matrix 結果表 + 採用判断 + root cause hypothesis |
| `evidence/typecheck.log` | post-patch typecheck（PASS） |
| `evidence/lint.log` | post-patch lint（PASS） |

## 7. DoD

- [x] env-snapshot.txt が固定されている。
- [x] baseline rerun 3 件の log が保存されている。
- [x] 再現 matrix log と triage-summary.md が完成している。
- [x] 採用判断が main.md に記録されている。
- [x] post-patch typecheck / lint log が保存されている。
