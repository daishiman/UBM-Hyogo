# Phase 4: 実装計画

[実装区分: 実装仕様書]

## 1. 実装ステップ（順序厳守）

> 2026-05-18 実装反映: 初期案の storageState / `?tab=` / full-page capture は採用せず、既存 `adminPage` fixture + `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` + pane region screenshot に変更した。D1 seed SQL は optional future real-D1 support として残す。

### Step 1: gitignore 整備

`apps/web/playwright/.auth/.gitignore` を新規作成:

```
*
!.gitignore
```

→ storageState (`admin.json`) が誤って commit されない保護。

### Step 2: D1 seed fixture 作成

`scripts/fixtures/serial-05-step-03/seed-diff.sql`:

```sql
-- serial-05-step-03 schema-diff-resolve runtime evidence 用 seed
-- 目的: /admin/schema/diff を added/changed/removed/unresolved 各 pane で非空にし、
--       resolve 409 collision 用の既存 stableKey を 1 件用意する
-- 冪等性: seed-cleanup.sql を先に実行してから本 SQL を実行すること

-- added: D1 正本に未登録だが Form 現行に存在する field を表現するため
--        正本側を意図的に欠落させた状態にする
-- changed: 既存正本の field metadata を Form 現行と乖離させる
-- removed: Form 現行に存在しない正本 field を投入する
-- unresolved: alias が紐づいていない pending entry を投入する
-- collision (409): 既存登録済 stableKey をひとつ確実に残す

INSERT INTO schema_fields (id, stable_key, label_ja, field_type, status, registered_at)
VALUES
  ('seed-collision-001', 'member.fullname.kanji', '氏名（漢字）', 'short_text', 'active', strftime('%s','now')),
  ('seed-removed-001', 'legacy.removed.field', '旧フィールド', 'short_text', 'active', strftime('%s','now')),
  ('seed-changed-001', 'member.address.postal', '郵便番号（旧型）', 'short_text', 'active', strftime('%s','now'));

INSERT INTO schema_diff_unresolved (id, form_field_id, suggested_stable_key, created_at)
VALUES
  ('seed-unresolved-001', 'form-pending-001', 'member.affiliation.dept', strftime('%s','now'));
```

> **注意**: 実際のテーブル名・カラム名は `apps/api/migrations/**` および `apps/api/src/routes/admin/schema.ts` を確認して合わせる（実装側を変えない、seed 側で実 schema に合わせる）。Step 5 の実機確認で 200 + 非空 payload にならない場合、本 SQL を実 schema に合わせて microadjust する。

`scripts/fixtures/serial-05-step-03/seed-cleanup.sql`:

```sql
DELETE FROM schema_diff_unresolved WHERE id LIKE 'seed-%';
DELETE FROM schema_fields WHERE id LIKE 'seed-%';
```

### Step 3: Playwright config 作成

`apps/web/playwright.admin-schema-diff.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

const evidenceDir =
  process.env.ADMIN_SCHEMA_DIFF_EVIDENCE_DIR ??
  '../docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots';

export default defineConfig({
  testDir: './playwright/tests/visual',
  testMatch: /admin-schema-diff\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.ADMIN_SCHEMA_DIFF_BASE_URL ?? 'http://localhost:3000',
    storageState: 'playwright/.auth/admin.json',
    screenshot: 'off',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } },
    },
  ],
  metadata: { evidenceDir },
});
```

### Step 4: Playwright spec 作成

`apps/web/playwright/tests/visual/admin-schema-diff.spec.ts`:

