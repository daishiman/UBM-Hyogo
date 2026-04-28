# Phase 11: manual-smoke-log.md

日付: 2026-04-28

## 実行環境

- worktree: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170828-wt-7`
- 検証日: 2026-04-28

## test-matrix 実行ログ

| ID | 内容 | 結果 | 備考 |
| --- | --- | --- | --- |
| T-01 | `doc/decisions/` 存在 + README | PASS | `0001-git-hook-tool-selection.md` と `README.md` を確認 |
| T-02 | ファイル名規約 | PASS | `0001-git-hook-tool-selection.md` |
| T-03 | 必須 6 セクション存在 | PASS | Status / Context / Decision / Consequences / Alternatives Considered / References を `## ` で確認 |
| T-04 | Alternatives 3 サブ節 | PASS | `### A. husky` / `### B. pre-commit` / `### C. native git hooks` |
| T-05 | 各候補の不採用理由 | PASS | 各節に「不採用理由:」段落と評価表 |
| T-06 | phase-2/design.md backlink | PASS | ADR ライト表直後に追記 |
| T-07 | phase-3/review.md backlink | PASS | 第5節末尾・「## 6. 結論」直前に追記 |
| T-08 | backlink 相対パス解決 | PASS | `../../../../../../doc/decisions/0001-git-hook-tool-selection.md` で解決 |
| T-09 | 単独可読性 | PASS | 派生元 outputs を未読でも判断履歴が辿れる（インライン抜粋あり） |
| T-10 | Decision lane 表存在 | PASS | main-branch-guard / staged-task-dir-guard / stale-worktree-notice |
| T-11 | lane 名一致 | PASS | `lefthook.yml` と ADR で完全一致 |
| T-12 | post-merge 廃止記述の整合 | PASS | `lefthook-operations.md` と矛盾なし |

## ADR 単独可読性チェックリスト（Phase 3 §5）実行結果

- [x] Context で「なぜ Git hook ツールが必要だったか」が分かる
- [x] Decision で採用方針 5 項目が一意に分かる
- [x] Decision の lane 表で `lefthook.yml` を読まなくても適用境界が分かる
- [x] Consequences で Positive と Negative/Trade-off が分離されている
- [x] Alternatives Considered の 3 候補各々で不採用理由が独立節
- [x] References のリンクが全て解決する
- [x] 派生元 outputs を未読でも判断履歴が辿れる

## NON_VISUAL 証跡

本タスクは `docs-only` / `NON_VISUAL` で、UI route・画面実装・スクリーンショット対象がない。Phase 11 の証跡は `main.md` / `manual-smoke-log.md` / `link-checklist.md` の3点で完結するため、`screenshot-plan.json` と `screenshots/` は作成しない。

## 結論

全項目 PASS。Phase 12 ドキュメント更新へ進む。
