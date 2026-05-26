# Phase 4 — Test Plan

## 1. テスト分類

| 種別 | 対象 | 実行環境 |
|------|------|---------|
| visual baseline | `/members` 初期表示 | Playwright `staging-visual` project / CI ubuntu-latest |
| visual baseline | `/members/[id]` 代表 1 件 | 同上 + `PLAYWRIGHT_MEMBER_DETAIL_ID` 注入時のみ |
| static check | typecheck / lint | local + CI |
| skip safety | `PLAYWRIGHT_MEMBER_DETAIL_ID` 未指定時に member-detail が skip | local 検証可 |

## 2. テストコマンド

```bash
# local typecheck / lint（spec 追加の影響確認）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# skip safety 検証（local / ID 未指定）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=staging-visual --list playwright/tests/visual-staging/member-detail.spec.ts

# staging visual 実行（user-gated）
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
PLAYWRIGHT_MEMBER_DETAIL_ID=<staging-seed-id> \
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging
```

## 3. 期待結果

| ケース | 期待 |
|-------|------|
| typecheck / lint | exit 0 |
| `PLAYWRIGHT_MEMBER_DETAIL_ID` 未指定 + members-list | members-list pass / member-detail skipped |
| `PLAYWRIGHT_MEMBER_DETAIL_ID` 指定 + 初回 baseline 生成 | diff > 0% で fail → `--update-snapshots` で baseline 生成 |
| 2 回目以降 | diff < 5% で pass |

## 4. baseline 取得フロー（2 段階）

1. PR を push 後、`playwright-smoke.yml` の `staging-visual` job 名更新を反映した上で baseline 生成 dispatch を実行
2. CI artifact `staging-visual-baselines` から `-staging-visual-chromium-linux.png` 2 枚を download
3. `apps/web/playwright/tests/visual-staging/{members-list,member-detail}.spec.ts-snapshots/` に配置 → commit
4. 再 push で `staging-visual` job が green（diff < 5%）となることを確認

## 5. flake 対策

| 要因 | 対策 |
|------|------|
| SSR データ揺れ | `maxDiffPixelRatio: 0.05`（既存と同値） |
| アニメーション | `addStyleTag` で `animation/transition: none` |
| client-side fetch race | `page.locator('main h1').waitFor` + `page.route` 監視 |
| seed 変更 | `PLAYWRIGHT_MEMBER_DETAIL_ID` 外部化 + `test.skip` フォールバック |
