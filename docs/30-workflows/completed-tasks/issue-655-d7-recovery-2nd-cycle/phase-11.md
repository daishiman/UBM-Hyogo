# Phase 11 — Evidence (NON_VISUAL)

## 目的

PR-A 完了時点では PR-A local evidence、D'+7 完走後 (PR-B) で recovery evidence を canonical path に保存する。

## Canonical Evidence Paths

### PR-A (今サイクル)

| path | 内容 | 作成 phase |
| --- | --- | --- |
| `outputs/phase-11/evidence/hourly-run-1st-cycle-listing.json` | 1 周目 (Issue #586) hourly run 全件一覧 | Phase 1 |
| `outputs/phase-11/evidence/recovery-rootcause.md` | root cause 分類 + D'+0 候補 | Phase 1 / 9 |
| `outputs/phase-11/evidence/local-verify.log` | typecheck / lint / focused test の local 実行ログ | Phase 7 |
| `outputs/phase-11/evidence/ci-dry-run.md` | PR-A 上の workflow_dispatch dry-run の run URL | Phase 8 |

### PR-B (D'+7 後)

| path | 内容 | 作成 phase |
| --- | --- | --- |
| `outputs/phase-11/evidence/recovery-d-minus-1.log` | D'-1 hourly success 確認 | Phase 10 |
| `outputs/phase-11/evidence/hourly-run-daily-check-recovery.md` | D'+1 / D'+3 / D'+5 daily check | Phase 10 |
| `outputs/phase-11/evidence/hourly-run-7day-recovery.md` | 2 周目 168 hourly run URL 一覧 | Phase 10 |
| `outputs/phase-11/evidence/hourly-run-7day-summary-recovery.json` | aggregate JSON (Phase 3 schema) | Phase 10 |
| `outputs/phase-11/evidence/leakage-grep-7day-recovery.log` | 168 hour 連続 clean log | Phase 10 |
| `outputs/phase-11/evidence/issue-rate-comparison-recovery.md` | baseline + 1 周目 + 2 周目 3 列比較 | Phase 10 |
| `outputs/phase-11/canonical-paths.json` | 上記 path manifest (validator 用) | Phase 11 |

## State 語彙

- PR-A merge 後: canonical state は `runtime_pending`。運用ラベル `recovery_active` を evidence に記録する
- D'+7 集計成功 (PR-B merge 後): `completed`。SSOT の業務状態として `pass_runtime_synced` を記録する
- 2 周目でも失敗時: canonical state は `runtime_pending`。運用ラベル `escalated` を evidence に記録する

## 完了条件

- [ ] PR-A 4 件の runtime-pending evidence template または実 evidence が存在
- [ ] PR-B 7 件 evidence が canonical path に存在
- [ ] `outputs/phase-11/canonical-paths.json` が validator pass
