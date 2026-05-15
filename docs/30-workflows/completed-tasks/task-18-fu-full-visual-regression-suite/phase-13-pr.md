[実装区分: 実装仕様書]

# Phase 13: PR 作成

## 目的

base ブランチ `dev` に対して PR を作成し、CI green + ユーザー承認後にマージする手順を定義する。

---

## 入力

- Phase 1〜12 outputs 全件
- 作業ブランチ（例: `feat/task-18-fu-full-visual-regression-suite`）

---

## 1. PR 作成前チェック

```bash
# 1. dev 同期
git fetch origin dev
git checkout dev
git pull --ff-only origin dev
git checkout feat/task-18-fu-full-visual-regression-suite
git merge dev

# 2. 品質ゲート
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. diff サマリ
git diff dev...HEAD --name-only
git status --porcelain   # 空であること
```

---

## 2. PR タイトル / body

タイトル:
```
feat(visual): full visual regression suite (17 routes × 3 viewport)
```

body（HEREDOC）:

```bash
gh pr create --base dev --title 'feat(visual): full visual regression suite (17 routes × 3 viewport)' --body "$(cat <<'EOF'
## Summary

Issue #696 "task-18-FU: full visual regression suite" を実装。task-18 (W7) の 4 baseline を拡張し、17 URL routes × 3 viewport (desktop/tablet/mobile) = 51 screenshot baseline を取得する full visual regression suite を導入する。

## Changes

- `apps/web/playwright.config.ts`: `visual-full-chromium-{desktop,tablet,mobile}` 3 project を追加
- `apps/web/playwright/fixtures/viewports.ts` 新規: 3 viewport 寸法定数
- `apps/web/playwright/fixtures/visual-routes.ts` 新規: 17 routes 配列
- `apps/web/playwright/tests/visual-full/full-visual.spec.ts` 新規: 17 routes loop spec
- `.github/workflows/playwright-visual-full.yml` 新規: nightly + PR path-filter trigger
- `.github/workflows/playwright-visual-baseline-update.yml` 新規: workflow_dispatch + approval gate
- `apps/web/package.json`: `test:visual-full` / `test:visual-full:update` scripts 追加

## Baseline

初回 baseline 51 png は本 PR に含める。baseline 未存在のまま required check を fail させ、手動 bypass で merge する運用は禁止。

## Invariants

- 既存 W7 `visual-chromium` project / `playwright/tests/visual/*.spec.ts` は touch しない
- maxDiffPixelRatio: 0.02 維持
- ubuntu-latest 固定 / animations disabled / fonts 安定化

## Test plan

- [ ] `pnpm typecheck` completed
- [ ] `pnpm lint` completed
- [ ] `actionlint` for 2 new workflows completed
- [ ] `playwright test --list` で 17 × 3 = 51 test を列挙
- [ ] CI `playwright-visual-full` workflow が path-filter trigger で起動
- [ ] CI `playwright-visual-full` workflow が 51 baseline を使って diff 0
- [ ] 必要な baseline 更新は `playwright-visual-baseline-update` workflow を手動 trigger し、approval gate 経由の別 PR で作成される

## Manual setup (post-merge)

1. GitHub repo settings → Environments → `visual-baseline-approval` を新規作成
2. required reviewers に owner (@daishiman) を 1 名設定

## Refs

- Issue: #696
- Workflow: `docs/30-workflows/task-18-fu-full-visual-regression-suite/`
- Implementation guide: `docs/30-workflows/task-18-fu-full-visual-regression-suite/outputs/phase-12/implementation-guide.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 2. ユーザー承認ゲート

本 PR は以下 2 つのユーザー手動操作を含むため、**マージ前にユーザー承認を必須**とする:

1. GitHub repo settings での Environment `visual-baseline-approval` 作成 + required reviewers 設定
2. `playwright-visual-baseline-update` workflow の初回手動 trigger

→ Claude Code はこれらを **代行せず**、PR description で明示し、ユーザーが手動実行することを前提とする。

---

## 3. CI required check

| check | 期待挙動 | 理由 |
|-------|---------|------|
| `playwright-visual-full / visual-full (desktop)` | `completed` | baseline 17 件が PR 内に存在 |
| `playwright-visual-full / visual-full (tablet)` | `completed` | baseline 17 件が PR 内に存在 |
| `playwright-visual-full / visual-full (mobile)` | `completed` | baseline 17 件が PR 内に存在 |
| `typecheck` | `completed` | 必須 |
| `lint` | `completed` | 必須 |

→ baseline 未存在 fail の手動 bypass は禁止。required check は merge 前に green にする。

---

## 4. ロールバック

merge 後に問題が発生した場合:

```bash
gh pr revert <PR_NUMBER>   # or
git revert <MERGE_SHA>
git push origin dev
```

その後 baseline PR も revert する。

---

## 5. DoD

1. `gh pr create` 成功（PR URL 取得）
2. CI required check (`typecheck` / `lint`) completed
3. PR description にユーザー手動 setup 項目（§2）が明示されている
4. ユーザー承認後 merge

---

## 6. 成果物

- PR URL（実行時取得）
