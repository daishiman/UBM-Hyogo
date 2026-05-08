# Manual Smoke Log

| # | 確認項目 | 実行 | 実測 | 判定 | evidence |
|---|----------|------|------|------|----------|
| 1 | visual literal gate | fenced JSX 除外 grep | zero hits | PASS | `evidence/grep-visual-values.log` |
| 2 | API trace | endpoint grep | current public/auth/me endpoints detected | PASS | `evidence/grep-api-trace.log` |
| 3 | login/profile copy | state / area grep | login 5+1 状態、profile 4 領域 hit | PASS | `evidence/grep-copy-text.log` |
| 4 | markdown validation | project script check + JSON parse | `lint:md` not configured, artifacts JSON parse PASS | PASS_WITH_SUBSTITUTION | `evidence/markdown-lint.log` |
| 5 | line inventory | `wc -l` | 09e / 09f 実体あり | PASS | `evidence/wc-lines.log` |
| 6 | section structure | heading grep | 09e=7, 09f=3 | PASS | `evidence/grep-section-count.log` |
| 7 | placeholder | `rg '§TBD|TODO'` | zero hits | PASS | `evidence/placeholder.log` |

実行日時: 2026-05-07 Asia/Tokyo

実行者: Codex in worktree `task-20260507-190331-wt-2`

主証跡: `grep-visual-values.log` / `grep-api-trace.log` / `grep-section-count.log` / `grep-invariants.log`

Screenshot 不在理由: `NON_VISUAL` / `docs-only`。実行時 UI は変更していない。
