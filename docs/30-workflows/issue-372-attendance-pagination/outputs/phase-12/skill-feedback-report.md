# Skill Feedback Report

## テンプレ改善

| Item | Routing | Decision |
| --- | --- | --- |
| spec_created phase files が未存在 outputs を `Source` と書くと実行済みに見える | task-specification-creator | 今回は各 Phase を `Planned output` に補正。skill への恒久反映は不要。 |

## ワークフロー改善

| Item | Routing | Decision |
| --- | --- | --- |
| Phase 11 が Phase 12 runbook を前提にして時系列が逆転 | workflow-local | Phase 2 `cursor-format.md` を実行前提にし、Phase 12 runbook は最終化成果物へ変更。 |
| Phase 4 RED 完了条件に commit が混入 | workflow-local | commit は Phase 13 user approval gate のみへ統一。 |

## ドキュメント改善

| Item | Routing | Decision |
| --- | --- | --- |
| bulk pagination の扱いが「先送り」と「先送りなし」で矛盾 | workflow-local | 明示スコープ外として統一。 |
| apps/web 対象 path が placeholder | workflow-local | `AttendanceList.tsx` と `MemberDrawer.tsx` に具体化。 |
