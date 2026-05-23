# Phase 6: 品質ゲート

[実装区分: 実装仕様書]

## 1. ゲート一覧

| ゲート | コマンド | 合格条件 |
|--------|----------|----------|
| typecheck | `mise exec -- pnpm --dir apps/web typecheck` | exit 0 |
| lint | `mise exec -- pnpm --dir apps/web lint` | exit 0 |
| playwright | `mise exec -- pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts --reporter=line` | exit 0, 12 PNG, 0 flaky |
| PNG count | `ls $EVID/*.png \| wc -l` | `12` |
| PNG size | `find $EVID -name '*.png' -size +500k` | 出力空 |
| PNG non-empty | `find $EVID -name '*.png' -size 0` | 出力空 |
| design-tokens grep | `mise exec -- pnpm verify-design-tokens` (task-18) | exit 0（既存 gate） |

`$EVID = docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots`

## 2. CLAUDE.md 不変条件チェック

- 不変条件3「プロトタイプ正本順位」: 12 PNG が `docs/00-getting-started-manual/claude-design-prototype/` の primitives と視覚的に整合（目視）
- 不変条件8「test ファイル suffix」: 既存 spec は `.spec.ts` で適合済み

## 3. governance gate

- 本タスクは branch protection mutation / wrangler deploy / d1 apply を含まない
- `governance_mutation_user_gate: false`（artifacts.json）
- そのため YAML frontmatter mutation 契約は不要

## 4. ゲート失敗時の判断

| 失敗ゲート | 対応 |
|-----------|------|
| typecheck | spec パッチに型誤り → Phase 3 §2 シグネチャを再確認 |
| playwright | Phase 5 §6 troubleshooting → 解決不能ならユーザーにエスカレーション |
| PNG size | viewport を 1280→1024 などに縮小して spec を再実行 |
| 視覚的整合 | primitive 実装側の問題 → 別 followup issue で扱う（本タスクスコープ外） |
