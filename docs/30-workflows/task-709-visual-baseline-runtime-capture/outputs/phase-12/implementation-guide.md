# Implementation Guide

## Part 1: 中学生レベル概念説明

このタスクは、Web サイトの画面写真を「正解の見本」としてそろえる作業です。学校で提出物の見本があると、後から出したものが見本と違うかすぐに確認できます。同じように、Web サイトでも正しい画面写真を先に用意しておくと、見た目が知らないうちに崩れたときに自動で気づけます。

今回は、これまで一部の画面 (4 枚) だけだった見本写真を、17 画面それぞれについてパソコン・タブレット・スマホの 3 種類、合計 **51 枚** に増やしました。写真は人のパソコンではなく、GitHub Actions という決まった実行場所 (`ubuntu-latest`) で作りました。人のパソコンで作ると、文字の見え方などが少し違って、あとで比べるときにずれることがあるからです。

実行と取り込みはユーザーの承認をもらってから行いました。

| 用語 | 日常語での説明 |
| --- | --- |
| baseline | 正解の見本写真 |
| visual regression | 見た目が知らないうちに変わること |
| viewport | 画面サイズ |
| CI | 決まった場所で自動確認する仕組み |
| user gate | ユーザーの許可を待つ関門 |

## Part 2: 技術者向け実装ガイド

### Summary

| Item | Value |
| --- | --- |
| Task | task-709 visual baseline runtime capture |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/709 |
| Base branch | `dev` |
| Task branch | `task/709-visual-baseline-runtime-capture` |
| Baseline source commit | `b3fb7f4a` (`chore/visual-baseline-update-25960870639`) |
| Baseline workflow run | https://github.com/daishiman/UBM-Hyogo/actions/runs/25960870639 |
| baseline PNG count | 51 (= 17 routes × 3 viewports) |

### Changes

| Type | Path | Notes |
| --- | --- | --- |
| edit | `.github/workflows/playwright-visual-full.yml` | `pull_request:` トリガーのコメントアウト解除 (paths 6 件復活) + MVP-PAUSE コメント削除 |
| add | `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | 51 baseline PNG (ubuntu-latest 取得、`b3fb7f4a` から cherry-pick) |
| edit | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | Visual baseline `4/19` → `17/19`、Coverage rows #2-#6/#10-#17 に slug 反映、Future Candidates の `Full visual regression baseline...` 行削除 |
| add | `docs/30-workflows/task-709-visual-baseline-runtime-capture/**` | Phase 1-13 spec + outputs (artifacts.json, phase-7/9/11/12 evidence) |
| add | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` | G4 governance follow-up |
| add | `.claude/skills/aiworkflow-requirements/**` | aiworkflow sync (changelog / indexes / inventory) |

### Runtime Contract

```ts
import { VISUAL_ROUTES, EXPECTED_VISUAL_ROUTE_COUNT } from './apps/web/playwright/fixtures/visual-routes'

const visualFullProjects = [
  'visual-full-chromium-desktop',
  'visual-full-chromium-tablet',
  'visual-full-chromium-mobile',
] as const

const expectedBaselineCount = EXPECTED_VISUAL_ROUTE_COUNT * visualFullProjects.length // 51
```

### Verification

```bash
$ ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png | wc -l
51

$ python3 -c "import yaml; d=yaml.safe_load(open('.github/workflows/playwright-visual-full.yml')); print(len(d[True]['pull_request']['paths']))"
6

$ mise exec -- pnpm typecheck  # PASS (5 workspaces)
$ mise exec -- pnpm lint        # PASS (eslint + depcruise + stablekey)
```

### Recovery from Actions PR-write permission failure

`peter-evans/create-pull-request@v7` step が `GitHub Actions is not permitted to create or approve pull requests` で失敗したが、baseline branch (`chore/visual-baseline-update-25960870639`) と 51 PNG (`b3fb7f4a`) は正常に push 済みであったため、`git cherry-pick b3fb7f4a` で 51 PNG のみを task branch に取り込んだ。dev の追加コミットを引き込まず scope を minimal に保てた。

repository settings → Actions → "Allow GitHub Actions to create and approve pull requests" を有効化すれば次回以降自動 PR 生成される。

### Edge Cases

| Case | Handling |
| --- | --- |
| baseline count ≠ `VISUAL_ROUTES.length * 3` | workflow を `runtime_pending` のままにし、matrix を `17/19` に更新しない |
| visual-full run is flaky | `data-visual-mask` を追加して baseline 再取得 |
| user approval is not granted | `CONTRACT_READY_IMPLEMENTATION_PENDING` のまま停止 |
| branch protection required check 統合 | `task-709-fu-branch-protection-required-check.md` (G4 follow-up) で別途実施 |

### Configurable Parameters

| Parameter | Current value |
| --- | --- |
| route count | `EXPECTED_VISUAL_ROUTE_COUNT = 17` |
| project count | 3 (desktop/tablet/mobile) |
| diff threshold | `maxDiffPixelRatio: 0.02` |
| baseline update environment | `visual-baseline-approval` |

### Outstanding

- `playwright-visual-full` の PR-trigger 経由 2-run stability 検証は本 PR 作成直後に CI 上で発火する。run 結果を `outputs/phase-11/evidence/visual-full-stability.md` に追記する (Gate-D 確認時)。
- G4 (required status check 統合) は `task-709-fu-branch-protection-required-check.md` で実施。
