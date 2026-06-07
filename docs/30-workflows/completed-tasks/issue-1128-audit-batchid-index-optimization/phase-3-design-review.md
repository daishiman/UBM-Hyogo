# Phase 3: 設計レビュー（Phase 4 進行ゲート = Gate-A）

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 単一責務 | PASS | 「audit_log batchId 検索の index 最適化」のみ。bulk write / query surface には触れない |
| AC 網羅 | PASS | AC-1〜AC-7 が migration / repository / test にマップ済み（下表） |
| 単一サイクル完了（CONST_007） | PASS | migration 1 本 + repository 1 ファイル + test。先送り・分割なし |
| 既存不変条件との整合 | PASS | append-only（AC-7）/ query surface 不変 / D1 apps/api 閉域を維持 |
| 命名規則整合（FB-01） | PASS | `snake_case` 列・`idx_audit_log_*` index・`NNNN_*.sql` migration |
| テストハーネス互換 | PASS | `_setup.ts` が `0026` を自動適用。単文 DDL で `;` 分割安全 |
| 実測ゲート | PASS | 方式 A/B の決定基準（EXPLAIN QUERY PLAN）が Phase 2 に明記済み |

## AC → 実装マッピング

| AC | 実装箇所 | 検証 |
| --- | --- | --- |
| AC-1 | `0026` migration の ADD COLUMN | migration spec / `_setup.ts` 適用成功 |
| AC-2 | CREATE INDEX + `listFiltered` 切替 | EXPLAIN QUERY PLAN で index 走査 |
| AC-3 | COALESCE（after/before） | repository spec の after/before 両ケース緑 |
| AC-4 | 方式 A=index 構築自動 / 方式 B=backfill UPDATE | 既存行検索ケース緑 |
| AC-5 | `listFiltered` 返却不変 | `auditLog.repository.spec.ts:122-235` 非退化 |
| AC-6 | migration 末尾 rollback コメント | レビューで存在確認 |
| AC-7 | UPDATE/DELETE 非 export 維持 | `auditLog.ts` の export surface 不変 |

## 残課題 / MINOR

なし（MINOR 指摘 0 件）。実測で方式 B に倒れた場合の append() 拡張も Phase 2/5 に記載済みで、追加スコープは発生しない。

## ゲート判定

**Gate-A: PASS** — Phase 4（テスト設計）以降へ進行可。本タスクは spec 作成までが本ワークフローのスコープであり、Phase 4-13 仕様書は「03.実装.md が確実に実装着手できる」粒度で記述する。
