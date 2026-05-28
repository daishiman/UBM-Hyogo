# Phase 8: Refactoring

## 8.1 目的

`MeetingPanel.tsx` の責務過多を、共有 primitive の追加なしで list 専用 component 群へ分解する。
過剰な抽象化を避け、Task B と衝突しないファイル境界を維持する。

## 8.2 実行タスク

1. Task A は `_meetings` 配下だけを所有し、`MeetingPanel.tsx` の参照を 0 件へ減らす。
2. Task B は `[id]` route 配下だけを所有し、既存 state machine を維持する。
3. 共有 `Drawer` primitive は新設せず、必要なら Task A の drawer component 内で最小実装に留める。

## 8.3 参照資料

- `outputs/phase-2/phase-2.md` §2.2
- `outputs/phase-3/phase-3.md` R5

## 8.4 成果物

| Refactor boundary | 判定 |
| --- | --- |
| `MeetingPanel.tsx` 廃止 | implementation pending |
| `_shared` primitive 追加 | なし |
| API route / D1 schema | 変更なし |

## 8.5 統合テスト連携

refactor 後は `rg -n 'MeetingPanel' apps/web/src apps/web/app` が 0 件であることを確認する。
現サイクルでは仕様として gate を固定し、実測は実装サイクルへ残す。

## 8.6 完了条件

- [x] Task A/B の編集所有範囲が分離されている。
- [x] 共有 primitive 追加を避ける判断が Phase 3 と整合している。
- [x] API / DB 不変境界が維持されている。
