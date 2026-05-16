# Implementation Guide

## Part 1: 中学生レベル概念説明

このタスクは、Webサイトの画面写真を「正解の見本」としてそろえる作業です。学校で提出物の見本があると、後から出したものが見本と違うか確認しやすくなります。同じように、Webサイトでも正しい画面写真を先に用意しておくと、見た目が知らないうちに崩れたときに自動で気づけます。

今回は、これまで一部の画面だけだった見本写真を、17画面それぞれについてパソコン・タブレット・スマホの3種類、合計51枚に増やす準備をします。写真は人のパソコンではなく、GitHub Actions という決まった実行場所で作ります。人のパソコンで作ると、文字の見え方などが少し違って、あとで比べるときにずれることがあるからです。

ただし、この写真を実際に作ってリポジトリへ入れる操作は、ユーザーの承認が必要です。そのため、この仕様書の段階では「何をどう実行するか」をそろえ、承認後に同じタスク内で再開できる状態にします。

| 用語 | 日常語での説明 |
| --- | --- |
| baseline | 正解の見本写真 |
| visual regression | 見た目が知らないうちに変わること |
| viewport | 画面サイズ |
| CI | 決まった場所で自動確認する仕組み |
| user gate | ユーザーの許可を待つ関門 |

## Part 2: 技術者向け実装ガイド

### Scope

- Activate `.github/workflows/playwright-visual-full.yml` `pull_request` trigger.
- Capture `VISUAL_ROUTES.length * 3` Linux baselines through `.github/workflows/playwright-visual-baseline-update.yml`.
- Import the generated baseline-update PR into the task branch.
- Update `SMOKE-COVERAGE-MATRIX.md` from `4/19` to `17/19` after PNG evidence exists.
- Record Phase 7 / 9 / 11 evidence.

### Runtime Contract

```ts
import { VISUAL_ROUTES, EXPECTED_VISUAL_ROUTE_COUNT } from './apps/web/playwright/fixtures/visual-routes'

const visualFullProjects = [
  'visual-full-chromium-desktop',
  'visual-full-chromium-tablet',
  'visual-full-chromium-mobile',
] as const

const expectedBaselineCount = EXPECTED_VISUAL_ROUTE_COUNT * visualFullProjects.length
```

Current expected count: `17 * 3 = 51`.

### API / Command Signatures

```bash
gh workflow run playwright-visual-baseline-update.yml \
  --ref task/709-visual-baseline-runtime-capture \
  --field reason='task-709 initial baseline capture (51 PNG)'
```

```bash
git fetch origin pull/<BASELINE_PR>/head:baseline-update-tmp
git merge --no-ff baseline-update-tmp -m "chore(task-709): import baseline PNG 51 files"
```

### Edge Cases

| Case | Handling |
| --- | --- |
| baseline count is not `VISUAL_ROUTES.length * 3` | keep workflow `runtime_pending`; do not update matrix to `17/19` |
| visual-full run is flaky | add minimal `data-visual-mask` or `waitFor` and recapture |
| user approval is not granted | keep `CONTRACT_READY_IMPLEMENTATION_PENDING`; do not run mutation commands |
| branch protection required check update is desired | use `task-709-fu-branch-protection-required-check.md` |

### Configurable Parameters

| Parameter | Current value |
| --- | --- |
| route count | `EXPECTED_VISUAL_ROUTE_COUNT = 17` |
| project count | 3 |
| diff threshold | `maxDiffPixelRatio: 0.02` |
| baseline update environment | `visual-baseline-approval` |
