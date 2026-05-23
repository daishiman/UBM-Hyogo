[実装区分: 実装仕様書]

# issue-300 direct stable_key update guard — index

| 項目 | 値 |
| --- | --- |
| Workflow ID | `issue-300-direct-stable-key-update-guard` |
| Source Issue | #300（未タスク `task-issue-191-direct-stable-key-update-guard-001`） |
| Task Type | implementation / NON_VISUAL |
| Visual Evidence | NON_VISUAL（CI gate / static analysis） |
| Implementation Mode | implemented_local_runtime_pending（local 5 点 evidence 取得、PR/CI runtime は user gate） |
| Branch | `feat/issue-300-direct-stable-key-update-guard` |
| Coverage Tier | standard（Statements/Branches/Functions/Lines >= 80%） |
| Phases | 1〜13（Phase 13 は user approval gate により `blocked` 維持） |

## 目的

不変条件 #14（schema 変更の人手解決は `/admin/schema` 系 workflow に集約）と
`Schema Alias Resolution Contract`（`UPDATE schema_questions SET stable_key` 禁止）を
CI で恒久保護するため、direct stable_key 更新を静的に検出する guard を実装する。

## スコープ（含む）

1. 新規 guard script `scripts/lint-stable-key-update.mjs`
2. guard spec `scripts/lint-stable-key-update.spec.ts` と fixture 一式
3. dead code 削除: `apps/api/src/repository/schemaQuestions.ts` の `updateStableKey()`（caller 0 件確認済）
4. CI gate workflow `.github/workflows/verify-stable-key-update.yml`
5. `lefthook.yml` pre-commit 統合
6. `package.json` への `lint:stable-key-update` / `lint:stable-key-update:strict` script 追加
7. `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` の Schema Alias Resolution Contract への guard 実装パス追記

## 現在状態（2026-05-15）

実コード、CI workflow、hook、package script、正本仕様同期は同一 wave で反映済み。
local evidence は Phase 11 に保存済みで、GitHub Actions runtime green / commit / push / PR は Phase 13 user approval gate に残す。

## スコープ（含まない）

- `schema_aliases` DDL 適用
- 03a sync / 07b alias assignment の実装変更
- `/admin/schema/aliases` endpoint 実装
- `schema_questions.stable_key` fallback 廃止
- 既存 migration data の実変換

## 正本順位

1. 本 `index.md`
2. `phase-{01..13}.md` 本体
3. `outputs/phase-{01..13}/main.md`
4. `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
5. 起票元 unassigned-task: `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md`

## Phase 一覧

| Phase | 名称 | 主成果物 |
| --- | --- | --- |
| 1 | 要件定義 / AC 確定 / verify script placeholder 配置 | `outputs/phase-01/main.md` |
| 2 | 設計（検出パターン / 例外 / 失敗メッセージ） | `outputs/phase-02/main.md` |
| 3 | 設計レビュー / PASS-MINOR-MAJOR 判定 | `outputs/phase-03/main.md` |
| 4 | テスト設計 + fixture 設計（grep-gate を deterministic 化） | `outputs/phase-04/main.md` |
| 5 | guard script 実装 + dead code 削除 | `outputs/phase-05/main.md` |
| 6 | spec / fixture 実装 + coverage gate | `outputs/phase-06/main.md` |
| 7 | CI workflow / lefthook / package.json 統合 | `outputs/phase-07/main.md` |
| 8 | docs 同期（database-implementation-core.md） | `outputs/phase-08/main.md` |
| 9 | 品質検証 / grep gate / coverage-guard | `outputs/phase-09/main.md` |
| 10 | 最終レビュー / blocker 解消 | `outputs/phase-10/main.md` |
| 11 | NON_VISUAL local PASS 5 点取得 | `outputs/phase-11/main.md` + `evidence/` |
| 12 | documentation（7 ファイル必須セット） | `outputs/phase-12/*.md` |
| 13 | user approval gate（blocked 維持） | `outputs/phase-13/main.md` |

## 不変条件

1. `apps/web` から D1 直接アクセス禁止（本タスクは static analysis のみのため抵触なし）
2. 新規 test ファイルは `*.spec.ts` のみ（`*.test.ts` 禁止）
3. guard script 自体は `mise exec --` 経由で実行する Node スクリプトとする
4. fixture は `scripts/__fixtures__/stable-key-update-lint/` 配下に限定（既存 `EXCEPTION_GLOBS` の `__fixtures__` に整合）

## coverage AC

`bash scripts/coverage-guard.sh --no-run` を Phase 11 で実行し、現 worktree に coverage summary が無い境界を evidence 化する。
本タスクの同一 wave では focused spec 14/14 と guard scan を主証跡とし、full workspace coverage は PR/CI runtime boundary に残す。
