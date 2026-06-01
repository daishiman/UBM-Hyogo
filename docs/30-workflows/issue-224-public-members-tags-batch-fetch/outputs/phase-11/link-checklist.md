# Phase 11 参照リンク健全性チェック

本タスク成果物が参照するリンク・パスの健全性を確認する。`implemented_local_evidence_captured` 段階のため、
実コードパスは実装済みファイルとして確認する。

## ドキュメント内リンク

| リンク先                                                        | 種別        | 状態 |
| --------------------------------------------------------------- | ----------- | ---- |
| `outputs/phase-1/requirements.md`                               | workflow 内 | OK（存在） |
| `phase-2.md`                                                    | workflow 内 | OK（存在） |
| `phase-3.md`                                                    | workflow 内 | OK（存在） |
| `outputs/phase-11/main.md`                                      | workflow 内 | OK（本 Phase で作成） |
| `outputs/phase-11/manual-smoke-log.md`                          | workflow 内 | OK（本 Phase で作成） |
| `outputs/phase-12/implementation-guide.md`                     | workflow 内 | OK（本 Phase で作成） |

## 実コード参照パス（変更対象・現存確認）

| パス                                                                  | 役割              | 状態 |
| --------------------------------------------------------------------- | ----------------- | ---- |
| `apps/api/src/_shared/search-query-parser.ts`                         | expand パース     | 現存（実装済み） |
| `packages/shared/src/zod/viewmodel.ts`                                | zod 契約          | 現存（実装済み） |
| `packages/shared/src/types/viewmodel/index.ts`                        | shared 型         | 現存（実装済み） |
| `apps/api/src/view-models/public/public-member-list-view.ts`          | view-model        | 現存（実装済み） |
| `apps/api/src/use-cases/public/list-public-members.ts`                | use-case 配線     | 現存（実装済み） |
| `apps/api/src/repository/memberTags.ts`                               | helper            | 現存（順序安定化済み） |
| `apps/api/src/routes/public/index.contract.spec.ts`                   | contract spec     | 現存（テスト追加済み） |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | use-case spec     | 現存（テスト追加済み） |

## 外部参照ドキュメント

| パス                                                                          | 状態 |
| ----------------------------------------------------------------------------- | ---- |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | OK（参照） |
| `.claude/skills/aiworkflow-requirements/references/error-handling.md`               | OK（参照） |
| `docs/30-workflows/unassigned-task/task-04a-followup-005-tags-bulk-fetch-n-plus-1-prevention.md` | OK（発見元メモ・実在確認） |

## 結果

- workflow 内リンク: 壊れリンクなし。
- 実コードパス: 変更対象ファイルはすべて現存（新規ファイル作成は本タスクでは zod の `PublicMemberTagZ` 追加のみで、既存ファイル内に閉じる）。
- 外部参照: 壊れリンクなし。
- 補足: `outputs/phase-1/requirements.md` 末尾の参照は `04a-followup-005-public-tags-batch-fetch-n1-prevention.md` と表記されているが、実在ファイル名は `task-04a-followup-005-tags-bulk-fetch-n-plus-1-prevention.md`。本タスク outputs では実在名を正とする（実装クローズ時に requirements.md の表記も実在名へ合わせることを推奨）。
