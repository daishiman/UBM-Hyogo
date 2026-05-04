# Phase 11 — NON_VISUAL evidence

## ADR 存在
`rg -n "ADR-001 runtime SSOT 配置" docs/30-workflows/_design/sync-jobs-spec.md` → L23

## owner 表行
`rg -n "sync-jobs-schema\.ts" docs/30-workflows/_design/sync-shared-modules-owner.md` → L9, L18

## 1-hop 到達 (spec → owner)
`rg -n "sync-shared-modules-owner" docs/30-workflows/_design/sync-jobs-spec.md` → L53, L68, L74, L122

## 1-hop 到達 (owner → spec)
`rg -n "_design/sync-jobs-spec" docs/30-workflows/_design/sync-shared-modules-owner.md` → L18

## typecheck / lint / vitest
すべて exit 0。実ログは同ディレクトリに保存済み:

- `vitest-sync-jobs-schema.log`: `@ubm-hyogo/api` test run 104 files / 647 tests PASS（focused command が API package 全体を実行）
- `typecheck.log`: `mise exec -- pnpm typecheck` exit 0
- `lint.log`: `mise exec -- pnpm lint` exit 0（stablekey literal は warning-mode 150 件、command 自体は PASS）

## indexes drift
`mise exec -- pnpm indexes:rebuild` 後の generated index 差分は同 PR 範囲内に含める。`indexes-drift.log` は `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` の modified を記録し、追加生成漏れがないことを確認する証跡として保存した。

## secret-hygiene grep
`rg -n -i "(api[_-]?key|secret|token|password)" docs/30-workflows/_design/sync-jobs-spec.md docs/30-workflows/_design/sync-shared-modules-owner.md` → ヒットなし

## evidence ファイル

`outputs/phase-11/` には `main.md` に加え、17 件の `.log`、`manual-smoke-log.md`、`link-checklist.md` を保存した。NON_VISUAL のため screenshot は不要。
