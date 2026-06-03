# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト作成) |
| タスク種別 | implementation / NON_VISUAL |

## 目的

Phase 2 設計が Phase 4 以降へ進められるかを GO/NO-GO で判定する。出力不変性・不変条件整合・
groupBy キー正当性を重点レビューする。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 出力不変性（AC-4） | GO | `byKey` 構築以降を変更せず fetch 経路のみ置換。`PublicMemberListResponse` の値が不変 |
| groupBy キー正当性（F-2） | GO | fields=`response_id`(=`current_response_id`)。tags の `member_id` と混同しない設計 |
| 不変条件 #5（D1 境界） | GO | 変更は apps/api 内 repository + use-case のみ。apps/web 非接触 |
| fail-close（#2/#3/#11） | GO | view converter `toPublicMemberListView` は不変。fail-close ロジックに非接触 |
| N+1 解消（AC-3） | GO | fields クエリが member 件数 N に依存せず ≦ 1。回帰テストで担保 |
| スコープ境界 | GO | tags / schema / endpoint / Google Form / apps/web を変更しない |
| 後方互換 | GO | `listFieldsByResponseId`（単数）は他 caller が残る可能性があるため**削除しない**（追加のみ） |

## リスクと対策

| リスク | 影響度 | 対策 |
| --- | --- | --- |
| groupBy キーを `member_id` と混同（F-2） | 高 | テスト（Phase 4）で「複数 member の値が正しく引き当たる」ケースを必須化 |
| 空配列で `IN ()` 構文エラー | 中 | helper 冒頭の `if (rids.length === 0) return []` で DB 非アクセス |
| 単数 helper の誤削除で他 caller が壊れる | 中 | `listFieldsByResponseId` は削除せず温存。本タスクは追加 + 当該 use-case の置換のみ |
| 出力値の意図しない変化 | 高 | 既存 use-case テストを回帰として緑維持（AC-4） |

## 真の論点の再確認

- 主問題: 公開一覧の summary fields 取得が N+1。→ batch 1 query 化で解消（設計は妥当）。
- 1 提案に複数案件が混在していないか: 混在なし（fields N+1 単一責務。tags は別タスクで完了済み）。
- why now: 表示遅延が顕在化する前に対称な N+1 を解消し、読み取り経路の一貫性を保つため。
- why this way: 既存 tags batch と同型パターンを流用し、新規概念・新規 endpoint を増やさないため。

## 実行タスク

1. 出力不変性・groupBy キー・不変条件整合を GO/NO-GO で判定する（完了条件: 全観点 GO）。
2. リスクと対策を表で確定する（完了条件: §リスク表）。
3. 単数 helper を削除しない後方互換方針を固定する（完了条件: §レビュー観点「後方互換」GO）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | レビュー対象設計 |
| 必須 | apps/api/src/view-models/public/public-member-list-view.ts | 出力形状の不変確認 |
| 参考 | docs/30-workflows/completed-tasks/issue-224-followup-001-public-members-fields-batch-fetch-n1-prevention.md | F-1/F-2/F-3 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビュー主成果物（GO/NO-GO 判定 + リスク表） |
| メタ | artifacts.json | Phase 3 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | GO 判定済み設計をテスト戦略へ渡す。F-2 リスクをテスト必須ケース化 |
| Phase 5 | 後方互換方針（単数 helper 温存）を実装制約として渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 全レビュー観点が GO 判定
- [x] リスクと対策が確定している
- [x] 後方互換方針（単数 helper 温存）が固定されている
- [x] Phase 4 へ進む GO 判定が記録されている

## タスク100%実行確認【必須】

- 全実行タスク（3 件）が completed
- 成果物が `outputs/phase-03/` 配下に配置済み
- artifacts.json の `phases[2].status` が completed

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト作成)
- 引き継ぎ事項: GO 判定済み設計 / F-2 リスクのテスト必須化 / 単数 helper 温存
- ブロック条件: いずれかの観点が NO-GO に転じた場合は Phase 2 へ差し戻し
