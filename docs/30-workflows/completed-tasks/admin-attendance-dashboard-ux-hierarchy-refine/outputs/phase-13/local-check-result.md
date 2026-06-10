# Phase 13 — PR 前ローカル検証結果

> ステータス: `implemented_local_checks_pass_visual_capture_pending`。commit / PR / push は user 承認後のみ。

---

## 1. 想定検証コマンド（CLAUDE.md「PR作成の完全自律フロー」§5）

| # | コマンド | 目的 | 本サイクル結果 |
| --- | --- | --- | --- |
| 1 | `mise exec -- pnpm install --force` | 依存整合 | 未実行（依存変更なし） |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 型チェック | PASS |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | リント | PASS |
| 4 | `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine --strict --json` | task-spec strict gate | PASS（errors 0 / warnings 0） |

## 2. VISUAL タスク固有の追加検証（実装サイクル）

| # | コマンド | 目的 | 本サイクル結果 |
| --- | --- | --- | --- |
| 5 | `pnpm exec vitest run apps/web/src/features/admin/attendance --root .` | 出席 feature の component / lib spec | PASS（8 files / 23 tests） |
| 6 | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | HEX / token gate | PASS（9 tests） |
| 7 | `mise exec -- pnpm --filter @ubm-hyogo/web exec next build --webpack` | OpenNext Workers 互換ビルド | 未実行（focused gate で代替。本サイクルの変更は client/server component + CSS のみ） |

## 3. 失敗時の自動修復方針（CLAUDE.md 準拠）

| 失敗 | 修復方針 |
| --- | --- |
| install 失敗 | lockfile 不整合を疑い最小再生成 |
| typecheck 失敗 | unused import / null 許容 / 型注釈漏れ / export-import 不整合を最小差分で修正 |
| lint 失敗 | `pnpm lint --fix` → 残違反を手修正 |
| verify-pr-ready 失敗 | `pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従い gate-metadata → phase12-compliance → indexes drift の順で切り分け |

> 最大 3 回まで自動修復し、修復差分をコミットする（ただし commit 自体は user 承認後）。

## 4. 現在の記録

| 項目 | 値 |
| --- | --- |
| 実行状態 | focused Vitest / typecheck / lint / verify-design-tokens / task-spec strict gate は PASS |
| 未実行 | install（依存変更なし）/ next build（時間コストの高い広域 gate。PR 前に実行対象）/ visual capture 8 PNG |
| 承認境界 | 修復差分の commit も含め user 承認後のみ |
