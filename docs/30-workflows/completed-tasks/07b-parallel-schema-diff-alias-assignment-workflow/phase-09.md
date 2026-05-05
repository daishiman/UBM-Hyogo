# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

型安全 / lint / unit / 無料枠 / secret hygiene / back-fill 性能を全項目チェック。

## 実行タスク

1. typecheck
2. lint
3. unit test
4. back-fill 性能計測（10000 行で 30s 内完了確認）
5. 無料枠
6. secret hygiene

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/schema-alias-test-strategy.md | test 計画 |
| 必須 | outputs/phase-08/main.md | 命名統一 |

## 実行手順

### ステップ 1: 型安全

```bash
pnpm -F apps/api typecheck
```

- SchemaAliasAssignBody（zod infer）と endpoint の return type union (apply | dryRun) が SchemaAliasAssignResponse と一致

### ステップ 2: lint

```bash
pnpm -F apps/api lint
```

### ステップ 3: unit test

```bash
pnpm -F apps/api test workflows/schemaAliasAssign
pnpm -F apps/api test workflows/backfillResponseFields
pnpm -F apps/api test services/aliasRecommendation
```

### ステップ 4: back-fill 性能計測

| 行数 | 期待時間 | 実測 |
| --- | --- | --- |
| 100 | < 1s | TBD |
| 1000 | < 5s | TBD |
| 10000 | < 25s | TBD |
| 30000 | RetryableError | TBD（CPU 残予算で中断 → 再 apply で続行） |

- 10000 行が 25s 以内なら GO、超過なら案 C（cron 分割）を Phase 3 から再評価

### ステップ 5: 無料枠

| 操作 | 1 回 | 月想定 (alias 確定 10 件) |
| --- | --- | --- |
| schema_questions UPDATE | 1 | 10 |
| schema_diff_queue UPDATE | 1 | 10 |
| response_fields UPDATE | 100 / batch × 平均 5 batch = 500 | 5000 |
| audit_log INSERT | 1 | 10 |
| dryRun (read only) | 0 writes | 0 |
| D1 writes 合計 | 503 | 5030 |

- D1 writes 5030/月、無料枠 100k/日（3M/月）の 0.17%
- back-fill が大規模 schema 変更（10000 行）で月 1 回発生しても余裕

### ステップ 6: secret hygiene

- 本タスクは secret 直接扱わない
- D1 binding は wrangler.toml で確定済み
- `SCHEMA_BACKFILL_BATCH_SIZE` / `SCHEMA_BACKFILL_CPU_RESERVE_MS` は wrangler vars で非機密

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | PASS が GO 前提 |
| Phase 11 | back-fill 計測結果を smoke 評価に |

## 多角的チェック観点

| 不変条件 | チェック | 結果 |
| --- | --- | --- |
| #1 | コード内 stableKey 文字列 grep 0 件 | grep |
| #5 | apps/api 内のみ、apps/web 経由なし | grep |
| #14 | UPDATE schema_questions が schemaAliasAssign のみ | grep |
| 無料枠 | 5030 writes/月 | 0.17% |
| 監査 | apply のみ audit | unit test |

## 無料枠見積もり

| サービス | 想定 | 上限 | 余裕 |
| --- | --- | --- | --- |
| D1 writes | 5030 / 月 | 3M / 月（100k/日） | 99.83% |
| Workers req | 50 / 月 | 3M / 月 | 99.99% |
| CPU time | 25s / apply × 10 = 250s / 月 | 制限なし（per req 30s） | 余裕 |

## secret hygiene チェックリスト

- [ ] 新規 secret なし
- [ ] D1 binding は wrangler.toml で管理
- [ ] AUTH_SECRET 等は本 workflow で参照しない
- [ ] back-fill batch size は wrangler vars（非機密）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | typecheck | 9 | pending | union type infer |
| 2 | lint | 9 | pending | rule |
| 3 | unit | 9 | pending | 3 module |
| 4 | back-fill 性能 | 9 | pending | 4 行数 |
| 5 | 無料枠 | 9 | pending | 5030 writes/月 |
| 6 | secret | 9 | pending | 直接扱わず |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | チェック結果 + 性能計測 |
| メタ | artifacts.json | Phase 9 を completed |

## 完了条件

- [ ] 6 項目 PASS
- [ ] 無料枠 99% 余裕
- [ ] back-fill が 10000 行で 25s 以内
- [ ] secret 漏れなし

## タスク100%実行確認

- 全項目 check
- artifacts.json で phase 9 を completed

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ: 全 PASS を GO の根拠
- ブロック条件: 1 項目でも FAIL なら差し戻し（特に back-fill 性能 NG なら案 C 採用）
