# Phase 11 Manual Smoke Log

## 実行タスク

| # | 実行コマンド | 期待結果 | 実測 | 判定 |
|---|-------------|---------|------|------|
| 1 | `test -f CLAUDE.md && test -f docs/00-getting-started-manual/specs/00-overview.md && test -f docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | exit 0 | exit 0 | PASS |
| 2 | `grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md` | 1 行以上 | 3 行以上 | PASS |
| 3 | `grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md` | 1 行以上 | 1 行以上 | PASS |
| 4 | `grep -cE "^\| (公開\|会員\|管理\|共通) \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 19 | 19 | PASS |
| 5 | `grep -c "^\| 公開 \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 6 | 6 | PASS |
| 6 | `grep -c "^\| 会員 \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 2 | 2 | PASS |
| 7 | `grep -c "^\| 管理 \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 8 | 8 | PASS |
| 8 | `grep -c "^\| 共通 \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 3 | 3 | PASS |
| 9 | `mise exec -- pnpm lint` | exit 0 | exit 0（dependency-cruiser PASS、stablekey literal warning 2 件、workspace lint Done） | PASS |
| 10 | `git diff --cached --name-only \| wc -l` | 243 件の staged docs/archive diff を把握 | 243 | PASS |
| 11 | `git diff --cached --name-only \| rg -v '^(docs/\|CLAUDE\\.md$\|\\.claude/skills/aiworkflow-requirements/)'` | apps/packages 変更なし | 出力なし | PASS |
| 12 | `git diff --name-status` | task-01 scope + archive 整理のみ | 5 dir は `docs/30-workflows/completed-tasks/` 配下への rename/archive として残存、純削除なし | PASS |

## 目的

task-01 の docs-only / NON_VISUAL evidence として、正本 docs の存在・anchor・route count を決定論的に確認する。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| scope SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | route count 正本 |
| phase 11 spec | `../../phase-11.md` | evidence 要件 |

## 成果物

| 成果物 | パス |
| --- | --- |
| smoke log | `outputs/phase-11/manual-smoke-log.md` |

## 完了条件

- [x] 正本 docs の存在と anchor を確認した。
- [x] 19 routes の層別検算を確認した。
- [x] `mise exec -- pnpm lint` exit 0 を確認した。
- [x] diff scope blocker は completed-tasks archive と archive rule 同期で解消済みである。
