# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

AC-1〜AC-12 と Phase 4 test ID（U/C/E/S）、Phase 5 ランブック step、Phase 6 failure case（F）を一対多で紐付け、未トレース 0 を確認する。

## 実行タスク

1. AC × test ID × runbook × failure case の対応表
2. 未トレース AC 検出
3. 重複 / 漏れ排除

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-05/runbook.md | runbook step |
| 必須 | outputs/phase-06/main.md | failure case |

## 実行手順

### ステップ 1: AC matrix

| AC | 内容 | test ID | runbook | failure |
| --- | --- | --- | --- | --- |
| AC-1 | 4 ルート 200 / 404 分岐 | E-01〜E-07, C-03 | ステップ 2-5 | F-01 |
| AC-2 | URL ベース遷移成立 | E-01〜E-07 | layout + Link | - |
| AC-3 | 6 検索 query が URL に表現 + reload で復元 | U-01, U-04, E-03 | ステップ 3 | F-04, F-05 |
| AC-4 | density は `comfy/dense/list` のみ | U-03, S-03 | ステップ 6 | F-04 |
| AC-5 | tag が repeated query で AND | U-04 | toApiQuery | - |
| AC-6 | 不明 query は初期値フォールバック | U-02, U-03 | zod catch | F-04, F-05, F-06, F-07 |
| AC-7 | window.UBM 0 件 | S-01 | grep | - |
| AC-8 | stableKey 直書き 0 件 | S-03 | ESLint rule | - |
| AC-9 | localStorage 正本 0 件 | S-02 | ESLint rule | F-15 |
| AC-10 | `/members/[id]` public field のみ | C-04 | ステップ 4 | F-09〜F-12 |
| AC-11 | `/register` responderUrl + form-preview | C-05, S-05 | ステップ 5 | F-08 |
| AC-12 | 09-ui-ux 検証マトリクス | E-01〜E-07 | UI primitives | - |

### ステップ 2: 未トレース 検出

- AC-1〜AC-12 全て対応済み

### ステップ 3: 重複 / 漏れ排除

- AC-3 と AC-4, AC-5, AC-6 は URL contract の上位概念。AC-3 は「全体」、4/5/6 は「個別 query」
- AC-7, AC-8, AC-9 は static check 由来。lint と grep の二重で担保

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠 |
| 08a | C-XX 結果と本表突合 |
| 08b | E-XX 結果と本表突合 |

## 多角的チェック観点

- 不変条件 #1: AC-8 で stableKey 直書き禁止
- 不変条件 #5: AC-1 / AC-10 で apps/api 経由のみ
- 不変条件 #6: AC-7 で window.UBM 不在
- 不変条件 #8: AC-3 / AC-9 で localStorage 不採用
- 不変条件 #9: AC-11 から `/login` への誘導（`/no-access` 経由しない）
- 不変条件 #10: AC-3 の URL ベースで Cache-Control が機能

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix | 7 | pending | 12 行 |
| 2 | 未トレース | 7 | pending | 0 件 |
| 3 | 重複排除 | 7 | pending | - |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × test × runbook × failure |
| メタ | artifacts.json | phase 7 status |

## 完了条件

- [ ] AC-1〜AC-12 全て対応
- [ ] 未トレース 0 件
- [ ] 重複なし

## タスク100%実行確認【必須】

- 全 3 サブタスクが completed
- 2 種ドキュメント配置
- 不変条件 #1, #5, #6, #8, #9, #10 が紐付け
- 次 Phase へ DRY 化対象を引継ぎ

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: 4 page で重複する fetch ヘルパ / レイアウトを抽出
- ブロック条件: 未トレース AC があれば進まない
