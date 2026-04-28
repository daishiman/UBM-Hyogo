# Phase 13: local-check-result.md

日付: 2026-04-28

## 1. ファイル存在確認（実行済み）

```bash
ls doc/decisions/0001-git-hook-tool-selection.md doc/decisions/README.md
# → 両ファイル存在
```

期待: 両ファイルが list される。
結果: PASS。

## 2. 必須セクション存在（コマンド & 期待）

```bash
grep -E '^## (Status|Context|Decision|Consequences|Alternatives Considered|References)' \
  doc/decisions/0001-git-hook-tool-selection.md | wc -l
```

期待: 6 行。
結果: PASS（Phase 11 manual-smoke-log T-03 で確認済み）。

## 3. Alternatives 3 サブ節

```bash
grep -E '^### [ABC]\. ' doc/decisions/0001-git-hook-tool-selection.md
```

期待: `### A. husky（不採用）` / `### B. pre-commit ...` / `### C. native git hooks ...` の 3 行。
結果: PASS（Phase 11 T-04 で確認済み）。

## 4. backlink 存在

```bash
grep '0001-git-hook-tool-selection' \
  docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md \
  docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md
```

期待: 各ファイル 1 ヒットずつ。
結果: PASS（Phase 11 T-06, T-07 で確認済み）。

## 5. backlink 相対パス解決

```bash
( cd docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2 && \
  test -f ../../../../../../doc/decisions/0001-git-hook-tool-selection.md && echo phase-2 OK )
( cd docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3 && \
  test -f ../../../../../../doc/decisions/0001-git-hook-tool-selection.md && echo phase-3 OK )
```

期待: `phase-2 OK` と `phase-3 OK`。
結果: PASS（Phase 11 T-08 で確認済み）。

## 6. 既存正本との整合（lane 名）

```bash
grep -E '(main-branch-guard|staged-task-dir-guard|stale-worktree-notice)' \
  doc/decisions/0001-git-hook-tool-selection.md lefthook.yml
```

期待: ADR と `lefthook.yml` の双方で同じ 3 つの lane 名がヒット。
結果: PASS（Phase 11 T-11 で確認済み）。

## 7. 実行できなかったもの

- markdown linter（プロジェクトに導入されていないためスキップ）
- 自動リンクチェッカー（同上、目視 + `test -f` で代替）

## 結論

ローカル確認結果は PASS。Phase 13 main.md の AC 判定と一致。
