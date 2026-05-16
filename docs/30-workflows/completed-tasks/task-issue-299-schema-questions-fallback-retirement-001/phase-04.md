# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | テストケースと検証コマンド定義 |

## 目的

fallback 削除前後で「alias hit は不変」「alias miss は null（unresolved）」「`schema_questions` への fallback SELECT が発行されない」を検証する。

## 実行タスク

| ID | 種別 | 対象 | 期待 |
| --- | --- | --- | --- |
| T-01 | repository unit | `findStableKeyByQuestionId(questionId)` alias hit | alias.stableKey を返す |
| T-02 | repository unit | `findStableKeyByQuestionId(questionId)` alias miss | `null` を返す（fallback SELECT 不発行） |
| T-03 | repository unit | `schema_questions.stable_key` が存在しても alias miss なら null | D1 mock の query log に `stable_key FROM schema_questions WHERE question_id` が含まれないこと |
| T-04 | sync | `resolveStableKey` alias hit | `source='alias'`, `stableKey` 正値 |
| T-05 | sync | `resolveStableKey` alias miss + known hit | `source='known'` |
| T-06 | sync | `resolveStableKey` alias miss + known miss | `source='unknown'`、`stable_key='unknown'`、後段 enqueue 経路に乗る |
| T-07 | static | direct fallback SELECT | `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` 0 件 |
| T-08 | static | `findStableKeyByQuestionId` 内に SQL 文が残っていない | ファイル grep 0 件（alias lookup 呼び出しのみ） |
| T-09 | regression | 03a sync 全体 | unresolved enqueue が増加しない（coverage 0 件前提） |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| 既存 test | `apps/api/src/sync/schema/resolve-stable-key.spec.ts` | "fallback" ケース更新元 |
| repository test | `apps/api/src/repository/__tests__/` | 既存 pattern |
| 上流 test 構成 | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/phase-04.md` | T-05/T-06 既存定義 |

## 実行手順

1. 既存の "fallback" test (T 旧) を T-02/T-03 セマンティクスへ書き換える。
2. T-03 は D1 mock（`apps/api/src/jobs/__fixtures__/d1-fake.ts` 等）で prepare 引数を記録する仕組みがあるか確認し、無ければ query string assertion を追加する。
3. T-04 から T-06 は既存 spec を維持し、T-06 の expected を `source='unknown'` で確定する。
4. T-07 / T-08 は CI 上の静的 grep ステップとして Phase 11 evidence に記録する。

## 統合テスト連携

| コマンド | 成功条件 |
| --- | --- |
| `mise exec -- pnpm --filter @repo/api test -- resolve-stable-key` | PASS |
| `mise exec -- pnpm --filter @repo/api test -- schemaQuestions` | PASS |
| `mise exec -- pnpm --filter @repo/api test` | 全 API tests PASS |
| `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` | 0 件 |

## 多角的チェック観点（AIが判断）

- T-03 で D1 mock の query log assertion が技術的に困難な場合、static grep（T-07）+ source-level assertion（T-08）で代替できているか。
- T-06 の `source='unknown'` 経路が、後段 `forms-schema-sync.ts` で `schema_diff_queue` enqueue されることまでカバーされているか（必要なら T-09 を追加）。

## サブタスク管理

| サブタスク | 出力 |
| --- | --- |
| repository tests | unit test |
| sync tests | resolve-stable-key spec 更新 |
| static guard | grep |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| テスト戦略 | `phase-04.md` | T-01 から T-09 |

## 完了条件

- [ ] alias hit / alias miss / 静的検査が揃っている
- [ ] Phase 1 AC を全て検証できる
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Test ID と AC の対応が Phase 7 に引き継げる

## 次Phase

Phase 5: 実装計画
