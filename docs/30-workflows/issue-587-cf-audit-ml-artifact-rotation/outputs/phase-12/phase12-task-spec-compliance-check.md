# Phase 12 Task Spec Compliance Check — Issue #587

## 4 条件チェック

| 条件 | 確認内容 | 判定 | 根拠 |
| --- | --- | --- | --- |
| 矛盾なし | 13 phase の AC / DoD / 不変条件が衝突していない | implemented_local_runtime_pending | local scripts / workflow / evidence を同一 wave に再分類し、production promotion のみ Gate-R0〜R3 + user approval pending と分離 |
| 漏れなし | strict 7 file 実体配置 / canonical evidence path / SSOT 3 ファイル / aiworkflow indexes / LOGS / unassigned 4 件 | implemented_local_runtime_pending | `outputs/phase-12/` に 7 file、Phase 11 evidence 7 file、root/outputs `artifacts.json`、runbook contract、SSOT 3 ファイル、未タスク 4 件を same-wave で配置 |
| 整合性 | 状態語彙が `implemented_local_runtime_pending` / `completed_local_evidence` / `blocked_pending_user_approval` で統一 / `PASS` 単独表記なし | implemented_local_runtime_pending | root state は `implemented_local_runtime_pending`、Phase 11 は local evidence captured、Phase 13 は `blocked_pending_user_approval` |
| 依存関係整合 | 親 #549 / #515 / 起票元 unassigned-task / `secret-leakage-grep.ts` / canary workflow CLI 参照リンク | implemented_local_runtime_pending | workflow は Node 24 `--experimental-strip-types` で canary CLI / collector を直接実行し、R3 gate は previous artifact + rollback owner の両方を要求 |

## Implementation evidence path 状態揃え checklist

| # | path | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-11/evidence/typecheck.log` | CAPTURED_LOCAL exit_code=0 |
| 2 | `outputs/phase-11/evidence/lint.log` | CAPTURED_LOCAL exit_code=0 |
| 3 | `outputs/phase-11/evidence/test.log` | CAPTURED_LOCAL 19 / 19 pass |
| 4 | `outputs/phase-11/evidence/canary-dry-run.json` | CAPTURED_LOCAL fixture replay / verdict=`candidate_pass` |
| 5 | `outputs/phase-11/evidence/rotation-evidence.json` | CAPTURED_LOCAL / R3 approval false / promotion blocked |
| 6 | `outputs/phase-11/evidence/leakage-grep.log` | CAPTURED_LOCAL exit_code=0 |
| 7 | `outputs/phase-11/evidence/dataset-grep.log` | CAPTURED_LOCAL exit_code=0 |

## artifacts.json parity 文言（再掲）

> root `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。本サイクルでは scripts / canary workflow / local evidence を実装済みとして記録し、production artifact promotion のみ Gate-R0〜R3 + user approval pending として分離する。

## 総合判定

`implemented_local_runtime_pending` close-out。`PASS` / `verified` 単独表記は使用していない。local canary は fixture replay で取得済み、production promotion は Gate-R0〜R3 のため別承認で完結する。
