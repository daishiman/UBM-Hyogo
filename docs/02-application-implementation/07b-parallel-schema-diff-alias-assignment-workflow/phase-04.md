# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

unit / contract / E2E / authorization / state-machine / back-fill の 6 層 verify suite を設計する。

## 実行タスク

1. unit test（dryRun / apply / 状態遷移）
2. contract test（endpoint response shape、dryRun と apply の type union）
3. E2E（admin → /admin/schema → diff → alias 確定 → 反映確認）
4. authorization test（401 / 403）
5. state-machine 不変条件 test（unidirectional）
6. back-fill test（100 行/batch、削除 skip、idempotent）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | stableKey 仕様 |
| 必須 | outputs/phase-02/schema-alias-workflow-design.md | 設計図 |
| 必須 | outputs/phase-01/main.md | AC quantitative |

## verify suite 設計

| layer | tool | scope | 担当 wave |
| --- | --- | --- | --- |
| unit | vitest | apply / dryRun / state machine / Levenshtein | 07b 定義 / 08a 実行 |
| contract | vitest + zod | response shape (dryRun / apply union) | 08a |
| E2E | Playwright | /admin/schema diff → alias 確定 → response 一覧で stableKey 反映 | 08b |
| authz | vitest + Hono test client | 401 / 403 boundary | 08a |
| state | vitest | unidirectional 違反試行（assigned → unresolved 不可） | 08a |
| audit | vitest + repo fixture | apply に audit_log 1 件、dryRun に 0 件 | 08a |
| backfill | vitest + D1 fixture | 100 行/batch、削除 skip、idempotent UPDATE | 08a |

## test 計画

| test name | layer | 期待 |
| --- | --- | --- |
| `aliasAssign.apply_updates_stable_key` | unit | tx 後に schema_questions.stableKey が新値、queue.status='assigned' |
| `aliasAssign.dryRun_no_write` | unit | DB 状態が完全に不変、affectedResponseFields のみ算出 |
| `aliasAssign.collision_422` | unit | 同 schema_version で同 stableKey 別 questionId は 422 |
| `aliasAssign.idempotent_apply` | unit | 同一 stableKey 再 apply で 200 + audit 増えない |
| `aliasAssign.unidirectional_state` | state | assigned → unresolved への直接 UPDATE 試行を 409 |
| `aliasAssign.deleted_response_skip` | unit | is_deleted=true の response_fields は back-fill 対象外 |
| `aliasAssign.audit_apply_recorded` | audit | apply 後に audit_log に schema_diff.alias_assigned が 1 件 |
| `aliasAssign.audit_dryRun_no_record` | audit | dryRun では audit_log に追加なし |
| `aliasAssign.unauthorized_401` | authz | session なしで 401 |
| `aliasAssign.non_admin_403` | authz | 一般 user で 403 |
| `recommendAliases.score_order` | unit | Levenshtein + section/index で上位 5 件が正しく並ぶ |
| `recommendAliases.empty_existing` | unit | 既存 stableKey 0 件で空配列を返す |
| `backfill.batch_loop` | backfill | 250 行 fixture を 100/100/50 で 3 batch、全 row 更新 |
| `backfill.idempotent_resume` | backfill | 中断後の再 apply で重複なく完了 |
| `e2e.schema_alias_assign_flow` | E2E | UI で alias 確定 → 過去 response 一覧で stableKey 反映確認 |

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
| #1 | コード内 string literal の questionId 0 件 | grep test |
| #5 | workflow が apps/api 内、外部から D1 直接呼び出しなし | grep + ESLint |
| #14 | UPDATE schema_questions が schemaAliasAssign 経由のみ | grep + integration test |
| 認可 | 401 / 403 | authz test |
| 監査 | apply のみ audit、dryRun は無 | audit test |
| state | unidirectional | state test |
| back-fill | 削除 skip + idempotent | backfill test |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 計画 | 4 | pending | apply / dryRun / state |
| 2 | contract test | 4 | pending | response union |
| 3 | E2E シナリオ | 4 | pending | /admin/schema flow |
| 4 | authz test | 4 | pending | 401/403 |
| 5 | state test | 4 | pending | unidirectional |
| 6 | audit test | 4 | pending | apply only |
| 7 | backfill test | 4 | pending | batch + idempotent |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | サマリー |
| ドキュメント | outputs/phase-04/schema-alias-test-strategy.md | 7 層 + 15 test 計画 |
| メタ | artifacts.json | Phase 4 を completed |

## 完了条件

- [ ] 7 layer × 15 test が確定
- [ ] AC 10 件すべてに verify 手段
- [ ] 不変条件 #1, #14 に test 観点

## タスク100%実行確認

- 全成果物が outputs/phase-04 配下
- artifacts.json で phase 4 を completed

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ: test 計画を実装の assertion 文言に
- ブロック条件: AC × test 対応漏れなら差し戻し
