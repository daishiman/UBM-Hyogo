# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | fallback 廃止の要件確定 |

## 目的

issue-191 移行期間限定 fallback（`schema_questions.stable_key` SELECT）の削除可否判定基準と、削除後の挙動 AC を確定する。

## 実行タスク

- Issue #299 と unassigned task spec を読み直す。
- 上流 `issue-191-schema-aliases-implementation-001` の完了状態を確認する。
- fallback 残存箇所と参照 test を grep で再確認する。
- alias coverage の判定クエリ（廃止条件 query）を仕様化する。
- AC-1 から AC-7 を確定する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Issue #299 | `https://github.com/daishiman/UBM-Hyogo/issues/299` | 元タスク。state=open のまま扱う |
| unassigned task | `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` | 廃止判断と coverage 条件 |
| 上流実装 | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/` | `schema_aliases` 正本実装 |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | fallback 記述の更新対象 |
| 現行 fallback | `apps/api/src/repository/schemaQuestions.ts` L135-151 | 削除対象 |
| 現行 test | `apps/api/src/sync/schema/resolve-stable-key.spec.ts` | "fallback" ケース更新対象 |

## 実行手順

1. P50 チェック: `git log --oneline -20 -- apps/api/src/repository/schemaQuestions.ts apps/api/src/sync/schema/` で fallback 周辺の実装履歴を確認する。
2. `rg -n "findStableKeyByQuestionId|schema_questions\.stable_key|stable_key FROM schema_questions" apps/api packages` で fallback 経路の全参照を列挙する。
3. Acceptance Criteria を以下で固定する。

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | alias coverage query の結果が 0 件であることを Phase 11 evidence に記録する（`stable_key IS NOT NULL` かつ `schema_aliases` 未登録の question が 0 件） |
| AC-2 | 03a sync logs / metrics（取得可能な範囲で）fallback hit = 0 を Phase 11 evidence に記録する。取得不能な場合は理由を明記する |
| AC-3 | `findStableKeyByQuestionId` から `schema_questions` SELECT fallback 経路（L142-150）が削除される |
| AC-4 | alias miss 時の返り値は `null` であり、呼び出し側（03a sync）はそれを unresolved として `schema_diff_queue` に enqueue する |
| AC-5 | `resolve-stable-key.spec.ts` の "fallback" ケースが「alias miss は null を返す」セマンティクスに更新され、`schema_questions.stable_key` を読まないことを assertion する |
| AC-6 | `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` の結果が 0 件（migration / comment 以外） |
| AC-7 | `database-implementation-core.md` の fallback 記述が削除または「retired at 2026-05-15」として更新される |

## 統合テスト連携

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| API unit/contract | `mise exec -- pnpm --filter @repo/api test` PASS | Phase 9 で実行 |
| 静的検査 | `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` 0 件 | Phase 11 で evidence 化 |
| coverage query | 0 件 | Phase 11 で evidence 化 |

## 多角的チェック観点（AIが判断）

- `updateStableKey`（L153-172）や `listFieldsByVersion` のような **alias resolution と無関係な** `schema_questions.stable_key` 参照を巻き添えに削除していないか。
- alias coverage query が「ある時点のスナップショット」であることを明記し、廃止後の混入リスク（新規 question 流入）に対する後段ガードを Phase 6 / Phase 8 に持っているか。
- direct update guard 強化（`task-issue-191-direct-stable-key-update-guard-001`）と scope が混ざっていないか。

## サブタスク管理

| サブタスク | owner | 依存 |
| --- | --- | --- |
| coverage report | backend | Phase 11 |
| fallback code 削除 | backend | Phase 5 |
| tests 更新 | backend | Phase 4 |
| 正本仕様更新 | backend | Phase 12 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 要件定義 | `phase-01.md` | AC とスコープ |

## 完了条件

- [ ] AC-1 から AC-7 が検証可能な形で定義されている
- [ ] Issue #299 state=open 維持方針が明記されている
- [ ] Phase 1-3 gate が確認されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 参照資料を読んだ
- [ ] P50チェックを実行した
- [ ] AC を Phase 7 に引き継げる

## 次Phase

Phase 2: 設計
