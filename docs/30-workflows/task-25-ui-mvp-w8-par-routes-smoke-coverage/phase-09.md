# Phase 9: 品質保証

## 1. QA gate

| gate | コマンド | 期待 |
|------|----------|------|
| typecheck | `mise exec -- pnpm typecheck` | 0 error（docs-only のため影響なし、念のため実行） |
| lint | `mise exec -- pnpm lint` | 0 error |
| markdown link check | `npx markdown-link-check docs/30-workflows/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`（任意） | 全リンク resolve |
| line budget | `wc -l docs/30-workflows/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | ≤ 400 行（表 + 軸別詳細） |
| mirror parity | N/A（本タスクは `.claude/skills/` を編集しない） | — |
| diff scope | `git diff --name-only dev...HEAD` | `apps/` / `scripts/` / `.github/` への変更ゼロ |

## 2. diff scope 規律

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md §6` に準拠:

- 本 task 仕様書配下（`docs/30-workflows/task-25-.../`）
- 主成果物 `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- 必要に応じて `SCOPE.md` への参照 1 行

それ以外の path は touch しない。

## 3. 完了条件

- 上記 gate がすべて green
- matrix の 19 行 / 4 visual baseline / CI gate 参照が source of truth と一致
