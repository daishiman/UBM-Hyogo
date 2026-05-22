# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 9 / 品質保証 |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 9 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 9 の判断結果を `outputs/phase-09/qa-report.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-09/qa-report.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 9 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-09/qa-report.md` に集約する。

## 詳細

## 1. QA gate

| gate | コマンド | 期待 |
|------|----------|------|
| typecheck | `mise exec -- pnpm typecheck` | 0 error（docs-only のため影響なし、念のため実行） |
| lint | `mise exec -- pnpm lint` | 0 error |
| markdown link check | `npx markdown-link-check docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | 全リンク resolve |
| line budget | `wc -l docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | ≤ 400 行（表 + 軸別詳細） |
| aiworkflow sync parity | `.claude/skills/aiworkflow-requirements/{indexes,references,changelog}` の task-25 entries を確認 | quick-reference / resource-map / task-workflow-active / artifact inventory / changelog が同一内容 |
| diff scope | `git diff --name-only dev...HEAD` | `apps/` / `scripts/` / `.github/` への変更ゼロ、docs と aiworkflow 正本同期のみ |

## 2. diff scope 規律

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md §6` に準拠:

- 本 task 仕様書配下（`docs/30-workflows/task-25-.../`）
- 主成果物 `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `SCOPE.md` の task-25 参照行
- `.claude/skills/aiworkflow-requirements/` の quick-reference / resource-map / task-workflow-active / changelog / artifact inventory

それ以外の path は touch しない。`.github/workflows/playwright-smoke.yml` の step label `Run 19-route smoke` は task-18 由来の stale label として matrix の Drift Notes で分類し、task-25 では workflow file を変更しない。

## 3. 完了条件

- 上記 gate の static checks が current facts と一致
- matrix の 19 surface 行 / 4 visual baseline / CI gate 参照が source of truth と一致
