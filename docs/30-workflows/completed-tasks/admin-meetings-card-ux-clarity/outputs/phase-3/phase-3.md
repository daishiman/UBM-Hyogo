# Phase 3: 設計レビュー（gate-decision）

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 3 / 13 |
| created_at | 2026-06-10 |
| 判定 | **PASS**（Phase 4 へ進む） |

## 目的

Phase 2 設計が Phase 4 へ進める品質かを判定し、MINOR は追跡計画を残す。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
|---|---|---|
| 真因の特定 | PASS | 未定義 BEM クラス + `.ui-card--flat` の CSS 欠如を grep で実証。表現層に閉じる |
| DOM contract 保持 | PASS | 全 data-testid/aria/role を維持し wrapper 追加のみ。既存 4 spec を破壊しない設計 |
| token 正本準拠 | PASS | 新規 token/HEX なし。`var(--ubm-*)` のみ。verify:tokens で機械検証 |
| 新規 primitive 最小化 | PASS | 既存 BEM 実体化が主。新設は汎用 2 系統（detail-section / attendee-row）のみ |
| スコープ整合（CONST_007） | PASS | 1 PR 完結。他画面 DOM 適用は OOS-1 として理由付き分離（user 承認済） |
| API 不変 | PASS | apps/api diff 空を AC-8 で固定 |

## simpler alternative 検討

| 代替案 | 不採用理由 |
|---|---|
| base `.ui-card` を直接強化 | public/profile を含む全画面に波及。CONST_007 抵触・回帰リスク。→ `.ui-card--flat` 修飾とカード固有 class に限定 |
| 全 admin 画面を一括共通化 | 各画面 DOM/テスト差異で 1 PR 不可（user に確認済 → primitive 新設 + meetings 適用を選択） |
| 右ドロワー化 | 新規コンポーネント・テスト大改修。user は「インライン維持」を選択 |
| inline style で余白付与 | token 正本違反・verify:tokens fail。→ globals.css の class へ |

## MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定Phase | 解決確認Phase | 備考 |
|---|---|---|---|---|
| M-01 | 出席者見出しテキスト変更（`出席者` → `出席者 (N名)`）が既存 spec の固定文字列 assert に当たる可能性 | Phase 4 | Phase 6/9 | 既存 spec が heading 完全一致で query していないか Phase 4 で確認し、当たる場合は部分一致へ |
| M-02 | `.admin-detail-section` を bulk セクションに適用すると二重枠 | Phase 5 | Phase 9 | bulk は `.bulk-attendance` のまま囲まない（設計済） |

いずれも MAJOR ではない（機能・contract 不変）。

## Phase 4 開始条件

- [x] Phase 1-3 完了
- [x] AC-1〜AC-10 確定
- [x] DOM contract 保持方針確定
- [x] MINOR 追跡計画記録

## Phase 13 blocked 条件

- commit / push / PR / staging deploy / screenshot は user 明示承認まで blocked。

## 成果物

- `outputs/phase-3/phase-3.md`（本ファイル）

## 完了条件

- [x] PASS/MINOR/MAJOR 判定
- [x] simpler alternative 記録
- [x] MINOR 追跡テーブル

## タスク100%実行確認【必須】

- [x] 設計レビューの全項目を記述
- [x] Phase 4 開始条件と Phase 13 blocked 条件を明記

## 次Phase

Phase 4（テスト作成）。
