# Phase 13: PR

[実装区分: 実装仕様書]

## 1. ブランチ命名

`feat/issue-746-parallel-09-visual-evidence`

## 2. コミット分割

| 順 | 範囲 | message |
|----|------|---------|
| 1 | spec パッチ | `fix(parallel-09): redirect evidenceDir to completed-tasks path (Refs #746)` |
| 2 | 12 PNG | `chore(parallel-09): capture 12 visual baseline PNGs (Refs #746)` |
| 3 | state 更新 + workflow root | `docs(parallel-09): mark phase-11 evidence completed (Refs #746)` |

## 3. PR base

`dev`（CLAUDE.md ブランチ戦略に従う）

## 4. PR title

`feat(issue-746): parallel-09 visual evidence completion (12 PNGs)`

## 5. PR body テンプレート

```markdown
## Summary
- parallel-09 UX cross-cutting primitives の Playwright visual baseline 12 PNG を取得
- `evidenceDir` パスを `completed-tasks/` 配下に修正（旧パスは workflow 移動で broken だった）
- Phase 11 evidence claim を `runtime_pending → completed` に更新
- ENOSPC リカバリ手順を runbook 化

Refs #746

## 背景
Issue #746 は closed 状態だが deliverables 未完了。本 PR は closed-issue canonical workflow root recovery パターンで補完する。

## 変更ファイル
- `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts`（evidenceDir パッチ）
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/*.png`（12 新規）
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md`（state 更新）
- `docs/30-workflows/unassigned-task/parallel-09-followup-001-...md`（consumed 化）
- `docs/30-workflows/issue-746-parallel-09-playwright-visual-evidence-completion/`（workflow root 後付け）

## スクリーンショット
親 workflow 配下に 12 PNG を配置:
`docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/`

| ID | 1x | 2x |
|----|----|----|
| 01 formfield-error | 01-formfield-error.png | 01-formfield-error@2x.png |
| 02 icon-4sizes | 02-icon-4sizes.png | 02-icon-4sizes@2x.png |
| 03 breadcrumb | 03-breadcrumb.png | 03-breadcrumb@2x.png |
| 04 focus-visible | 04-focus-visible.png | 04-focus-visible@2x.png |
| 05 pagination-disabled | 05-pagination-disabled.png | 05-pagination-disabled@2x.png |
| 06 empty-state | 06-empty-state.png | 06-empty-state@2x.png |

## Test plan
- [x] `mise exec -- pnpm --dir apps/web typecheck` exit 0
- [x] `mise exec -- pnpm --dir apps/web lint` exit 0
- [x] `mise exec -- pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts` 0 fail / 12 PNG
- [x] 各 PNG ≤ 500KB
- [x] 視覚的整合（不変条件3）目視 OK

## 注意
- Issue は **closed のまま**（`Refs #746` のみ、`Closes #746` 禁止）
- governance mutation を含まない（branch protection / wrangler / d1 変更なし）
```

## 6. PR 作成コマンド（参考）

```bash
gh pr create --base dev --title "feat(issue-746): parallel-09 visual evidence completion (12 PNGs)" --body-file <(echo "<上記 body>")
```

ユーザー明示指示があるまで実行しないこと。
