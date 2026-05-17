# task-issue-299-schema-questions-fallback-retirement-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| GitHub Issue | #299 |
| 状態 | implementation_complete_pending_pr |
| taskType | implementation |
| docsOnly | false |
| implementation 区分 | 実装仕様書（コード変更を伴う） |
| implementation_status | fallback_retired_local |
| evidence_state | COVERAGE_ZERO_VERIFIED_LOCAL |
| visualEvidence | NON_VISUAL |
| canonical root | `docs/30-workflows/task-issue-299-schema-questions-fallback-retirement-001/` |
| source task | `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` |
| 上流タスク | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/`（completed） |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` |

## 状態遷移ルール

| 分岐 | 条件 | root state / source task |
| --- | --- | --- |
| GO | production / staging coverage query が両方 0 件、fallback 削除、test/static gate PASS | `implemented_local_runtime_pending` または `implementation_complete_pending_pr`。source unassigned task は completed trace に更新 |
| DEFERRED | production / staging coverage query のどちらかが 1 件以上 | `blocked_by_coverage` / `deferred_recheck_required`。source unassigned task は open 維持し、再判定条件と evidence path を追記 |
| NO-GO | test failure、static guard failure、scope creep、Issue close/reopen 操作、承認前 push/PR | 該当 Phase に戻す。source unassigned task は completed 化しない |

## 実装区分判定根拠（CONST_004）

本タスクは `apps/api/src/repository/schemaQuestions.ts#findStableKeyByQuestionId` 内に残存する `schema_questions.stable_key` SELECT fallback の **削除（コード変更）** が目的であり、ドキュメントだけでは目的が達成できない。したがって実装仕様書として作成する。

## 現状調査（2026-05-15 時点）

| 項目 | 状態 |
| --- | --- |
| issue-191 親実装 | completed（`schema_aliases` DDL / repository / 07b apply / 03a alias-first lookup 全て稼働中） |
| fallback 経路 | **廃止済み**: `apps/api/src/repository/schemaQuestions.ts#findStableKeyByQuestionId` は `findAliasByQuestionId` のみを呼び、alias miss は `null` を返す |
| fallback test | **updated**: `apps/api/src/sync/schema/resolve-stable-key.spec.ts` は alias miss 時に `schema_questions.stable_key` を読まないことを検証 |
| 結論 | **ローカル実装完了 / PR 待ち**。Issue #299 は state=open（ユーザー指示通り close 状態は変更しない） |

## 目的

issue-191 移行期間限定で残した `schema_questions.stable_key` SELECT fallback を、`schema_aliases` への 100% 移行を coverage query で確認したうえで安全に削除し、stableKey 解決の唯一の正本を `schema_aliases` に一本化する。

## スコープ

含む:
- alias coverage report 作成（runtime D1 read-only クエリ実行と evidence 化）
- `findStableKeyByQuestionId` 内 fallback SELECT 経路の削除
- 関連 test (`resolve-stable-key.spec.ts` の "fallback" ケース) の更新（fallback miss = unresolved に変更）
- 03a sync logs / metrics（あれば）の fallback hit = 0 確認
- 正本仕様（`database-implementation-core.md`）の fallback 記述削除

含まない:
- `schema_aliases` DDL / repository / 07b apply / 03a alias-first lookup の追加実装（completed）
- `updateStableKey` 関数本体の削除（alias backfill / assign workflow が使用中）
- 本番 D1 への apply / push / PR（Phase 13 ユーザー承認後）
- 別系統の direct stable_key update guard 強化（`task-issue-191-direct-stable-key-update-guard-001` 範囲）

## 正本契約（廃止後）

| 項目 | 内容 |
| --- | --- |
| stableKey 解決経路 | `schema_aliases` lookup のみ |
| alias miss 時の挙動 | `null` を返し、03a sync は unresolved として `schema_diff_queue` enqueue |
| `schema_questions.stable_key` 読み取り | `listFieldsByVersion` / `findFieldByStableKey` など既存 schema enumeration からの読み取りは継続（fallback としての alias-resolution 経路だけを削除） |
| 禁止 | `findStableKeyByQuestionId` で alias miss 時に `schema_questions.stable_key` を SELECT すること |

## Phase一覧

| Phase | 名称 | 仕様書 | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計 | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビュー | [phase-03.md](phase-03.md) | spec_created |
| 4 | テスト戦略 | [phase-04.md](phase-04.md) | spec_created |
| 5 | 実装計画 | [phase-05.md](phase-05.md) | spec_created |
| 6 | 異常系設計 | [phase-06.md](phase-06.md) | spec_created |
| 7 | ACマトリクス | [phase-07.md](phase-07.md) | spec_created |
| 8 | DRY/責務確認 | [phase-08.md](phase-08.md) | spec_created |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | spec_created |
| 10 | GO/NO-GO | [phase-10.md](phase-10.md) | spec_created |
| 11 | NON_VISUAL evidence | [phase-11.md](phase-11.md) | completed |
| 12 | ドキュメント同期 | [phase-12.md](phase-12.md) | completed |
| 13 | PR作成 | [phase-13.md](phase-13.md) | blocked_until_user_approval |

## 実行境界

- Issue #299 は **state=open のまま** 扱い、PR 作成・Issue 再オープン/クローズ操作は Phase 13 のユーザー承認があるまで実行しない。
- PR body は `Refs #299` を使う（`Closes #299` ではなく、ユーザー指示に基づき issue state を変更しない）。
