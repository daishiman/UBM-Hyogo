# Phase 8: State 遷移

[実装区分: 実装仕様書]

## 1. 更新対象ファイル

### 1.1 `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md`

| 変更前 | 変更後 |
|--------|--------|
| `implemented_local_runtime_pending / implementation_complete_visual_pending` | `implemented_local_evidence_captured / implementation_complete_visual_evidence_captured` |
| `Playwright visual evidence is not complete because local Next dev cache/report writes repeatedly failed with ENOSPC` | `Playwright visual evidence completed 2026-05-17 via issue-746 workflow. ENOSPC root cause: macOS Library Caches accumulation; resolved by phase-10 runbook.` |
| `\| Screenshot output \| runtime_pending due local ENOSPC \|` | `\| Screenshot output \| completed (12 PNGs) \|` |

### 1.2 `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-12/unassigned-task-detection.md`

該当ファイルが存在する場合のみ:
- `parallel-09-followup-001-playwright-visual-evidence-completion` 行の状態を `unassigned → consumed (issue-746)` に更新

### 1.3 `docs/30-workflows/unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md`

- メタ情報の `ステータス: pending` → `ステータス: consumed (issue-746, 2026-05-17)`
- 末尾に consumed note 追加: `> このタスクは issue-746 workflow (`docs/30-workflows/issue-746-.../`) で消化された。`

## 2. 実行コマンド（差分例）

Phase 8 は Edit ツールで spec/main.md/unassigned-task 各ファイルを編集する想定。一括 sed 化は禁止（context 喪失防止）。

## 3. state 検証

```bash
# main.md に runtime_pending が残っていないこと
! grep -q "runtime_pending" docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md

# unassigned-task が consumed であること
grep -q "consumed (issue-746" docs/30-workflows/unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md
```
