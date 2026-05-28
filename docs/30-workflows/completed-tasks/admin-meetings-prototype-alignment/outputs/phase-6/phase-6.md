# Phase 6: Test Expansion

## 6.1 目的

実装時に追加する test surface を Task A/B から漏れなく拾い、既存 attendance 回帰との重複を避ける。
本ワークフロー自体は `spec_created` なので、ここでは実装後に走らせる拡張テストの契約だけを固定する。

## 6.2 実行タスク

1. Task A の `_meetings` focused component/unit spec を追加する。
2. Task B の detail page / attendance panel / CSV import focused spec を必要最小限で更新する。
3. 既存 Playwright `attendance.spec.ts` の data-testid 互換を壊さないことを grep と focused spec で確認する。

## 6.3 参照資料

- `tasks/task-A-meetings-list-redesign.md`
- `tasks/task-B-meeting-detail-alignment.md`
- `outputs/phase-2/phase-2.md`

## 6.4 成果物

| 成果物 | 状態 |
| --- | --- |
| `_meetings/__tests__/meetingStats.spec.ts` | spec_created |
| `_meetings/__tests__/MeetingTimeline.spec.tsx` | spec_created |
| `_meetings/__tests__/MeetingsClientShell.spec.tsx` | spec_created |
| detail route focused specs | spec_created |

## 6.5 統合テスト連携

実装後は `mise exec -- pnpm --filter @ubm-hyogo/web test -- _meetings` と `mise exec -- pnpm --filter @ubm-hyogo/web test -- meetings/\\[id\\]` を実行する。
現サイクルではコード実装を行っていないため runtime 結果は `runtime_pending` とする。

## 6.6 完了条件

- [x] 実装後に追加すべき focused spec が Task A/B に列挙されている。
- [x] data-testid 互換の検証観点が Phase 2/3/6 に重複なく配置されている。
- [x] 現サイクルで実行しない runtime test は user-gated として明示されている。
