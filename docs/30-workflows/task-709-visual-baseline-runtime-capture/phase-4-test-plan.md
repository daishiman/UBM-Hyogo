[実装区分: 実装仕様書]

# Phase 4: テスト計画

## 目的

baseline runtime capture と workflow 編集の検証方針を確定する。

## 1. テスト分類

| 分類 | 対象 | 自動/手動 |
|------|------|-----------|
| Visual regression | 17 routes × 3 viewport | 自動 (Playwright) |
| Workflow yaml 構文 | `playwright-visual-full.yml` | 自動 (`yq` / GitHub Actions parser) |
| Stability (2 連続 PASS) | 取得後の baseline | 自動 (CI 2 run) |
| Matrix 更新 | `SMOKE-COVERAGE-MATRIX.md` の数値整合 | 手動 + grep |

## 2. 追加テストファイル

**新規追加なし**。既存 `full-visual.spec.ts` が parameterized で 17 routes をカバー済みのため、本タスクではテストコードを追加せず、baseline PNG と workflow 設定を整える。

将来動的要素が増えた場合に `apps/web/playwright/fixtures/visual-routes.ts` の `waitFor` フィールドを使う設計余地は task-18-fu Phase 8 で既に確保済み。

## 3. ローカル検証手順

```bash
# 1. fixture が 17 routes であることの sanity check
mise exec -- node -e "const m = require('./apps/web/playwright/fixtures/visual-routes.ts'); console.log(m.VISUAL_ROUTES.length === m.EXPECTED_VISUAL_ROUTE_COUNT)"

# 2. yaml 構文
yq '.on.pull_request.paths | length' .github/workflows/playwright-visual-full.yml
# 期待: 6

# 3. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 4. ローカル smoke (baseline 取得は CI 側で実施するため、ローカルでは update なし)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=visual-full-chromium-desktop \
  --project=visual-full-chromium-tablet \
  --project=visual-full-chromium-mobile
# baseline 未取得時は expected fail。取得後は PASS。
```

## 4. CI 検証手順

```
[Step A] baseline 取得
  gh workflow run playwright-visual-baseline-update.yml --ref task/709-...
  → baseline-update PR が生成される
  → 本タスクブランチに取り込み

[Step B] 安定性確認 (2 連続 PASS)
  git push (no-op commit でも OK)
  → playwright-visual-full.yml が走る (run #1)
  git commit --allow-empty -m "verify baseline stability" && git push
  → playwright-visual-full.yml が走る (run #2)
  両 run の 3 viewport job 全て PASS であることを確認

[Step C] required ではないが PR ブロック挙動確認
  visual diff を意図的に起こす (例: apps/web/src/styles/tokens.css の OKLch を 1 トーン変更)
  → playwright-visual-full.yml が fail することを確認
  → revert
```

## 5. 受入確認チェックリスト

- [ ] `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` 配下に 51 PNG
- [ ] PNG 命名規約 `full-visual-{slug}-{viewport}-{project}.png` に従っている
- [ ] `playwright-visual-full.yml` の `pull_request:` がアクティブ
- [ ] CI で 2 連続 PASS
- [ ] matrix の Visual baseline が 17/19 表記

## 6. 成果物

- 本ファイル `phase-4-test-plan.md`
