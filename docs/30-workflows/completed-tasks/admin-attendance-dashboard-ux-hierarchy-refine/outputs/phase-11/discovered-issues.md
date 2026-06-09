# Phase 11 — スコープ外の発見事項・改善提案

> ステータス: `pending_visual_capture`。本ファイルはスコープ外の発見・改善提案と、visual capture 残件を記録する。

---

## 1. 本サイクルで発見したスコープ外事項

**0 件。**

実装・ローカル機械検証は完了済み。UI 実描画起因の新規発見は、8 canonical screenshot 未取得のため未判定。設計・要件レビュー（Phase 1〜3）時点で識別済みの「スコープ外」項目は下記 §2 に既知事項として再掲する（新規発見ではない）。

## 2. 既知のスコープ外（Phase 1〜3 で識別済み・新規発見ではない）

| # | 内容 | スコープ外の理由 | 扱い |
| --- | --- | --- | --- |
| OOS-1 | 会員ごとの直近 N 回セッション出席フラグの一覧表示 | 新 endpoint / 集計が必要で API 変更を伴う（AC-7 / ui-prototype invariant #1 違反） | Phase 12 `unassigned-task-detection.md` で baseline 候補として記録 |
| OOS-2 | 月別「出席率」=延べ÷(セッション×総員) のサーバ集計 | 新 endpoint / D1 集計が必要で API 変更を伴う | Phase 12 `unassigned-task-detection.md` で baseline 候補として記録 |

> OOS-1 / OOS-2 はいずれも本タスクのスコープ外であり、未タスク化の判断は Phase 12 で行う（current ではなく baseline 候補）。

## 3. visual capture 残件

| # | 内容 | 状態 |
| --- | --- | --- |
| VIS-1 | `outputs/phase-11/screenshots/` に 8 canonical PNG を保存する | pending（staging admin bearer / user-gated capture が必要） |

## 4. 後続への申し送り

- 実 capture 時に UI 実描画起因の新規発見があれば、本ファイルに追記する。
- MINOR M-1 / M-2 / M-3 はスコープ内の追跡事項であり、本ファイル（スコープ外発見）には記載しない（Phase 10 main.md / Phase 12 documentation-changelog で追跡）。
