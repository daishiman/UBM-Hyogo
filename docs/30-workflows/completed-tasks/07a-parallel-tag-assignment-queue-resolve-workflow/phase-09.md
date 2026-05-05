# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07a-parallel-tag-assignment-queue-resolve-workflow |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

型安全 / lint / unit / 無料枠 / secret hygiene を全項目チェック。

## 実行タスク

1. typecheck
2. lint
3. unit test
4. 無料枠
5. secret hygiene

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/tag-queue-test-strategy.md | test 計画 |
| 必須 | outputs/phase-08/main.md | 命名統一 |

## 実行手順

### ステップ 1: 型安全
```bash
pnpm -F apps/api typecheck
```
- TagQueueResolveBody（zod infer）と endpoint の return type が AdminTagQueueResolveResponse と一致

### ステップ 2: lint
```bash
pnpm -F apps/api lint
```

### ステップ 3: unit test
```bash
pnpm -F apps/api test workflows/tagQueue
```

### ステップ 4: 無料枠

| 操作 | 1 日想定 | 月間 |
| --- | --- | --- |
| candidate 自動投入 | 5 | 150 |
| resolve confirm | 5 | 150 |
| resolve reject | 1 | 30 |
| audit_log writes | 6 | 180 |
| guarded update operations | 18 | 540 |

- D1 writes 540/月、無料枠 100k/日 の 0.02%

### ステップ 5: secret hygiene
- 本タスクは secret 直接扱わない
- D1 binding は wrangler.toml で確定済み

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | PASS が GO 前提 |

## 多角的チェック観点

| 不変条件 | チェック | 結果 |
| --- | --- | --- |
| #5 | apps/api 内のみ、apps/web 経由なし | grep |
| #13 | member_tags INSERT が tagQueueResolve のみ | grep |
| 無料枠 | 540 writes/月 | 0.02% |
| 監査 | 全 resolve に audit | unit test |

## 無料枠見積もり

| サービス | 想定 | 上限 | 余裕 |
| --- | --- | --- | --- |
| D1 writes | 540 / 月 | 3M / 月（100k/日） | 99.98% |
| Workers req | 180 / 月 | 3M / 月 | 99.99% |

## secret hygiene チェックリスト

- [ ] 新規 secret なし
- [ ] D1 binding は wrangler.toml で管理
- [ ] AUTH_SECRET 等は本 workflow で参照しない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | typecheck | 9 | pending | infer |
| 2 | lint | 9 | pending | rule |
| 3 | unit | 9 | pending | workflows/tagQueue |
| 4 | 無料枠 | 9 | pending | 540 writes/月 |
| 5 | secret | 9 | pending | 直接扱わず |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | チェック結果 |
| メタ | artifacts.json | Phase 9 を completed |

## 完了条件

- [ ] 5 項目 PASS
- [ ] 無料枠 99% 余裕
- [ ] secret 漏れなし

## タスク100%実行確認

- 全項目 check
- artifacts.json で phase 9 を completed

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ: 全 PASS を GO の根拠
- ブロック条件: 1 項目でも FAIL なら差し戻し