```ts
import { expect, test } from '../../fixtures/auth';
import path from 'node:path';

const EVIDENCE_DIR =
  process.env.ADMIN_SCHEMA_DIFF_EVIDENCE_DIR ??
  path.resolve(
    __dirname,
    '../../../../docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots',
  );

const panes = ['added', 'changed', 'removed', 'unresolved'] as const;

test.describe('SchemaDiffPanel runtime evidence', () => {
  for (const pane of panes) {
    test(`pane ${pane}`, async ({ adminPage }, testInfo) => {
      const viewport = testInfo.project.name.includes('mobile') ? 'mobile' : 'desktop';
      await adminPage.goto('/admin/schema');
      const paneRegion = adminPage.locator(`[aria-labelledby="pane-${pane}"]`);
      await expect(paneRegion).toBeVisible();
      await paneRegion.screenshot({
        path: path.join(EVIDENCE_DIR, `admin-schema-diff-${pane}-${viewport}.png`),
      });
    });
  }
});

test.describe('SchemaDiffPanel resolve feedback', () => {
  test.skip(({}, testInfo) => testInfo.project.name.includes('mobile'), 'desktop only');

  test('resolve success feedback', async ({ adminPage }) => {
    await adminPage.goto('/admin/schema');
    await adminPage.getByRole('button', { name: /所属部署/ }).click();
    await adminPage.getByLabel(/新しい stableKey/).fill('member_department_new');
    await adminPage.getByRole('button', { name: '割当' }).click();
    await expect(adminPage.getByRole('status')).toContainText('alias を割当てました');
    await adminPage.screenshot({
      path: path.join(EVIDENCE_DIR, 'admin-schema-diff-resolve-success.png'),
      fullPage: true,
    });
  });

  test('resolve 409 feedback', async ({ adminPage }) => {
    await adminPage.goto('/admin/schema');
    await adminPage.getByRole('button', { name: /表示名/ }).click();
    await adminPage.getByLabel(/新しい stableKey/).fill('member_display_name');
    await adminPage.getByRole('button', { name: '割当' }).click();
    await expect(adminPage.locator('[data-feedback-kind="conflict_error"]')).toContainText('競合');
    await adminPage.screenshot({
      path: path.join(EVIDENCE_DIR, 'admin-schema-diff-resolve-409.png'),
      fullPage: true,
    });
  });

  test('resolve 422 feedback', async ({ adminPage }) => {
    await adminPage.goto('/admin/schema');
    await adminPage.getByRole('button', { name: /所属部署/ }).click();
    await adminPage.getByLabel(/新しい stableKey/).fill('member_department_invalid');
    await adminPage.getByRole('button', { name: '割当' }).click();
    await expect(adminPage.locator('[data-feedback-kind="validation_error"]')).toContainText('入力内容に誤り');
    await adminPage.screenshot({
      path: path.join(EVIDENCE_DIR, 'admin-schema-diff-resolve-422.png'),
      fullPage: true,
    });
  });
});
```

> selector / aria-label / role name は実装の current state（`SchemaDiffPanel.tsx` 読みながら確定）。実装に `data-testid` が無い場合は role + name の安定 selector に組み替える。selector ズレが Phase 5 test plan の失敗源になりやすいので、spec 修正は本タスク内で完結させる（実装変更は禁止）。

### Step 5: local stack 起動

```bash
# terminal A — API
mise exec -- pnpm --filter @ubm-hyogo/api dev

# 起動後、別 shell で D1 状態確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local \
  --command "SELECT COUNT(*) FROM schema_fields;"

# seed 投入
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local \
  --file=scripts/fixtures/serial-05-step-03/seed-cleanup.sql
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local \
  --file=scripts/fixtures/serial-05-step-03/seed-diff.sql

# /admin/schema/diff 疎通
curl -s http://127.0.0.1:8787/admin/schema/diff | jq '.diff | length'   # > 0 を期待
```

### Step 6: admin storageState 取得

1. `bash scripts/with-env.sh mise exec -- pnpm --filter @ubm-hyogo/web dev` を起動
2. ブラウザで `http://localhost:3000/login` を開き、テストアカウント `manjumoto.daishi@senpai-lab.com` で Magic Link ログイン
3. `/admin/schema` に到達することを確認
4. DevTools → Application → Cookies から `next-auth.session-token` を取得
5. 以下を `apps/web/playwright/.auth/admin.json` として保存:

```json
{
  "cookies": [
    {
      "name": "next-auth.session-token",
      "value": "<TOKEN>",
      "domain": "localhost",
      "path": "/",
      "httpOnly": true,
      "secure": false,
      "sameSite": "Lax",
      "expires": -1
    }
  ],
  "origins": []
}
```

このファイルは Step 1 の `.gitignore` で commit 除外される。

### Step 7: Playwright 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --config=playwright.admin-schema-diff.config.ts \
  --reporter=line \
  2>&1 | tee docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/playwright.log
echo "EXIT_CODE=$?" >> docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/playwright.log
```

PASS 判定: `EXIT_CODE=0` && evidence path に 11 PNG 生成。

### Step 8: cleanup

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local \
  --file=scripts/fixtures/serial-05-step-03/seed-cleanup.sql
```

### Step 9: manifest / state 更新

Phase 7 / 8 に従って:
- `outputs/phase-11/manifest.json` を `pass: true` / `verdict: PASS` / `captured: [...]` に
- `outputs/phase-12/main.md` の `phase_status (11) = completed` / `workflow_state = completed`
- `outputs/phase-12/unassigned-task-detection.md` の該当行 `consumed`
- `docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md` 末尾に YAML frontmatter 追記

## 2. 反復ループ

- selector / seed SQL が実 schema と合わずに spec fail した場合、**実装側を変えず spec 側 / seed 側を調整**する反復ループのみ許可
- 3 回失敗で Phase 9 rollback + ユーザーへエスカレーション

## 3. コミット粒度（PR 作成時）

ユーザー承認後の commit ターゲット（事前準備）:

1. `feat(issue-775): playwright spec + seed fixture for SchemaDiffPanel runtime evidence`
2. `docs(issue-775): SchemaDiffPanel runtime screenshots (11 PNG)`
3. `docs(issue-775): mark phase-11 evidence completed + consume unassigned-task`

コミット文言には `Refs #775` を入れる（`Closes #775` 禁止 — issue は既に closed）。
