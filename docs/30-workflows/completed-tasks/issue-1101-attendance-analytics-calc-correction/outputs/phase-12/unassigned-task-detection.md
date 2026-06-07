# 未タスク検出（issue-1101-attendance-analytics-calc-correction）

Phase 12 Task 4。current（本タスク由来の新規未タスク候補）と baseline（既存違反）を分離して記録する。
automation-30 再検証により、設計時の M-1 / M-2 は今回サイクル内で解消または設計判断として完了したため、current 未タスクは 0 件とする。

## current（本タスク由来の未タスク候補）

| ID | 候補 | 分類 | 判断 | 起票判断 |
| --- | --- | --- | --- | --- |
| M-1 | API filter parse 層（`apps/api/src/lib/parse-attendance-filter.ts`）での旧 bookmark URL（`?zone=0→1` 等）の救済 | improvement / 後方互換 | 今回サイクル内で実装済み。旧矢印値は API query parser と web query reader で新キーへ正規化する | **起票なし（解消済み）** |
| M-2 | zone distribution の `zone_100_plus` 行を count===0 でも常時表示するか、count>0 のときだけ間引くか | improvement / UI 判断 | 設計判断として「全正常帯は常時表示・`unknown` のみ分類不能のため count>0 表示」を採用。`zone_100_plus` は正常帯なので空バー表示も凡例として意味がある | **起票なし（設計判断で完了）** |

> current 未タスクは 0 件。CONST_005 に従い、検出事項を今回サイクル内で修正または設計判断として閉じた。新規 unassigned-task 物理ファイル作成・GitHub Issue 起票は行わない。

## baseline（既存違反・本タスク非由来）

| 項目 | 内容 |
| --- | --- |
| baseline 違反 | 本タスクのスコープ（出席分析 repository / shared schema / web label）内に、本タスク由来でない既存 unassigned-task 違反は検出なし |
| baseline remediation 参照 | なし（本スコープに紐づく既存 remediation task は存在しない） |

current と baseline は混同しない。current = 0（M-1/M-2 は解消済みまたは設計判断完了）。baseline = 0（本スコープに既存違反なし）。

## 関連タスク差分確認（既存 issue / workflow との重複チェック）

| 関連 | 関係 | 重複判定 |
| --- | --- | --- |
| `admin-attendance-dashboard-ux`（#1108 merged） | 親タスク。UI/UX レイアウト是正は完了済み。本タスクはその Phase 12 で検出された計算意味論残課題を formalize | **重複なし**（親は CSS/レイアウト、本タスクは計算意味論。関心が分離） |
| issue #1101 | 本タスクの source issue（CLOSED のまま） | 本タスクが該当 issue を仕様書化。状態変更なし |
| M-1（parse 層旧値救済） | 既存 issue / unassigned-task に同等候補が存在するか | **重複なし / 解消済み**（今回サイクルで実装） |
| M-2（zone_100_plus 常時表示） | 既存 issue / unassigned-task に同等候補が存在するか | **重複なし / 設計判断完了**（正常帯は常時表示） |
| 別ドメイン UBM 成長フェーズ zone | `byZone.ts` / `AboutUbm.tsx` / `MemberFilters.client.tsx` / `SelectedFiltersBar.client.tsx` | **本タスク非対象**（`AttendanceZone` 型を import しない別概念。Phase 9 grep gate で touch ゼロを保証。未タスク化不要） |

## サマリー

- 今回タスク由来の新規未タスク候補: **0 件**（M-1 は実装済み、M-2 は設計判断で完了）
- baseline 違反: 0 件（本スコープに既存 remediation task なし）
- 関連 issue / workflow との重複: なし
