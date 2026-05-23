# Phase 11: 実装証跡 / evidence path 予約

## 目的

NON_VISUAL タスクとして実装サイクルで取得する evidence の canonical path を予約する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## NON_VISUAL 縮約 3 点

1. 入出力契約: PR diff → 変更 workflow root 列挙 → `outputs/phase-12/phase12-task-spec-compliance-check.md` の存在と heading 9 項目検査 → exit 0/1/2
2. 観測点: stdout の JSON サマリ（`status` / `roots` / `reason`）+ exit code
3. 失敗時挙動: workflow `verify-phase12-compliance` job が fail、PR merge 不可（block）。force merge 必要時は workflow disable または `continue-on-error: true`

## canonical evidence path（実装サイクルで埋める）

| evidence | path |
| --- | --- |
| typecheck log | `outputs/phase-11/evidence/typecheck.log` |
| lint log | `outputs/phase-11/evidence/lint.log` |
| focused test log | `outputs/phase-11/evidence/test.log` |
| local verify run | `outputs/phase-11/evidence/local-verify.log` |
| CI job log（PR）| `outputs/phase-11/evidence/ci-job.log` |
| canonical heading parse log | `outputs/phase-11/evidence/canonical-headings.json` |

## 完了条件

- [ ] local evidence 5 path（typecheck / lint / focused test / local verify / canonical heading parse）を実装サイクルで実体作成し、`ci-job.log` は Phase 13 PR 作成後の user-gated evidence として明示
- [ ] `outputs/phase-11/main.md` に NON_VISUAL 縮約 3 点を記述

## Next Phase

- [Phase 12](phase-12.md): 実装ガイド / SSOT / 未タスク / skill feedback
