[実装区分: 実装仕様書]

# Phase 13: PR 作成

## 目的

task-709 の成果を dev base PR として提出する。

## 1. PR 作成結果

| 項目 | 値 |
| --- | --- |
| PR | https://github.com/daishiman/UBM-Hyogo/pull/760 |
| 番号 | #760 |
| base | `dev` |
| head | `task/709-visual-baseline-runtime-capture` |
| state | `OPEN` |
| mergeStateStatus | `DIRTY` |
| title | `feat(task-709): visual baseline runtime capture (51 PNG, 17 routes × 3 viewports)` |

`gh pr create` は user approval 後に実行済み。現時点では PR #760 が open だが、`mergeStateStatus=DIRTY` のため merge 前に conflict 解消が必要。

## 2. PR 作成コマンド（実行済み）

```bash
gh pr create --base dev --title "feat(task-709): visual baseline runtime capture (17 routes × 3 viewport)" --body "$(cat <<'EOF'
## Summary

- Issue #709 の visual baseline expansion を runtime capture + workflow 復活で完遂
- task-18-fu で構築済みの infra（`visual-full-chromium-{desktop,tablet,mobile}` project, `full-visual.spec.ts`, 2 workflow）に対し、51 PNG baseline を CI 経由で取得・コミット
- `.github/workflows/playwright-visual-full.yml` の MVP-PAUSE 解除（`pull_request:` trigger 復活）

## 変更内容

| 種別 | パス | 件数 |
|------|------|------|
| 新規 | `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | 51 |
| 編集 | `.github/workflows/playwright-visual-full.yml` | 1 |
| 編集 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | 1 |
| 新規 | `docs/30-workflows/task-709-visual-baseline-runtime-capture/**` | 13 phase + outputs |

## Test plan

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `playwright-visual-full.yml` が CI で 2 連続 PASS（3 viewport × 2 run = 6 job）
- [ ] `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` に 51 PNG
- [ ] `SMOKE-COVERAGE-MATRIX.md` の Visual baseline 表記が 17/19

## Evidence

- `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-9/qa.md`
- `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-11/evidence/baseline-list.md`

## 残課題（後続タスク申し送り）

- dev/main branch protection への `playwright-visual-full / visual-full (chromium, *)` required check 統合（governance 別承認サイクル、`docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md`）

Closes #709

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 3. PR 作成前チェック

```bash
git status --porcelain                                         # 空
git diff origin/dev...HEAD --name-only | wc -l                 # 13+ files
ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/ | wc -l   # 51
grep -E '17/19' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md
```

## 4. 注意事項

- `--base dev` を必ず指定（CLAUDE.md 既定方針）
- baseline-update PR (Phase 5 Step 4 で生成された一時 PR) は `gh pr close --delete-branch` で閉じる
- PR #760 は open だが `mergeStateStatus=DIRTY`。merge 前に conflict 解消が必要
- `pull_request` trigger は target branch `dev` 側 workflow が更新された次 PR から自然発火するため、本 PR では `workflow_dispatch` 2-run stability evidence を正本とする

## 5. 成果物

- 本ファイル `phase-13-pr.md`
