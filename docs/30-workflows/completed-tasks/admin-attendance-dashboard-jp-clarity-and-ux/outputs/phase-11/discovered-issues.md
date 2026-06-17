# Phase 11 発見事項 — admin-attendance-dashboard-jp-clarity-and-ux

> Phase 11（手動テスト）で発見した、本タスクのスコープ外の改善余地・気づきを記録する。
> 6 canonical PNG capture は local Playwright admin fixture で取得済み。authenticated staging baseline capture は user-gated のため、staging 実機差分起点の発見のみ未取得。ここでは仕様レビュー時点の気づきを baseline 候補として記録する。
> HIGH 判定があれば `unassigned-task/` へ自動生成する。本タスクでは HIGH なし。

## 1. 発見事項一覧

| ID | 重大度 | 内容 | 区分 | 対応 |
| --- | --- | --- | --- | --- |
| D-1 | MINOR | visual snapshot テスト（`apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts`）は文言変更で baseline 差分を生む可能性。実装サイクルで baseline 再取得が必要 | テスト運用 | 実装サイクル / Phase 13 で baseline 再取得（user-gated）。Phase 12 unassigned-task-detection の baseline 候補 M-2 と同一 |
| D-2 | MINOR | `期間内延べ出席数` の「延べ」は会計用語的。hint で補足する案（J-12）。完全置換は任意 | 文言 | Phase 5 実装時に最終判断。baseline 候補 M-3 |
| D-3 | MINOR | `くわしい一覧` の補助文に残る「テーブル」を「一覧」へ寄せる任意改善 | 文言 | Phase 5 実装時に判断。baseline 候補 M-4 |
| D-4 | INFO | `AttendanceDrilldownModal`（出席詳細 modal）は既に平易な日本語のため本タスクでは変更不要 | スコープ確認 | 対応不要（スコープ外として確認済み） |

## 2. HIGH 判定の有無

- HIGH 判定: **なし**。`unassigned-task/` への自動生成は行わない。
- MINOR（D-1〜D-3）は Phase 12 `unassigned-task-detection.md` の baseline 候補として記録する（current は local implementation / screenshot evidence 完了につき 0 件）。

## 3. スコープ境界の再確認

- 3 ゾーン構造の作り替え・カード配置変更・チャート表現刷新は Q3（微調整）によりスコープ外。Phase 11 でも構造変更は提案しない。
- 新 endpoint を要する集計はスコープ外（invariant #1 違反）。
