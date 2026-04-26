# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07a-parallel-tag-assignment-queue-resolve-workflow |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

unit / contract / E2E / authorization / state-machine の 5 層 verify suite を設計する。

## 実行タスク

1. unit test（state machine 全遷移）
2. contract test（endpoint response shape）
3. E2E（admin login → queue resolve → member_tags 反映）
4. authorization test（401 / 403）
5. state-machine 不変条件 test（unidirectional）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | resolve 仕様 |
| 必須 | outputs/phase-02/tag-queue-state-machine.md | 設計図 |
| 必須 | outputs/phase-01/main.md | AC quantitative |

## verify suite 設計

| layer | tool | scope | 担当 wave |
| --- | --- | --- | --- |
| unit | vitest | state machine 全遷移、validation | 07a 定義 / 08a 実行 |
| contract | vitest + zod | resolve response shape | 08a |
| E2E | Playwright | admin → queue → resolve → /admin/members で tag 確認 | 08b |
| authz | vitest + Hono test client | 401 / 403 boundary | 08a |
| state | vitest | unidirectional 違反試行 | 08a |
| audit | vitest + repo fixture | audit_log entry 確認 | 08a |

## test 計画

| test name | layer | 期待 |
| --- | --- | --- |
| `resolve.confirmed_creates_member_tags` | unit | tx 後に member_tags 行が存在 |
| `resolve.rejected_records_reason` | unit | queue.reason が body と一致 |
| `resolve.idempotent_confirmed` | unit | 同 action 再呼び出しで 200 + audit 1 件のまま |
| `resolve.confirmed_to_rejected_409` | state | 409 + 状態変化なし |
| `resolve.unknown_tag_code_422` | unit | tag_definitions に無い code で 422 |
| `resolve.deleted_member_422` | unit | isDeleted member への resolve で 422 |
| `resolve.audit_log_entry_present` | audit | resolve 後に audit_log に 1 件追加 |
| `resolve.unauthorized_401` | authz | session なしで 401 |
| `resolve.non_admin_403` | authz | 一般 user で 403 |
| `enqueueTagCandidate.skips_existing` | unit | 既に未解決 queue があれば skip |
| `e2e.tags_queue_resolve_flow` | E2E | UI で resolve → /admin/members で tag 反映 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | test 計画を assertion に |
| Phase 7 | AC × test の対応 |
| Phase 8a | 全 layer の実行 |
| Phase 8b | E2E |

## 多角的チェック観点

| 不変条件 | test 観点 | 検証方法 |
| --- | --- | --- |
| #5 | workflow が apps/api 内、外部から D1 直接呼び出しなし | grep + ESLint |
| #13 | member_tags への INSERT が本 workflow 経由のみ | grep + integration test |
| 認可 | 401 / 403 | authz test |
| 監査 | 全 resolve に audit_log | audit test |
| state | unidirectional | state test |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 計画 | 4 | pending | state machine |
| 2 | contract test | 4 | pending | response shape |
| 3 | E2E シナリオ | 4 | pending | admin → resolve |
| 4 | authz test | 4 | pending | 401/403 |
| 5 | state test | 4 | pending | unidirectional |
| 6 | audit test | 4 | pending | log entry |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | サマリー |
| ドキュメント | outputs/phase-04/tag-queue-test-strategy.md | 5 層 + 11 test 計画 |
| メタ | artifacts.json | Phase 4 を completed |

## 完了条件

- [ ] 6 layer × 11 test が確定
- [ ] AC 10 件すべてに verify 手段
- [ ] 不変条件 #5, #13 に test 観点

## タスク100%実行確認

- 全成果物が outputs/phase-04 配下
- artifacts.json で phase 4 を completed

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ: test 計画を実装の assertion 文言に
- ブロック条件: AC × test 対応漏れなら差し戻し
