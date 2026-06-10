# Phase 3: 設計レビュー（Phase 4 進行ゲート）

- task_id: `admin-meeting-bulk-attendance-select`
- 判定: **PASS（Phase 4 へ進行可）**

## 1. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 会員増でも操作コスト一定。1 名ずつ N 回 → 1 回の一括選択で運用破綻を防ぐ（管理者のコスト削減が定量的） |
| 実現性 | PASS | 既存 import endpoint 再利用で API 変更ゼロ。apps/web のみ。新規 4 ファイル + 編集 4 ファイルの妥当な厚み。1 サイクル完結（CONST_007） |
| 整合性 | PASS | 状態 owner は Shell に集約・選択は hook 局所・write は Shell のみ。責務境界が閉じている。不変条件 #1/#5/#9/#10 遵守 |
| 運用性 | PASS | all-or-nothing を未出席のみ選択で構造的に回避。失敗 3 経路を網羅。focused test で回帰防止 |

## 2. 設計レビュー チェック

| 観点 | 結果 |
| --- | --- |
| 既存コンポーネント再利用可否（[FB-SDK-07-1]） | Checkbox は不在のため新規必須。選択 hook は `useSchemaDiffBulkSelection` を参考に新規（import endpoint 1 リクエストのため concurrency 不要で簡素） |
| 命名一貫性（[FB-SDK-07-4]） | PascalCase コンポーネント / camelCase hook・関数 / `.spec` test / `bulk-attendance-*` testid。既存規約に整合 |
| state ownership（[Feedback W1-02b-2]） | 引き渡しテーブルを Phase 2 §2.7 に明記 |
| stale state（[FB-STATE-DETAIL-002]） | attended 変化で選択集合から既出席 id を除く effect を設計 |
| 純関数ガード（[WEEKGRD-02]） | `bulkFailureMessage` は例外を投げず文字列返却 |
| props vs internal state（[VSCPKR-03]） | 選択は hook internal state、候補/attended は external props と明記 |
| node-only import（[Feedback W1-02b-4]） | 該当なし（外部ライブラリ追加なし） |
| 不変条件 #10（mutation 標準） | import は 200 で業務失敗を返すため Shell 直呼びを許容（理由を Phase 8 注記）。既存 remove も Shell raw 構築の前例あり |
| design tokens（AC-11） | CSS は OKLch トークンのみ・Checkbox に accent-color トークン |
| API 非変更（AC-12） | 新 endpoint/D1/shared 型なし。`git diff -- apps/api packages` 空を Phase 9 で検証 |

## 3. リスクと対策

| リスク | 対策 |
| --- | --- |
| all-or-nothing で大量選択時に 1 件の deleted で全件失敗 | 選択母集合を未出席候補に限定（deleted は `/admin/members` 時点で除外済み）。それでも race で起きたら committed:false を内訳表示し選択保持 |
| 既存 spec が新 prop 未指定で型エラー | T5 で既存 spec に `onBulkAddAttendance` 追加（required prop） |
| モーダルとチェックリストのロジック重複 | `useBulkAttendanceSelection` に集約（AC-9） |
| 選択件数 > 500 | 送信前ガード |

## 4. MINOR 指摘（未タスク化候補・Phase 12 で baseline 記録）

- M-1: CSV ファイルアップロード一括取込 UI（import endpoint の email 行・dryRun preview を活用）は将来の別 UX。
- M-2: attendance route 二系統の統合は API リファクタで別タスク。

> いずれも本サイクル非対象（CONST_007 例外・Phase 1 §スコープ外に記載済み）。

## 5. ゲート結論

設計は 4 条件を満たし責務境界が閉じている。**Phase 4（テスト計画）へ進行可**。

## 成果物（Phase 3）

| 成果物 | パス |
| --- | --- |
| 設計レビュー結果（本書） | `phase-3-design-review.md` |
| レビュー結果詳細 | `outputs/phase-3/design-review-result.md` |
