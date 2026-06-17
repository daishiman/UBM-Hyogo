# Phase 12 — 未タスク検出（current / baseline 分離）

> ステータス: `completed`。本ファイルは未タスクを **current（本サイクルで対応すべき新規未タスク）** と **baseline（将来候補・本サイクル対象外）** に分離して記録する。0 件でも出力必須。新規 Issue 起票は行わない（仕様書作成のみ）。

---

## 1. current（本サイクルで対応すべき新規未タスク）

**0 件。**

本タスクのスコープ（監査ログの日本語化 + フィルタ段階開示 + カード整列）は、表現層 1 サイクルで完結する仕様として Phase 1〜10 で確定済み。AC-1〜AC-12 はすべて表現層内で充足観点が整理され、新 endpoint / D1 / Form 変更を要する残件は current には存在しない。

> 実装サイクルで未登録 action コードが UI に出現した場合は、`describeAuditAction` の raw fallback で情報欠落を防いだうえで、SSOT（`AUDIT_ACTION_LABELS`）への追記を baseline（OOS-4）として扱う。これは current の新規未タスクではない。

---

## 2. baseline（将来候補・本サイクル対象外）

`_shared-context.md` §8 の「スコープ外（OOS）」項目を baseline 候補として記録する。本サイクルでは扱わず、将来の別タスクとして起票判断する候補に留める（本ファイルでは起票しない）。

| # | 内容 | 必要な変更 | 抵触する不変条件 | 扱い |
| --- | --- | --- | --- | --- |
| OOS-1 | CSV エクスポート / total 件数表示 | 新 endpoint または集計（先行タスク Future scope） | ui-prototype #1（新 endpoint 禁止） | baseline 候補（未起票・将来別タスク） |
| OOS-2 | query param キー名の日本語化 | API 契約変更 | AC-9 / ui-prototype #1 | **対応不能（恒久制約）**。UI 表示ラベルのみ日本語化で代替済み |
| OOS-3 | 監査ログ以外の admin 画面の同種改善 | 別画面の表現層改修 | スコープ境界（本タスクは `/admin/audit` 限定） | baseline 候補（未起票・別タスク） |
| OOS-4 | 未登録 action コードの SSOT 網羅 | DB 実データ調査 + `AUDIT_ACTION_LABELS` 追記 | 実データ依存（出現時に判断） | baseline 候補（raw fallback で情報欠落は防止済・出現時に SSOT 追記） |

> baseline は「将来あり得る価値ある拡張 / 恒久制約」として記録するのみ。本サイクルで起票・実装はしない。起票するかは別途ユーザー判断。

---

## 3. 重複 Issue チェック

| 確認観点 | 結果 |
| --- | --- |
| 本タスクと同一スコープ（`/admin/audit` 日本語化 + 段階開示 + 整列）の既存 Issue / workflow | なし（先行 `admin-audit-log-ux-clarity-and-reduce-error-fix`（#1202）はカード型化 + ガイド + appliedFilters 可視化 + エラー親切化までで、英語表記の日本語化・段階開示は未対応 → 本タスクが追従改善） |
| baseline OOS-1〜OOS-4 と重複する既存 Issue | なし（新規起票しないため重複リスクなし） |
| current 0 件のため新規起票 | なし |

---

## 4. サマリ

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| current（新規未タスク） | **0** | 本サイクルで対応すべき新規未タスクなし |
| baseline（将来候補 / 恒久制約） | 4 | OOS-1（CSV/total）/ OOS-2（query param 日本語化不可・恒久制約）/ OOS-3（他 admin 画面）/ OOS-4（未登録 action SSOT 網羅） |
| 新規 Issue 起票 | 0 | 仕様書作成のみ。起票はユーザー判断 |
