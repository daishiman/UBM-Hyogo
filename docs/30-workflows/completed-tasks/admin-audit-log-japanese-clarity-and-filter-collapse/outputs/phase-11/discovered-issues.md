# Phase 11 — スコープ外の発見事項・改善提案

> ステータス: `runtime_pending`（capture user-gated）。本ファイルはスコープ外の発見・改善提案と、visual capture 残件を記録する。

---

## 1. 本サイクルで発見したスコープ外事項（current）

**0 件。**

apps/web 実装と local focused test は完了。staging UI 実描画起因の新規発見は、6 canonical screenshot 未取得のため未判定。設計・要件レビュー（Phase 1〜3）時点で識別済みの「スコープ外」項目は下記 §2 に既知事項として再掲する（新規発見ではない）。

## 2. 既知のスコープ外（_shared-context.md §8 で識別済み・新規発見ではない）

| # | 内容 | スコープ外の理由 | 扱い |
| --- | --- | --- | --- |
| OOS-1 | CSV エクスポート / total 件数表示 | 先行タスクの Future scope 踏襲・本サイクル対象外 | Phase 12 `unassigned-task-detection.md` で baseline 候補として記録 |
| OOS-2 | query param キー名の日本語化 | API 契約のため不可（UI ラベルのみ日本語化） | 恒久制約として記録（対応不能） |
| OOS-3 | 監査ログ以外の admin 画面の同種改善 | 別タスク | Phase 12 `unassigned-task-detection.md` で baseline 候補として記録 |
| OOS-4 | 未登録 action コードの SSOT 網羅 | DB 実データ調査が必要・出現時に未タスク化候補 | Phase 12 baseline 候補（raw fallback で情報欠落は防止済） |

> OOS-1〜OOS-4 はいずれも本タスクのスコープ外であり、未タスク化の判断は Phase 12 で行う（current ではなく baseline 候補）。

## 3. visual capture 残件

| # | 内容 | 状態 |
| --- | --- | --- |
| VIS-1 | `outputs/phase-11/screenshots/` に 6 canonical PNG を保存する | pending（コード実装 + staging admin bearer / user-gated capture が必要） |

## 4. 後続への申し送り

- 実装完了 + 実 capture 時に UI 実描画起因の新規発見があれば、本ファイルに追記する。
- query param キー（`<input name>`）の英語維持は API 契約（AC-9）。日本語化対象は UI 表示ラベルのみであることを実装時に厳守する。
