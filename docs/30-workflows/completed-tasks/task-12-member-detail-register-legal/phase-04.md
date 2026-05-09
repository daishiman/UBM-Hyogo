# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 4 |
| task | task-12-member-detail-register-legal |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

task-12 が触れる 4 画面 + 7 component + 1 primitive の品質を、vitest（unit）+ Playwright（E2E smoke）+ axe-core（a11y critical=0）の 3 層で固定する。一次原典 §5 を Phase 4 形式（TC-U-NN / TC-E-NN）で再構成し、Phase 7 AC マトリクスがそのまま参照できる粒度で整える。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目（vitest / Playwright 実行）は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md` §5 / §6 / §7
- `.claude/skills/task-specification-creator/references/quality-gates.md`
- `apps/web/playwright.config.ts`（既存 / task-05 で `staging-smoke` project 追加済み前提）
- `apps/web/vitest.config.ts`（既存）

## 成果物

- `outputs/phase-04/main.md`

## 統合テスト連携

`apps/web/playwright/tests/public-detail-register-legal.spec.ts` は本 task が新設し、4 ページ + 404 page を smoke する。task-18 W6-SER の 19 routes 包括 regression-smoke が後段で同一ルートを再走査するため、本 task は selector / DOM アンカー（`data-page` / `data-component` / `data-section` / `data-stable-key` / `data-role`）の正本を確定させる。

## テスト pyramid

| 層 | フレームワーク | 対象 |
| --- | --- | --- |
| 単体 | Vitest + React Testing Library | MemberDetailSections / MemberLinks / MemberTags / RegisterCallout / LegalProse / FormPreviewSections の props mapping / DOM 属性 / 0 件分岐 |
| 統合 | （本 task 範囲外） | — |
| E2E smoke | Playwright + `@axe-core/playwright` | `/(public)/members/{seedId}` / `/(public)/members/non-existent-id`（404）/ `/(public)/register` / `/privacy` / `/terms` の 200/404 + 主要要素 visible + axe critical=0 |

## 単体テスト仕様

### `apps/web/src/components/public/MemberDetailSections.test.tsx`

| ケース ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-01 | 各 section に `<h2>` が出る | `sections=[{key:"profile",label:"プロフィール",fields:[...]},{key:"work",label:"仕事",fields:[...]}]` | `<h2>プロフィール</h2>` / `<h2>仕事</h2>` がそれぞれ visible |
| TC-U-02 | 全 row に `data-stable-key` が付く（不変条件 #1） | `fields=[{stableKey:"q1.fullName",...},{stableKey:"q5.bio",...}]` | `[data-stable-key="q1.fullName"]` / `[data-stable-key="q5.bio"]` が DOM 上に存在 |
| TC-U-03 | `field.kind === "url"` は section から除外される | `fields=[{kind:"url",...},{kind:"text",...}]` | url field の label / value が `MemberDetailSections` 配下に出現しない（DOM 検査） |
| TC-U-04 | `value` が配列なら `, ` join される | `value=["A","B","C"]` | テキスト `"A, B, C"` が visible |
| TC-U-05 | `value` が null/empty なら `"—"` 表示 | `value=null` または `value=""` | テキスト `"—"` が visible |
| TC-U-06 | `<section data-section={key}>` が wrap している | `key="profile"` | `[data-section="profile"]` が存在 |

### `apps/web/src/components/public/MemberLinks.test.tsx`

| ケース ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-07 | `url` kind の field のみ抽出 | mixed sections（`text` / `url` / `tags`） | `<a>` 要素の数が url field の数と一致 |
| TC-U-08 | 0 件で `null` 返却 | sections に url field なし | 描画なし（`render` 結果が `null`） |
| TC-U-09 | `target="_blank" rel="noopener noreferrer"` 必須 | url field 1 件 | `<a target="_blank" rel="noopener noreferrer" href="...">` が DOM 上に存在 |

### `apps/web/src/components/public/MemberTags.test.tsx`

| ケース ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-10 | tags=[] で `null` 返却 | `tags=[]` | 描画なし |

### `apps/web/src/components/public/RegisterCallout.test.tsx`

| ケース ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-11 | responderUrl が `<a>` href に反映 | `responderUrl="https://docs.google.com/forms/d/e/1FAI.../viewform"` | `<a>` の `href` が同 URL |
| TC-U-12 | `target="_blank" rel="noopener noreferrer"` 必須 | 同上 | `target="_blank"` / `rel="noopener noreferrer"` が同 anchor に付く |

### `apps/web/src/components/legal/LegalProse.test.tsx`

| ケース ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-13 | `<article className="prose">` で wrap | `children=<h1>X</h1>` | `<article class="prose" data-component="legal-prose">` が root |
| TC-U-14 | 子要素がそのまま描画される | `children=<h1>Hello</h1><p>World</p>` | `<h1>Hello</h1>` / `<p>World</p>` が visible |

### `apps/web/src/components/public/FormPreviewSections.test.tsx`

| ケース ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-15 | preview が空 sections でも crash しない | `preview={ formId:"x", responderUrl:null, sectionCount:0, questionCount:0, sections:[] }` | render が throw せず、`sectionCount` `0` が表示 |

### mock 方針

```ts
// shared schema は実物を使う（型整合のため）
// fetchPublic / fetchPublicOrNotFound は単体テスト対象外（page.tsx は e2e でカバー）
// logger / Sentry は本 task の単体テスト対象外（task-04 / task-03 が責務）
```

## E2E smoke 仕様

ファイル: `apps/web/playwright/tests/public-detail-register-legal.spec.ts`

### 環境変数 / fixture

```ts
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const SEED_MEMBER_ID = process.env.SEED_MEMBER_ID ?? "<seed id from apps/api/migrations>";
```

### `describe` ブロック構成

| ID | describe | route | 期待 |
| --- | --- | --- | --- |
| TC-E-01 | `task-12 / member-detail / 200` | `/(public)/members/{SEED_MEMBER_ID}` | HTTP 200 / `<h1>` visible / `[data-component="profile-hero"]` visible / `[data-section]` 1 件以上 / `[data-stable-key]` 1 件以上 / axe critical=0 |
| TC-E-02 | `task-12 / member-detail / 404` | `/(public)/members/non-existent-id` | HTTP 404 / Next.js notFound page visible（「ページが見つかりません」相当テキスト or task-05 の `not-found.tsx` UI） |
| TC-E-03 | `task-12 / register / 200` | `/(public)/register` | HTTP 200 / `[data-component="register-callout"]` visible / `<a target="_blank" rel="noopener noreferrer">` で responderUrl に飛ぶ anchor が 1 件 / axe critical=0 |
| TC-E-04 | `task-12 / register / preview-error fallback` | `/(public)/register`（API mock or staging form-preview 故意 fail） | `[data-role="preview-error"]` が `role="alert"` で visible、CTA anchor は引き続き `href` に `1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ` を含む（FALLBACK_RESPONDER_URL 機能維持） |
| TC-E-05 | `task-12 / privacy / 200` | `/privacy` | HTTP 200 / `<h1>プライバシーポリシー</h1>` visible / `[data-component="legal-prose"]` visible / `<h2>` 5 件以上 / axe critical=0 |
| TC-E-06 | `task-12 / terms / 200` | `/terms` | HTTP 200 / `<h1>利用規約</h1>` visible / `[data-component="legal-prose"]` visible / `<h2>` 5 件以上 / axe critical=0 |

### a11y 個別アサーション

| ID | 観点 | 検証 |
| --- | --- | --- |
| A11Y-01 | LegalProse の見出し階層 (`h1` → `h2`) が単調増加で skip しない | `/privacy` / `/terms` で `<h3>` が `<h2>` 不在のまま出現していない |
| A11Y-02 | `<a target="_blank">` は `rel="noopener noreferrer"` 必須 | RegisterCallout / MemberLinks の anchor で `target` と `rel` の組を確認 |
| A11Y-03 | 詳細ページの戻る link は keyboard で focusable | `[data-role="back"]` を `Tab` で focus 可能 |
| A11Y-04 | ProfileHero の Avatar は decorative | Avatar が `aria-hidden="true"` または `role` 未設定 + `<h1>` で fullName が読み上げられる |

### Playwright spec 雛形

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SEED_MEMBER_ID = process.env.SEED_MEMBER_ID;

test.beforeAll(() => {
  if (!SEED_MEMBER_ID) {
    throw new Error("[task-12 e2e] SEED_MEMBER_ID is required");
  }
});

test.describe("task-12 / member-detail", () => {
  test("TC-E-01 / 200 + axe critical=0", async ({ page }) => {
    const res = await page.goto(`/members/${SEED_MEMBER_ID}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('[data-component="profile-hero"]')).toBeVisible();
    await expect(page.locator("[data-section]").first()).toBeVisible();
    await expect(page.locator("[data-stable-key]").first()).toBeVisible();
    const axe = await new AxeBuilder({ page }).analyze();
    const critical = axe.violations.filter((v) => v.impact === "critical");
    expect(critical).toHaveLength(0);
  });

  test("TC-E-02 / 404", async ({ page }) => {
    const res = await page.goto("/members/non-existent-id");
    expect(res?.status()).toBe(404);
  });
});

