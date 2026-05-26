---
phase: 5
title: Implementation Guide
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 5 — Implementation Guide

[実装区分: 実装仕様書]

## 0. 変更ファイル一覧

### 新規作成

1. `apps/web/playwright/scripts/mint-staging-storage-state.ts`
2. `apps/web/playwright/scripts/__tests__/mint-staging-storage-state.spec.ts`
3. `apps/web/playwright/tests/visual-staging-authenticated/setup.staging-auth.ts`
4. `apps/web/playwright/tests/visual-staging-authenticated/teardown.staging-auth.ts`
5. `apps/web/playwright/tests/visual-staging-authenticated/profile-authenticated.spec.ts`
6. `apps/web/playwright/tests/visual-staging-authenticated/admin-dashboard-authenticated.spec.ts`
7. `.github/workflows/playwright-staging-visual-authenticated.yml`（または既存 `playwright-visual-baseline-update.yml` 内 job 追記。Phase 5 §6 で確定）
8. `docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/storagestate-generation.md`

### 編集

A. `apps/web/playwright.config.ts` — setup / authenticated / teardown project 追加
B. `apps/web/.gitignore` — `playwright/.auth/` 除外
C. `apps/web/playwright/tests/visual-staging/profile.spec.ts` — cross-ref コメント追記
D. `apps/web/playwright/tests/visual-staging/admin-dashboard.spec.ts` — cross-ref コメント追記
E. `docs/30-workflows/completed-tasks/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md` — consumed pointer 追記
F. `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-09-risks.md` § 5 — R-03 解消 cross-ref
G. `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-13-commit-pr-draft.md` § 7 — フォロー消化 cross-ref

## 1. mint-staging-storage-state.ts（関数シグネチャ）

```ts
import { signSessionJwt } from '@ubm-hyogo/shared';
import { z } from 'zod';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const EnvSchema = z.object({
  STAGING_AUTH_SECRET: z.string().min(32),
  STAGING_ADMIN_MEMBER_ID: z.string().min(1),
  STAGING_ADMIN_EMAIL: z.string().email(),
  STAGING_ME_MEMBER_ID: z.string().min(1),
  STAGING_ME_EMAIL: z.string().email(),
  STAGING_WORKER_HOST: z.string().min(1).regex(/^[a-z0-9.-]+$/),
});

type Role = 'member' | 'admin';

interface MintArgs {
  role: Role;
  out: string;
  ttlSec?: number;
  dryRun?: boolean;
}

export async function mintStagingStorageState(args: MintArgs, env = process.env): Promise<{ summary: { role: Role; sub: string; exp: number; isAdmin: boolean } }>;
// 実装要点:
// 1. EnvSchema.parse(env)（失敗時 env 名だけ stderr に出して exit 1）
// 2. iat = floor(Date.now()/1000), exp = iat + (ttlSec ?? 600)
// 3. claims = { sub, email, isAdmin, iat, exp, iss:'ubm-hyogo-staging', aud:'ubm-hyogo-web' }
// 4. token = await signSessionJwt(env.STAGING_AUTH_SECRET, { memberId: sub, email, isAdmin, nowSeconds: iat, ttlSeconds: 600 })
// 5. storage = { cookies: [{ name:'authjs.session-token', value:token, domain:env.STAGING_WORKER_HOST, path:'/', expires:exp, httpOnly:true, secure:true, sameSite:'Lax' }] }
// 6. dryRun=false なら mkdir(dirname(out),{recursive:true}) + writeFile(out, JSON.stringify(storage), { mode:0o600 })
// 7. summary は cookie 値 / token 値を含めない（sub / exp / isAdmin のみ）
```

CLI entry: `if (import.meta.url === pathToFileURL(process.argv[1]).href) { /* parse argv → mintStagingStorageState() → log summary */ }`

エラー方針: env 不在は `STAGING_AUTH_SECRET missing` 等 env 名のみ。token 値 / cookie 値は **絶対に log しない**。

## 2. setup.staging-auth.ts（Playwright setup project）

```ts
import { test as setup, expect } from '@playwright/test';
import { mintStagingStorageState } from '../../scripts/mint-staging-storage-state.ts';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const AUTH_DIR = join(__dirname, '..', '..', '.auth');

setup('mint member storageState', async () => {
  const out = join(AUTH_DIR, 'member.storageState.json');
  await mintStagingStorageState({ role: 'member', out });
  expect(existsSync(out)).toBe(true);
  const json = JSON.parse(readFileSync(out, 'utf8'));
  expect(json.cookies?.[0]?.name).toBe('authjs.session-token');
});

setup('mint admin storageState', async () => {
  const out = join(AUTH_DIR, 'admin.storageState.json');
  await mintStagingStorageState({ role: 'admin', out });
  expect(existsSync(out)).toBe(true);
});
```

## 3. teardown.staging-auth.ts

```ts
import { test as teardown } from '@playwright/test';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

teardown('remove storageState', async () => {
  await rm(join(__dirname, '..', '..', '.auth'), { recursive: true, force: true });
});
```

## 4. playwright.config.ts（差分方針）

```ts
// projects 配列に以下を追加（既存 staging-visual の直後）:
{
  name: 'setup-authenticated-staging',
  testDir: './playwright/tests/visual-staging-authenticated',
  testMatch: /setup\.staging-auth\.ts$/,
  teardown: 'teardown-authenticated-staging',
},
{
  name: 'staging-visual-authenticated',
  testDir: './playwright/tests/visual-staging-authenticated',
  testIgnore: [/setup\.staging-auth\.ts$/, /teardown\.staging-auth\.ts$/],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PLAYWRIGHT_STAGING_BASE_URL,
  },
  dependencies: ['setup-authenticated-staging'],
  snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}-authenticated-staging-visual-{platform}{ext}',
},
{
  name: 'teardown-authenticated-staging',
  testDir: './playwright/tests/visual-staging-authenticated',
  testMatch: /teardown\.staging-auth\.ts$/,
},
```

