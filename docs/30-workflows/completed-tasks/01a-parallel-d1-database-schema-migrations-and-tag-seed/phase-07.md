# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 7 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 6 (異常系検証) |
| 下流 Phase | 8 (DRY 化) |
| 状態 | completed |

## 目的

AC-1〜AC-9、Phase 4 verify suite、Phase 5 step、Phase 6 failure を 4 軸で対応付け、未トレース 0 件を確認する。

## 実行タスク

1. 4 軸マトリクス
2. 未トレース確認
3. 不変条件マッピング
4. outputs

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md AC | AC 9 件 |
| 必須 | outputs/phase-04/migration-tests.md | test |
| 必須 | outputs/phase-05/migration-runbook.md | step |
| 必須 | outputs/phase-06/main.md | failure |

## 実行手順

### 4 軸 → 未トレース → 不変条件 → outputs

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO |
| Phase 12 | implementation-guide |

## 多角的チェック観点（不変条件参照）

- 全 8 不変条件が AC に紐付き

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 4 軸 | 7 | completed |
| 2 | 未トレース | 7 | completed |
| 3 | 不変条件 | 7 | completed |
| 4 | outputs | 7 | completed |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-07/main.md |
| メタ | artifacts.json |

## 完了条件

- [ ] AC 全件紐付き
- [ ] 未トレース 0 件

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 8
- 引き継ぎ事項: 重複箇所 → DRY 化対象
- ブロック条件: 未トレースあり

## AC マトリクス

| AC | 内容 | Phase 4 test | Phase 5 step | Phase 6 failure | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | local apply exit 0 | migration apply local | Step 4 | #1, #2 | #1 |
| AC-2 | remote apply exit 0 | migration apply remote | Step 5 | #1, #2 | - |
| AC-3 | 20 physical tables + 1 view | schema object set | Step 4 | - | - |
| AC-4 | INDEX >= 7 | index count | Step 4 | - | - |
| AC-5 | seed 6 カテゴリ | seed count | Step 6 | #12 | - |
| AC-6 | attendance 重複阻止 | constraint test | Step 4 | #3 | #15 |
| AC-7 | 無料枠 5GB 未満 | Phase 9 | - | #10 | #10 |
| AC-8 | apps/web に D1 binding なし | grep wrangler.toml | Step 1 | #14 | #5 |
| AC-9 | NNNN_*.sql | ls migrations | Step 3 | - | - |

## 不変条件 ↔ AC

| 不変条件 | 該当 AC | 担保方法 |
| --- | --- | --- |
| #1 | AC-1, AC-2 | schema_questions の stable_key 抽象 |
| #2 | AC-1 | member_status の column 名 |
| #3 | AC-1 | response_email を column |
| #4 | - | profile_overrides 不在（review） |
| #5 | AC-8 | apps/web/wrangler.toml grep |
| #7 | AC-1 | response_id / member_id 別 PK |
| #10 | AC-7 | 無料枠見積もり |
| #15 | AC-6 | attendance PRIMARY KEY |

## 未トレース

なし。
