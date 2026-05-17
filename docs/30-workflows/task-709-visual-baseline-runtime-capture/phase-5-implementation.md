[実装区分: 実装仕様書]

# Phase 5: 実装

## 目的

baseline runtime capture と workflow 編集を実行する具体手順。

## 1. 実装ステップ (順序固定)

### Step 1: workflow 編集

`.github/workflows/playwright-visual-full.yml` を以下のように編集。

**削除する行** (6-9 行目相当の MVP-PAUSE コメント):
```
  # MVP-PAUSE 2026-05-15: PR trigger を一時停止。
  # 復活方法: 下の pull_request ブロックの行頭 `# ` を全て削除する。
  # 残っている workflow_dispatch / push / schedule は引き続き有効。
```

**変更する行** (`# pull_request:` 以降のコメントアウトされた 7 行):

before:
```yaml
  workflow_dispatch:
  # pull_request:
  # paths:
  # - 'apps/web/src/**'
  # - 'apps/web/playwright.config.ts'
  # - 'apps/web/playwright/tests/visual-full/**'
  # - 'apps/web/playwright/fixtures/**'
  # - 'apps/web/src/styles/tokens.css'
  # - '.github/workflows/playwright-visual-full.yml'
  #
```

after:
```yaml
  workflow_dispatch:
  pull_request:
    paths:
      - 'apps/web/src/**'
      - 'apps/web/playwright.config.ts'
      - 'apps/web/playwright/tests/visual-full/**'
      - 'apps/web/playwright/fixtures/**'
      - 'apps/web/src/styles/tokens.css'
      - '.github/workflows/playwright-visual-full.yml'
```

検証:
```bash
yq '.on.pull_request.paths | length' .github/workflows/playwright-visual-full.yml   # 6
yq '.on.workflow_dispatch' .github/workflows/playwright-visual-full.yml             # null (空 mapping = OK)
yq '.on.schedule[0].cron' .github/workflows/playwright-visual-full.yml              # '0 18 * * *'
```

### Step 2: user approval marker 記録（承認後のみ）

baseline workflow dispatch、baseline-update PR 取り込み、commit / push / PR 作成はユーザー明示承認後のみ実行する。承認を得たら次を記録する。

```bash
mkdir -p docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-11/evidence
cat > docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-11/evidence/user-approval-marker.md <<'EOF'
# user approval marker

- approved_at: <ISO8601>
- approved_by: daishiman
- approved_scope:
  - gh workflow run playwright-visual-baseline-update.yml
  - baseline-update PR import into task branch
  - task branch commit / push / PR creation
EOF
```

### Step 3: PR 作成（workflow 編集のみ commit）

```bash
git checkout -b task/709-visual-baseline-runtime-capture
git add .github/workflows/playwright-visual-full.yml \
        docs/30-workflows/task-709-visual-baseline-runtime-capture/
git commit -m "feat(task-709): activate visual-full PR trigger + add spec"
git push -u origin task/709-visual-baseline-runtime-capture
```

### Step 4: baseline 取得 (CI 実行)

```bash
# remote workflow を本タスク branch で起動
gh workflow run playwright-visual-baseline-update.yml \
  --ref task/709-visual-baseline-runtime-capture \
  --field reason='task-709 initial baseline capture (51 PNG)'

# run 完了を待機
gh run watch
```

成功時、`peter-evans/create-pull-request` action が baseline-update PR を生成する。

### Step 5: baseline-update PR の取り込み

```bash
gh pr list --label "visual-baseline-update" --limit 5
# 該当 PR 番号を <BASELINE_PR> とする

git fetch origin pull/<BASELINE_PR>/head:baseline-update-tmp
git merge --no-ff baseline-update-tmp -m "chore(task-709): import baseline PNG 51 files"
git push

# baseline-update PR は close + delete branch (gh pr close <BASELINE_PR> --delete-branch)
```

### Step 6: 安定性検証 (2 連続 PASS)

```bash
# run #1 は Step 4 push で自動起動
gh run watch

# run #2: empty commit で再走
git commit --allow-empty -m "chore: verify visual-full stability run #2"
git push
gh run watch
```

両 run の `visual-full` job 3 件（desktop / tablet / mobile）すべて PASS であること。

### Step 7: matrix 更新

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` を編集:

| 場所 | before | after |
|------|--------|-------|
| Axis Totals 表 Visual baseline 行 | `4/19` + Notes `login, public-top, admin-dashboard, profile` | `17/19` + Notes `17 URL routes baselined via task-18-fu visual-full suite; error.tsx / loading.tsx remain component-only` |
| Future Candidates 表 1 行目 | "Full visual regression baseline for remaining non-baseline surfaces" | 削除 (task-709 で resolved) |
| Coverage Matrix #2..#6, #10..#16 の Visual baseline 列 | `-` | 対応 slug（例 `members`, `members-detail`, `register`, `privacy`, `terms`, `admin-members`, ...）|

```bash
git add docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md
git commit -m "docs(task-709): update SMOKE-COVERAGE-MATRIX to 17/19 visual baselines"
git push
```

## 2. 関数シグネチャ・型

新規追加・変更なし。既存:
- `VISUAL_ROUTES: readonly VisualRoute[]` (length 17)
- `EXPECTED_VISUAL_ROUTE_COUNT = 17`
- `full-visual.spec.ts` の `for (const route of VISUAL_ROUTES)` ループ

## 3. 入出力・副作用

| Step | 副作用 |
|------|--------|
| Step 1 | workflow yaml 変更（PR 発火条件追加） |
| Step 2 | user approval marker 記録 |
| Step 4 | CI 上で `--update-snapshots` 実行 → baseline-update PR 生成 |
| Step 5 | 51 PNG が repo にコミットされる |
| Step 6 | empty commit 1 件 |
| Step 7 | matrix md 更新 |

## 4. 検証コマンド (Step 完了ごと)

```bash
# Step 1 後
yq '.on.pull_request' .github/workflows/playwright-visual-full.yml

# Step 4 後
ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/ | wc -l   # 51
shasum -a 256 apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png > /tmp/baseline-sha256.txt

# Step 5 後
gh run list --workflow=playwright-visual-full.yml --branch=task/709-visual-baseline-runtime-capture --limit=2 --json conclusion
# 期待: 両方 "success"

# Step 6 後
grep -E '\| Visual baseline \| +17/19 \|' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md
```

## 5. DoD

Phase 1 §6 を満たす。

## 6. 成果物

- 本ファイル `phase-5-implementation.md`
