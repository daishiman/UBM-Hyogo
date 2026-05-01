# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | テストケースと検証コマンド定義 |

## 目的

実装前に repository、route、03a lookup、static guard のテストを定義する。

## 実行タスク

| ID | 種別 | 対象 | 期待 |
| --- | --- | --- | --- |
| T-01 | migration | `schema_aliases` DDL | table/index が存在 |
| T-02 | repository | duplicate alias | 409/422 相当で失敗 |
| T-03 | route | apply | alias insert + queue resolved |
| T-04 | route | dryRun | 書き込みなしで影響件数 |
| T-05 | sync | alias hit | `schema_aliases` を優先 |
| T-06 | sync | fallback hit | `schema_questions.stable_key` read only |
| T-07 | sync | lookup transient error | failure + retry |
| T-08 | static | direct update | grep 0 件 |
| T-09 | route | manual resolve actor | `resolved_by` が必須で記録される |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| int-test-skill 対象 | `apps/api` | D1 repository/route contract |
| 07b tests | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/phase-04.md` | 既存 test matrix |

## 実行手順

1. `apps/api` の既存 test runner と D1 mock/miniflare pattern を確認する。
2. T-01 から T-09 を最小テスト単位へ分割する。
3. route contract は HTTP path 維持を assertion に含める。
4. static guard は CI に載せるか、最低でも Phase 11 evidence として記録する。

## 統合テスト連携

| コマンド | 成功条件 |
| --- | --- |
| `mise exec -- pnpm --filter @repo/api test` | 全 API tests PASS。repository tests は `apps/api/src/repository/__tests__/`、route/authz/invariants は `apps/api/src/__tests__/` の既存慣例に合わせる |
| `rg -n "UPDATE schema_questions SET stable_key" apps packages` | 0 件、または migration/comment など実行経路外のみ |

## 多角的チェック観点（AIが判断）

- transient error と miss のテスト名を分けているか。
- dryRun が write path を通らないことを確認できるか。
- D1 batch の atomicity を failure injection で検証できるか。

## サブタスク管理

| サブタスク | 出力 |
| --- | --- |
| repository tests | contract test |
| route tests | Hono route contract |
| sync tests | alias-first lookup |
| static guard | grep/script |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| テスト戦略 | `phase-04.md` | T-01 から T-09 |

## 完了条件

- [ ] 正常系・異常系・静的検査が揃っている
- [ ] Phase 1 AC を全て検証できる
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Test ID と AC の対応が Phase 7 に引き継げる

## 次Phase

Phase 5: 実装計画
