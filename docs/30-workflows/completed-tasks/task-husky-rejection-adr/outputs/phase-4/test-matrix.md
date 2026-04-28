# Phase 4: test-matrix.md

日付: 2026-04-28

docs-only タスクのため、テストは「ドキュメントレビュー観点」「リンク死活」「ADR 単独可読性」を docs 検証として記述する。

## 1. AC × 検証観点マトリクス

| 検証 ID | 対象 AC | 検証観点 | 検証手段 | 実施 Phase |
| --- | --- | --- | --- | --- |
| T-01 | AC-1 | `doc/decisions/` 存在 + README 命名規約記載 | `ls doc/decisions/` + 目視 | Phase 7 / Phase 11 |
| T-02 | AC-1 | ファイル名が `0001-git-hook-tool-selection.md` | `ls doc/decisions/` | Phase 7 / Phase 11 |
| T-03 | AC-2 | ADR-0001 内に Status / Context / Decision / Consequences / Alternatives Considered / References 見出しが存在 | `grep -E '^## ' doc/decisions/0001-*.md` | Phase 7 / Phase 11 |
| T-04 | AC-3 | Alternatives Considered に 3 サブ節（A. husky / B. pre-commit / C. native git hooks） | `grep -E '^### [ABC]\.' doc/decisions/0001-*.md` | Phase 7 / Phase 11 |
| T-05 | AC-3 | 各候補に「不採用理由」見出しまたは段落が存在 | 目視レビュー | Phase 11 |
| T-06 | AC-4 | `phase-2/design.md` に backlink が存在 | `grep '0001-git-hook-tool-selection' phase-2/design.md` | Phase 11 |
| T-07 | AC-4 | `phase-3/review.md` に backlink が存在 | `grep '0001-git-hook-tool-selection' phase-3/review.md` | Phase 11 |
| T-08 | AC-4 | backlink の相対パスが解決する（`../../../../../../doc/decisions/0001-...md`） | 相対パス計算 + ファイル存在確認 | Phase 11 |
| T-09 | AC-5 | ADR を未関連 outputs 抜きに読んで判断履歴が辿れる | 目視レビュー（チェックリスト Phase 3 §5） | Phase 11 |
| T-10 | AC-5 | Decision に lane 表が ADR 内に存在（lefthook.yml を読まずに適用境界が分かる） | `grep -E 'main-branch-guard|staged-task-dir-guard|stale-worktree-notice' doc/decisions/0001-*.md` | Phase 11 |
| T-11 | AC-6 | ADR Decision の lane 名と `lefthook.yml` の lane 名が一致 | 両ファイル diff 目視 | Phase 11 |
| T-12 | AC-6 | ADR Consequences の「post-merge 廃止」記述と `lefthook-operations.md` の記述が矛盾しない | 目視レビュー | Phase 11 |

## 2. 自己完結性チェック項目

ADR-0001 を単独で開いて以下が満たされること:

- [ ] 「なぜ採用したか」を Context のみで答えられる
- [ ] 「何を採用したか」を Decision のみで答えられる
- [ ] 「何が起こるか」を Consequences のみで答えられる
- [ ] 「なぜ husky/pre-commit/native ではないか」を Alternatives Considered のみで答えられる
- [ ] 一次資料を読みたい場合に References から到達可能

## 3. backlink 有効性確認手順

```bash
# 派生元 → ADR の解決確認
( cd docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2 && \
  test -f ../../../../../../doc/decisions/0001-git-hook-tool-selection.md && echo OK )
( cd docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3 && \
  test -f ../../../../../../doc/decisions/0001-git-hook-tool-selection.md && echo OK )
```

## 4. Phase への引き継ぎ ID

- Phase 7（カバレッジ確認）: T-01〜T-04, T-06, T-07, T-10
- Phase 11（manual-smoke / link-checklist）: T-01〜T-12 全件
