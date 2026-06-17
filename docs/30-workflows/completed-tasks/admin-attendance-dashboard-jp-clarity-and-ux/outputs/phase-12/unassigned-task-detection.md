# Phase 12 — 未タスク検出（current / baseline 分離）

> ステータス: `implemented_local_visual_present_staging_pending`。本ファイルは未タスクを **current（本サイクルで残存する未完了証跡）** と **baseline（将来候補・本サイクル対象外）** に分離して記録する。0 件でも出力必須。

---

## 1. current（本サイクルで解消すべき新規未タスク）

**0 件。**

本タスクは apps/web 実装・focused Vitest・token gate・Phase 12 validator・workflow inventory sync まで同一サイクルで完了した（6 canonical local fixture PNG present・authenticated staging baseline は user-gated）。API / D1 / Form / shared 型の変更はなく、残る authenticated staging baseline / commit / PR は user-gated 境界として Phase 11 / Phase 13 に記録済み。current 未タスクは 0 件。

> 6 canonical PNG は local fixture evidence として present。authenticated staging baseline は外部境界のため current 未タスクには計上しない。

---

## 2. baseline（将来候補・本サイクル対象外）

本タスクのスコープ外・将来あり得る軽微改善を baseline 候補として記録する。いずれも本サイクル（文字列リネーム中心の 1 サイクル）では扱わず、将来の別タスクとして起票判断する候補に留める。

| # | 内容 | 種別 | 抵触/理由 | 扱い |
| --- | --- | --- | --- | --- |
| M-2 | staging visual baseline の再取得（`playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts` 等の snapshot） | visual baseline | 文言変更で snapshot 差分が生じ得る。実 capture は user-gated。Phase 4 で要否を判定 | baseline 候補（実装サイクル内で要否判定・本タスクの仕様では未確定） |
| M-3 | 「延べ」表記の更なる平易化（`期間内延べ出席数` の label） | 文言 | J-12 で hint 補足は実施するが label は維持可。さらなる平易化は将来検討 | baseline 候補（未起票・将来別タスク） |
| M-4 | 「テーブル」表記の点検（コンポーネント内に残る場合の平易化） | 文言 | 画面表示テキストに「テーブル」が露出していれば平易化候補。現状の対象 16 ファイルでは画面露出を確認していない | baseline 候補（未起票・実装時に grep 確認・露出なければ非該当） |

> baseline は「将来あり得る軽微改善」として記録するのみ。本サイクルで起票・実装はしない。起票するかは別途ユーザー判断。

---

## 3. 関連タスク差分確認（重複起票防止）

| 関連タスク | 状態 | 本タスクとの差分 | 重複起票リスク |
| --- | --- | --- | --- |
| `admin-attendance-dashboard-ux`（CSS 復旧・landed） | landed | `.attendance-*` CSS 実体の前提。本タスクは文言のみ重ねる | なし（領域分離・本タスクは文言） |
| `completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine`（3 ゾーン階層化・landed） | landed | PRIMARY/TREND/DETAIL の 3 ゾーン構造の前提。本タスクは英語見出しを日本語化 | なし（構造は維持・文言のみ変更） |

> baseline M-2/M-3/M-4 は上記 landed タスクの未完了残件ではなく、本タスクの文言改修に付随して将来検討し得る独立候補。既存 issue / 既存タスクに同一スコープのものは確認していない（実装サイクルで再確認）。

---

## 4. サマリ

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| current（新規未タスク） | **0** | apps/web 実装・ローカル検証・local PNG・workflow inventory sync 完了。authenticated staging baseline / commit / PR は user-gated 境界 |
| baseline（将来候補） | 3 | M-2（visual baseline 再取得）/ M-3（「延べ」表記）/ M-4（「テーブル」表記） |
