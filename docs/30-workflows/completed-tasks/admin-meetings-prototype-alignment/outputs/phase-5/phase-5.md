# Phase 5: Implementation

本ワークフローは `implemented_local_evidence_captured / VISUAL_ON_EXECUTION` 状態である。
現サイクルでは Task A/B の apps/web 実装、focused test/typecheck、primitive gate、local Playwright screenshot evidence まで完了している。

- Task A: `tasks/task-A-meetings-list-redesign.md` § Phase 5
- Task B: `tasks/task-B-meeting-detail-alignment.md` § Phase 5

## 5.1 実装境界

| 項目 | 状態 |
| --- | --- |
| Task A/B implementation | `implemented_local` |
| focused Vitest / typecheck / primitive gate | `passed` |
| local authenticated screenshots | `captured` |
| staging authenticated screenshots | `pending_user_approval` |
| commit / push / PR | `pending_user_approval` |

## 5.2 完了条件

- [x] Task A/B の実装手順が実ファイル単位で記録されている。
- [x] 実装後に走らせる verification command が記録されている。
- [x] local runtime evidence を Phase 11 に保存し、staging runtime evidence は user-gated として分離している。