test.describe("task-12 / register", () => {
  test("TC-E-03 / 200 + external CTA", async ({ page }) => {
    const res = await page.goto("/register");
    expect(res?.status()).toBe(200);
    await expect(page.locator('[data-component="register-callout"]')).toBeVisible();
    const cta = page.locator('[data-component="register-callout"] a[target="_blank"]').first();
    await expect(cta).toHaveAttribute("rel", /noopener\s+noreferrer/);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });
});

test.describe("task-12 / legal", () => {
  test("TC-E-05 / privacy", async ({ page }) => {
    const res = await page.goto("/privacy");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1", { hasText: "プライバシーポリシー" })).toBeVisible();
    await expect(page.locator('[data-component="legal-prose"]')).toBeVisible();
    expect(await page.locator("h2").count()).toBeGreaterThanOrEqual(5);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  test("TC-E-06 / terms", async ({ page }) => {
    const res = await page.goto("/terms");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1", { hasText: "利用規約" })).toBeVisible();
    await expect(page.locator('[data-component="legal-prose"]')).toBeVisible();
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });
});
```

## カバレッジ目標

- `apps/web/src/components/public/MemberDetailSections.tsx` — Statement / Branch ≥ 90%（url 除外 / 配列 join / null fallback の 3 分岐を踏む）
- `apps/web/src/components/public/MemberLinks.tsx` — Statement / Branch ≥ 90%（0 件分岐 / `target="_blank"` 付与）
- `apps/web/src/components/public/MemberTags.tsx` — Statement ≥ 80%
- `apps/web/src/components/public/RegisterCallout.tsx` — Statement / Branch ≥ 90%
- `apps/web/src/components/legal/LegalProse.tsx` — Statement ≥ 80%（render snapshot 中心）
- `apps/web/src/components/public/FormPreviewSections.tsx` — Statement ≥ 80%

## 実行コマンド

```bash
# 依存と型 / lint
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 単体テスト（task-12 範囲のみ）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal

# ローカル dev（4 画面 visual 確認）
mise exec -- pnpm --filter api dev   # Hono Worker on :8787
mise exec -- pnpm --filter @ubm-hyogo/web dev   # Next.js on :3000

# Playwright smoke（task-12 spec のみ）
PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium

# Cloudflare 系操作はラッパー経由
bash scripts/cf.sh whoami
```

> Cloudflare 系 CLI は **`bash scripts/cf.sh` 経由のみ**（CLAUDE.md 記載）。`wrangler` 直接実行禁止。

## 完了条件

- [ ] TC-U-01〜TC-U-15 が `apps/web/src/components/{public,legal}/*.test.tsx` に reify されている
- [ ] TC-E-01〜TC-E-06 が `apps/web/playwright/tests/public-detail-register-legal.spec.ts` の `describe` ブロックとして定義されている
- [ ] A11Y-01〜A11Y-04 が axe / Playwright assertion で実装されている
- [ ] `test.describe.skip` / `test.skip(true)` / `it.skip` が本 task の test に無い
- [ ] `SEED_MEMBER_ID` を環境変数として要求する `beforeAll` guard が spec 冒頭にある
- [ ] カバレッジ目標が `vitest --coverage` / CI で確認できる構成になっている
- [ ] 不変条件 #1 監査（`data-stable-key` 全 row 焼き込み）が TC-U-02 で gate されている
- [ ] 外部リンク `noopener noreferrer` が TC-U-09 / TC-U-12 / A11Y-02 の 3 箇所で gate されている
