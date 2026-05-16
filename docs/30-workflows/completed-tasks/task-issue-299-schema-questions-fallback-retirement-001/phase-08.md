# Phase 8: DRY/責務確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | 責務境界と重複排除 |

## 目的

fallback 削除が `schema_aliases` を stableKey 解決の唯一の正本として責務統一できているか、無関係経路を巻き添えにしていないか確認する。

## 実行タスク

- D1 access が `apps/api` に閉じていることを確認する（unchanged）。
- `findStableKeyByQuestionId` が alias lookup の単一委譲になっているか確認する。
- 03a / 07b / `updateStableKey` / `listFieldsByVersion` / alias backfill workflow に副作用が出ていないか確認する。
- 同等の fallback ロジックが他ファイル（例: `apps/api/src/sync/schema/*`、`apps/api/src/workflows/schemaAlias*`）で別実装されていないか確認する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Architecture boundaries | `.claude/skills/aiworkflow-requirements/references/architecture-overview.md` | 境界 |
| 上流実装 phase-08 | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/phase-08.md` | 既存責務境界 |

## 実行手順

1. `rg -n "findStableKeyByQuestionId|stable_key FROM schema_questions" apps/api packages` を確認する。
2. `findStableKeyByQuestionId` の呼び出し元（`apps/api/src/sync/schema/resolve-stable-key.ts` 含む）が変更なしで動作するか確認する。
3. `apps/web` / `packages/shared` への波及がないことを確認する（本タスクは D1 access 範囲のため不変のはず）。
4. doc comment の更新が記述レベルで responsibility を反映しているか確認する。

## 統合テスト連携

| コマンド | 目的 |
| --- | --- |
| `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` | fallback 経路 0 件 |
| `rg -n "findStableKeyByQuestionId" apps/api` | 呼び出し元列挙、不変確認 |
| `rg -n "D1Database\|DB" apps/web packages` | 境界漏れ 0 件（既存基準） |

## 多角的チェック観点（AIが判断）

- fallback と類似 SQL（例: `SELECT stable_key FROM schema_questions WHERE ...`）を別経路（schemaAliasAssign の back-fill 等）と混同していないか。
- 一度しか使わない薄い abstraction を追加していないか。

## サブタスク管理

| サブタスク | 完了条件 |
| --- | --- |
| boundary scan | violations 0 |
| duplication scan | 同等 fallback の他経路 0 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| DRY/責務確認 | `phase-08.md` | boundary checklist |

## 完了条件

- [ ] D1 access 境界が守られている
- [ ] 同等 fallback の他経路がない
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 9 の品質ゲートへ確認項目を渡した

## 次Phase

Phase 9: 品質保証
