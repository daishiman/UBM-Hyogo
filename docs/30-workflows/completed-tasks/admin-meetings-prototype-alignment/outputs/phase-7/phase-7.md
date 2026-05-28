# Phase 7: Coverage Check

## 7.1 目的

UI 分割後に state owner と純関数の重要分岐が未検証にならないよう、coverage の責務を限定する。
coverage 目標はアプリ全体ではなく、今回新設予定の `_meetings` component 群と detail wrapper に絞る。

## 7.2 実行タスク

1. `computeMeetingStats` の 0 件 / 複数件 / 小数丸めを unit spec で固定する。
2. `MeetingsClientShell` の toast / drawer / attendance error mapping を focused spec で固定する。
3. detail wrapper は state machine を変えず primitive wrapper と breadcrumb contract を snapshot で固定する。

## 7.3 参照資料

- `outputs/phase-1/phase-1.md` AC-A7 / AC-B3 / AC-B4
- `outputs/phase-3/phase-3.md` R1 / R2 / R4

## 7.4 成果物

| Coverage target | 最低条件 |
| --- | --- |
| `meetingStats.ts` | branch 100% 相当の入力パターン |
| `MeetingTimeline.tsx` | empty / non-empty / click |
| `MeetingsClientShell.tsx` | mutation success / 409 / 422 / drawer close |
| detail route | breadcrumb / section wrapper / AdminTable adoption |

## 7.5 統合テスト連携

coverage gate は実装 PR 内で focused Vitest と既存 web test suite に接続する。
現サイクルは仕様作成のみなので、coverage 実測値は `runtime_pending` とする。

## 7.6 完了条件

- [x] coverage 対象が新規・編集予定ファイルに限定されている。
- [x] 既存 API / D1 coverage を本タスクへ混ぜていない。
- [x] runtime 実測未取得を completed と誤記していない。
