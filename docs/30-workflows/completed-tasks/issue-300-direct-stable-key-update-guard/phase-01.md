[実装区分: 実装仕様書]

# Phase 1: 要件定義 / AC 確定 / verify script placeholder 配置

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-01/main.md` |
| 前 Phase | なし |
| 次 Phase | Phase 2 |
| visualEvidence | NON_VISUAL |

## 目的

issue #300 / 起票元 unassigned `task-issue-191-direct-stable-key-update-guard-001` から
要件を読み取り、Phase 1〜13 が引き継ぐ acceptance criteria を確定する。

## P50 チェック（Step 0）

- `git log --oneline -- apps/api/src/repository/schemaQuestions.ts | head -5` で既実装 caller を確認する
- `rg -n "updateStableKey" apps packages` の結果が **定義 1 件のみ・caller 0 件** であることを確認する（dead code 削除前提）
- 既存 `scripts/lint-stablekey-literal.mjs` が「stableKey 文字列リテラル直書き」の guard であり、本タスクの「stable_key 直更新」guard と **責務が異なる** ことを確認する

## 実行タスク

1. issue 本文と起票元 unassigned-task を `index.md` に転記する
2. acceptance criteria を AC-1〜AC-8 で番号付け列挙する
3. `outputs/phase-04/grep-gate-placeholder.sh` 相当の verify script placeholder（exit 0 + TODO）の配置計画を Phase 4 へ送る
4. Phase 1 で `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` を確定する

## Acceptance Criteria

| ID | 内容 |
| --- | --- |
| AC-1 | `UPDATE schema_questions SET stable_key` を含む文字列リテラル / template literal を検出して violation 列挙する |
| AC-2 | `.update(schemaQuestions)` 形式の drizzle-style builder を検出する（chained `.set({ stable_key / stableKey })` も検出対象） |
| AC-3 | multiline SQL（`UPDATE schema_questions` と `SET stable_key` が別行）も検出する |
| AC-4 | 例外許可は `migrations/`, `**/__fixtures__/**`, `**/__tests__/**`, `**/*.spec.ts`, `**/*.spec.tsx`, `node_modules`, `.next`, `coverage`, `dist`, `.open-next` のみ |
| AC-5 | 失敗 message に `schema_aliases` テーブルと `POST /admin/schema/aliases` への誘導を含む |
| AC-6 | `--strict` flag または `STABLE_KEY_UPDATE_LINT_MODE=error` で warning → error 昇格できる |
| AC-7 | CI workflow `verify-stable-key-update.yml` が `dev` / `main` への push / PR で実行される |
| AC-8 | dead code `updateStableKey()` を削除し、削除後に typecheck / lint / test / grep-gate / wrapper-free build PASS と `mise` build boundary 分離記録が取れる |

## 参照資料

- 起票元: `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md`
- 不変条件 #14
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` § Schema Alias Resolution Contract
- 既存 guard: `scripts/lint-stablekey-literal.mjs`（責務は異なるが構造の参考）

## 統合テスト連携

Phase 4 fixture（violation 4 種 / allowed 2 種）で AC-1〜AC-6 を網羅。Phase 7 CI workflow で AC-7、Phase 5 dead code 削除で AC-8 を担保。

## 成果物

- `outputs/phase-01/main.md`

## 完了条件

- [ ] AC-1〜AC-8 が `outputs/phase-01/main.md` に番号付き列挙されている
- [ ] `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` が確定
- [ ] 既存 `lint-stablekey-literal.mjs` との責務分離が文書化
- [ ] P50 チェックで `updateStableKey()` の caller が 0 件であることを確認

## 次Phase

Phase 2（設計）
