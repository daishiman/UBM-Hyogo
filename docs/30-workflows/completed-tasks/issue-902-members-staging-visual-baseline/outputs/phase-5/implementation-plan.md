# Phase 5 — Implementation Plan

## 1. 変更対象ファイル

| Path | 種別 | 概要 |
|------|------|------|
| `apps/web/playwright/tests/visual-staging/members-list.spec.ts` | 新規 | `/members` 初期表示 baseline spec |
| `apps/web/playwright/tests/visual-staging/member-detail.spec.ts` | 新規 | `/members/[id]` baseline spec（env-gated） |
| `.github/workflows/playwright-smoke.yml` | 編集 | `staging-visual` job 名 `4 screens` → `6 screens`（2 箇所） |
| `apps/web/playwright/tests/visual-staging/members-list.spec.ts-snapshots/members-list-staging-visual-chromium-linux.png` | 新規（user-gated） | CI ubuntu-latest 生成 baseline |
| `apps/web/playwright/tests/visual-staging/member-detail.spec.ts-snapshots/member-detail-staging-visual-chromium-linux.png` | 新規（user-gated） | 同上 |

## 2. 実装手順

### Step 1: spec ファイル追加

```bash
# members-list.spec.ts
cat > apps/web/playwright/tests/visual-staging/members-list.spec.ts <<'EOF'
import { expect, test } from '@playwright/test'

// production-equivalent runtime（Cloudflare Workers staging）の visual baseline。
// baseURL は staging-visual project（PLAYWRIGHT_STAGING_BASE_URL）。
// query 無し初期表示（filter 無し・1 ページ目・既定 density）のみ baseline 対象。
// SSR データは staging 実値由来。検証対象は OpenNext bundle の design system 描画の local 等価性。
test('staging members list (initial view) baseline', async ({ page }) => {
  await page.route('**/api/**', (route) => route.continue())
  await page.goto('/members')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('members-list.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})
EOF

# member-detail.spec.ts
cat > apps/web/playwright/tests/visual-staging/member-detail.spec.ts <<'EOF'
import { expect, test } from '@playwright/test'

// 動的ルート [id] は seed 実データ依存。PLAYWRIGHT_MEMBER_DETAIL_ID で代表 ID を外部注入し、
// 未指定環境では test.skip で安全停止する（seed 移行耐性 + noise 排除）。
const memberId = process.env.PLAYWRIGHT_MEMBER_DETAIL_ID

test('staging member detail baseline', async ({ page }) => {
  test.skip(
    !memberId,
    'PLAYWRIGHT_MEMBER_DETAIL_ID is not set; skipping member-detail baseline',
  )

  await page.route('**/api/**', (route) => route.continue())
  await page.goto(`/members/${memberId}`)
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('member-detail.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})
EOF
```

### Step 2: workflow job 名更新

`.github/workflows/playwright-smoke.yml` の 2 箇所を edit:

```yaml
# L100
- name: staging-visual (chromium, 6 screens)
# L116
- name: Run staging visual (6 screens)
```

### Step 3: ローカル検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=staging-visual --list playwright/tests/visual-staging/
bash scripts/verify-pr-ready.sh
```

### Step 4: baseline 生成（user-gated）

1. PR push 後、GitHub Actions で `playwright-smoke.yml` の baseline 生成 dispatch を実行
2. artifact `staging-visual-baselines` から 2 枚 download
3. `apps/web/playwright/tests/visual-staging/{members-list,member-detail}.spec.ts-snapshots/` へ配置 → commit
4. 同 PR に追加 push

## 3. DoD（Definition of Done）

- [ ] 2 spec ファイルが追加され、`staging-visual` project の `testMatch` に自動マッチする
- [ ] `playwright-smoke.yml` の `staging-visual` job 名が `6 screens` に更新されている
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] `apps/web/src/` 配下に `127.0.0.1:8888` / HEX 直書き / `process.env.*` 直接参照の混入なし（grep 0 件）
- [ ] CI で baseline PNG 2 枚が生成・commit 済み（user-gated）
- [ ] `staging-visual` job が diff < 5% で green（user-gated）

## 4. ロールバック手順

`git revert <commit>` で spec 2 件と yaml 変更を巻き戻し可能。baseline PNG も同 commit に含めれば一括 revert で安全。