既存 `staging-visual` project は無変更。`EVIDENCE_DIR` 分岐が必要な場合は `staging-visual-authenticated` 専用のサブパスを追加（`outputs/phase-11/screenshots/` への copy は CI step で実施）。

## 5. profile-authenticated.spec.ts / admin-dashboard-authenticated.spec.ts

```ts
// profile-authenticated.spec.ts
import { test, expect } from '@playwright/test';
import { join } from 'node:path';

test.use({ storageState: join(__dirname, '..', '..', '.auth', 'member.storageState.json') });

test('staging profile (authenticated member) baseline', async ({ page }) => {
  await page.goto('/profile', { waitUntil: 'networkidle' });
  // guard でないことを assert（/login への redirect 検出）
  await expect(page).toHaveURL(/\/profile(\?|$)/);
  await expect(page.getByTestId('profile-authenticated-root')).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveScreenshot('profile-authenticated.png', { maxDiffPixelRatio: 0.05, animations: 'disabled' });
});
```

```ts
// admin-dashboard-authenticated.spec.ts
import { test, expect } from '@playwright/test';
import { join } from 'node:path';

test.use({ storageState: join(__dirname, '..', '..', '.auth', 'admin.storageState.json') });

test('staging admin dashboard (authenticated admin) baseline', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/admin(\?|$)/);
  await expect(page.getByTestId('admin-dashboard-root')).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveScreenshot('admin-dashboard-authenticated.png', { maxDiffPixelRatio: 0.05, animations: 'disabled' });
});
```

> `data-testid` が現コードに存在しない場合は Phase 5 実装サイクル冒頭で `apps/web/app/profile/page.tsx` / `apps/web/app/(admin)/admin/page.tsx` に最小 attribute 追加（design / behavior 不変・visual diff 0）。

## 6. CI workflow（`.github/workflows/playwright-staging-visual-authenticated.yml`）

要点:

- trigger: `workflow_dispatch` + `pull_request`（path filter: spec / config / mint CLI / 本 workflow file）
- runner: `ubuntu-latest`
- secrets inject: `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL`
- vars: `STAGING_WORKER_HOST` / `PLAYWRIGHT_STAGING_BASE_URL`
- step 順: checkout → mise → pnpm install → playwright install --with-deps → `pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated` → `cp` baseline PNG to `outputs/phase-11/screenshots/`
- artifact upload: HTML report + diff PNG のみ。`apps/web/playwright/.auth/` は **upload しない**（path ignore）
- grep gate: `grep -RIn -e 'eyJ' -e 'authjs.session-token=' apps/web/playwright/.auth/ docs/30-workflows/issue-901-*/outputs/ || true` で 0 hit を assert

## 7. cross-ref 編集差分（C/D/F/G）

```diff
// apps/web/playwright/tests/visual-staging/profile.spec.ts
+// NOTE: 認証後 profile baseline は issue-901 で別 spec として実装（visual-staging-authenticated/profile-authenticated.spec.ts）
 test('staging profile (unauthenticated guard) baseline', ...);
```

親 workflow への追記例（phase-09-risks.md §5）:

```
- R-03（認証後 profile / admin の runtime 描画は未検証）→ **解消**: `docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/` で staging-visual-authenticated baseline 取得済。
```

## 8. proto-spec consumed pointer（E）

proto-spec ファイル末尾に追記:

```yaml
---
status: consumed
consumed_at: 2026-05-25
canonical_workflow: docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/
recovery_note: |
  Issue #901 was closed before a canonical workflow root existed.
  This proto-spec file is preserved for backward link integrity.
  All Phase 1-13 work has been migrated to the canonical workflow root above.
---
```

## 9. `.gitignore` 差分（B）

```
# apps/web/.gitignore
+playwright/.auth/
+playwright/.auth/*.json
```

## 10. ローカル試行コマンド

```bash
# (1) mint CLI 単体検証
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec tsx playwright/scripts/mint-staging-storage-state.ts --role=member --out=playwright/.auth/member.storageState.json
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec tsx playwright/scripts/mint-staging-storage-state.ts --role=admin --out=playwright/.auth/admin.storageState.json

# (2) Playwright authenticated baseline 取得
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --update-snapshots

# (3) baseline を evidence に copy
cp apps/web/playwright/tests/visual-staging-authenticated/profile-authenticated.spec.ts-snapshots/profile-authenticated-authenticated-staging-visual-chromium-linux.png docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/screenshots/profile-authenticated.png
cp apps/web/playwright/tests/visual-staging-authenticated/admin-dashboard-authenticated.spec.ts-snapshots/admin-dashboard-authenticated-authenticated-staging-visual-chromium-linux.png docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/screenshots/admin-dashboard-authenticated.png

# (4) 後始末
rm -rf apps/web/playwright/.auth
```

## 11. CONST_005 充足

| 項目 | 充足 |
|---|---|
| 関数シグネチャ | §1 / §5 / §6 で明示 |
| ハンドラロジック | §1 step 1-7 / §5 spec body |
| env 取扱 | §1 EnvSchema / §6 secrets inject |
| エラー方針 | §1 末尾「env 名のみ log」 |
| ローカル試行コマンド | §10 |
| ロールバック | §0 編集ファイル A..G の revert で 1 コマンド完結 |
