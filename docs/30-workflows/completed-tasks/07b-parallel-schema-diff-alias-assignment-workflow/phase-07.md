# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

AC 10 件 × 検証 × 実装 × 異常系を一対一対応させる。

## AC マトリクス

| AC | 内容 | 検証 (Phase 4) | 実装 (Phase 5) | 異常系 (Phase 6) | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | apply で stableKey 更新 + queue resolved | unit `aliasAssign.apply_updates_stable_key` | schemaAliasAssign | 5xx D1 batch failure | #14 |
| AC-2 | dryRun で書き込みなし、affectedResponseFields 返却 | unit `aliasAssign.dryRun_no_write` | schemaAliasAssign (mode=dryRun) | dryRun に書き込み（regression） | #14 |
| AC-3 | 同 schema_version で stableKey 重複 → 422 | unit `aliasAssign.collision_422` | collision pre-check + DB UNIQUE | 422 collision | #14 |
| AC-4 | back-fill apply で response_fields.stableKey 更新 | backfill `backfill.batch_loop` | backfillResponseFields | 5xx CPU exhaust → idempotent retry | #1 |
| AC-5 | back-fill が batch (100/batch) で 30s 内完了 | backfill 性能計測 (Phase 9) | batchSize=100 + CPU 残予算 5s | 5xx RetryableError | #5 |
| AC-6 | audit_log に schema_diff.alias_assigned 記録 | audit `aliasAssign.audit_apply_recorded` | audit INSERT (apply のみ) | 5xx audit failure | 監査 |
| AC-7 | recommendedStableKeys が score 順で 5 件 | unit `recommendAliases.score_order` | recommendAliases (Levenshtein + section/index) | 既存 0 件で空配列 | UX |
| AC-8 | コードに stableKey 文字列 0 件 | grep test | schema_questions row 経由のみ参照 | regression で grep 失敗 | #1 |
| AC-9 | 削除済み response の back-fill skip | backfill `aliasAssign.deleted_response_skip` | WHERE is_deleted=false | 削除を含めた regression で test 失敗 | data integrity |
| AC-10 | 認可 401/403 | authz test 2 件 | adminGate middleware | 401/403 | 認可境界 |

## 不変条件 → AC マッピング

| 不変条件 | 対応 AC | 担保 |
| --- | --- | --- |
| #1 | AC-4, AC-8 | stableKey はコード固定なし、schema_questions 経由 + back-fill |
| #5 | AC-5, AC-10 | workflow が apps/api 内、UI は呼び出しのみ |
| #14 | AC-1, AC-2, AC-3 | apply / dryRun / collision で stableKey 更新を一元集約 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化対象（共通 audit / d1Tx） |
| Phase 9 | back-fill 性能計測（AC-5 確認） |
| Phase 10 | gate 判定 |

## 多角的チェック観点

| 不変条件 | チェック | 結果 |
| --- | --- | --- |
| #1 | AC-8 で grep 0 件 | OK |
| #5 | AC-10 で apps/web → apps/api 経由 | OK |
| #14 | AC-1, 3 で stableKey 更新を 1 path に集約 | OK |
| 監査 | AC-6 で apply audit | OK |
| dryRun 安全性 | AC-2 で書き込みなし | OK |

## 抜け漏れチェック

- ✅ 全 10 AC に検証手段
- ✅ 全 10 AC に実装位置
- ✅ 不変条件 3 件すべて対応 AC
- ✅ AC-2 の dryRun 安全性は audit test (`aliasAssign.audit_dryRun_no_record`) でも追加確認
- ✅ AC-7 の推奨アルゴリズムは AC とは独立した品質改善（UX）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC マトリクス | 7 | pending | 4 列 |
| 2 | 不変条件マッピング | 7 | pending | #1 / #5 / #14 |
| 3 | 抜け漏れ | 7 | pending | check |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | このタスクの scope / AC / 依存関係 |
| 必須 | ../README.md | Wave 全体の実行順と依存関係 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリー |
| ドキュメント | outputs/phase-07/ac-matrix.md | 4 列マトリクス |
| メタ | artifacts.json | Phase 7 を completed |

## 完了条件

- [ ] AC 10 × 4 列
- [ ] 不変条件 → AC
- [ ] 抜け漏れ 0

## タスク100%実行確認

- 全 AC に行
- artifacts.json で phase 7 を completed

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ: AC が同 module 集中の箇所を抽出
- ブロック条件: 抜け漏れ未解消なら差し戻し

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する
