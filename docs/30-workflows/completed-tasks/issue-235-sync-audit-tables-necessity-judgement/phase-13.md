# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| implementation_mode | verify_existing |
| 前 Phase | 12（ドキュメント更新） |
| 次 Phase | なし（最終 Phase） |
| 主成果物 | outputs/phase-13/pr-info.md |
| 実行条件 | **ユーザー明示承認後のみ実行** |
| PR base | dev（production リリース時のみ main） |

## 目的

本判定タスクの成果物（判定仕様書 + outputs 一式）を PR としてまとめ、`dev` ブランチへ統合する。本 Phase の `git add` / `commit` / `push` / `gh pr create` は **すべてユーザーの明示承認後にのみ実行する**。承認前は `outputs/phase-13/pr-info.md` に PR ドラフトを記録するに留め、リポジトリへの変更操作を一切行わない。

> **重要**: 本タスクは docs-only / 設計判定であり、コード差分は 0 件。PR は判定証跡の文書化のみを含む。判定結論「新設不要」によりマイグレーション追加・`apps/api` 実装変更は発生しない。

## 実行タスク

> 以下 2 以降は **ユーザー明示承認後のみ** 実行する。承認がない間はステップ 1（ドラフト作成）で停止する。

1. **PR ドラフト作成（承認不要）**: `outputs/phase-13/pr-info.md` に PR タイトル案 / base ブランチ / 本文ドラフト / 含む成果物一覧 / 未承認である旨を記録する。
2. **ブランチ確認・同期（承認後）**: 作業ブランチを確認し、`git fetch origin dev` でローカル `dev` を `origin/dev` に同期、作業ブランチへ `dev` を取り込む。コンフリクトは CLAUDE.md §コンフリクト解消の既定方針に従い解消する。
3. **差分確認（承認後）**: `git status --porcelain` と `git diff dev...HEAD --name-only` で PR 対象ファイルを確認する。`apps/` / `packages/` に差分が 0 件であること（docs-only）を確認する。
4. **品質検証（承認後）**: docs-only ゲートとして `bash scripts/verify-pr-ready.sh`（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift の一括検証）を実行する。
5. **PR 作成（承認後）**: `gh pr create --base dev` で PR を作成する。本文は `outputs/phase-13/pr-info.md` のドラフトを正本とする。Issue #235 は CLOSED 維持のため `Refs #235`（`Closes` ではない）で参照する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] `outputs/phase-13/pr-info.md` に PR ドラフトが記録されている（PR タイトル / base=dev / 本文 / 成果物一覧 / 未承認明記）
- [ ] ユーザー承認がない間はリポジトリへの変更操作（commit/push/PR）を一切行っていない
- [ ] （承認後）`apps/` / `packages/` 差分 0 件が確認されている
- [ ] （承認後）docs-only ゲート（verify:phase12-compliance / gate-metadata:validate / indexes）が PASS
- [ ] （承認後）PR が `--base dev` で作成され、`Refs #235` で CLOSED Issue を reopen せず参照している

## 成果物/実行手順

- `outputs/phase-13/pr-info.md`
