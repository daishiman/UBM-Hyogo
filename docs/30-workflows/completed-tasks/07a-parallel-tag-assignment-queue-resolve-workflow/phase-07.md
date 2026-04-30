# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07a-parallel-tag-assignment-queue-resolve-workflow |
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
| AC-1 | confirm で member_tags 反映 + queue confirmed | unit `resolve.confirmed_creates_member_tags` | tagQueueResolve | - | #13 |
| AC-2 | reject で reason 記録 | unit `resolve.rejected_records_reason` | tagQueueResolve | 422 reason empty | #13 |
| AC-3 | idempotent 200 / 別 action 409 | unit `resolve.idempotent_confirmed`, state `resolve.confirmed_to_rejected_409` | workflow idempotent check | 409 conflict | #13 |
| AC-4 | unidirectional state | state test 全 invalid 遷移 | WHERE status IN ('queued','reviewing') | 409 | #13 |
| AC-5 | audit_log 記録 | audit test | tagQueueResolve guarded update | tx rollback | 監査 |
| AC-6 | unknown tagCode → 422 | unit `resolve.unknown_tag_code_422` | tag_definitions check | 422 | data integrity |
| AC-7 | deleted member → 422 | unit `resolve.deleted_member_422` | member.isDeleted check | 422 | #15 (precaution) |
| AC-8 | candidate 自動投入 | unit `enqueueTagCandidate.skips_existing` | enqueueTagCandidate hook in 03b | - | #13 |
| AC-9 | UI から resolve 後 list 更新 | E2E `tags_queue_resolve_flow` | (06c UI 連携) | - | UI 連携 |
| AC-10 | 認可 401/403 | authz test | adminGate middleware | 401/403 | 認可境界 |

## 不変条件 → AC マッピング

| 不変条件 | 対応 AC | 担保 |
| --- | --- | --- |
| #5 | AC-9, AC-10 | workflow が apps/api 内、UI は呼び出しのみ |
| #13 | AC-1, AC-2, AC-3, AC-4, AC-8 | queue 経由で確定、unidirectional |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化対象 |
| Phase 10 | gate 判定 |

## 多角的チェック観点

| 不変条件 | チェック | 結果 |
| --- | --- | --- |
| #5 | AC-10 で apps/web → apps/api 経由 | OK |
| #13 | AC-1, 4 で queue 経由必須 | OK |
| 監査 | AC-5 で全 resolve audit | OK |

## 抜け漏れチェック

- ✅ 全 10 AC に検証手段
- ✅ 全 10 AC に実装位置
- ✅ 不変条件 2 件すべて対応 AC
- ✅ AC-7 は不変条件 #15 の precaution（attendance とは別だが member 整合維持）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC マトリクス | 7 | pending | 4 列 |
| 2 | 不変条件マッピング | 7 | pending | #5 / #13 |
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
