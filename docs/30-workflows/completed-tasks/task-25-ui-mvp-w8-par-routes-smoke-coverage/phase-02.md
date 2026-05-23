# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 2 / 設計 |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 2 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 2 の判断結果を `outputs/phase-02/design.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-02/design.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 2 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-02/design.md` に集約する。

## 詳細

## 1. 主成果物（SMOKE-COVERAGE-MATRIX.md）の構造設計

### セクション構成

```
1. 概要 / scope（17 URL smoke + 2 component surfaces × 5 軸）
2. CI gate 参照（task-18 job 名）
3. 凡例（5 軸 / status記号 / N/A 定義 / 4 baseline マーキング）
4. Coverage Matrix（main table: 19 surface 行 × 8 列）
   列: # / 層 / route / status / DOM / token / a11y / interaction / visual baseline / 既存 spec
5. 軸別詳細（5 サブセクション）
   5.1 status 軸: 各 route の expected status / redirect
   5.2 DOM 軸: data-testid / landmark 一覧
   5.3 token 軸: utility class / OKLch verification path
   5.4 a11y 軸: axe-core rule profile
   5.5 interaction 軸: 必須 1 件の smoke interaction
6. 共通 3 component（error/not-found/loading）の観測戦略
7. 既存 4 visual baseline との関係
8. 残り 15 non-baseline surfaces の visual baseline 採取候補（将来タスク）
9. 既存 spec → matrix 行 の逆引きマップ
10. 変更履歴
```

### 列定義

| 列 | 型 | 例 |
|----|----|----|
| `#` | int | 1〜19 |
| `層` | enum | 公開 / 会員 / 管理 / 共通 |
| `route` | string | `/`, `/members/[id]` |
| `status` | code | `200`, `redirect→/login` |
| `DOM` | selector | `[data-testid="public-hero"]` |
| `token` | utility ref | `bg-ubm-color-bg-soft` |
| `a11y` | profile | `wcag2a+wcag2aa, exclude:color-contrast` |
| `interaction` | action | `click [data-testid=login-submit]` |
| `visual baseline` | enum | `✓ login` / `—` |
| `既存 spec` | path | `full-smoke.spec.ts` |

## 2. 5 軸 → Playwright API 対応マップ

### status

```ts
const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })
expect(response).not.toBeNull()
expect(response!.status()).toBeLessThan(400)
// redirect 期待時
if (route.expectRedirectTo) {
  expect(page.url()).toMatch(route.expectRedirectTo)
}
```

### DOM

```ts
await page.locator('[data-testid="admin-dashboard"]').first()
  .waitFor({ state: 'visible', timeout: 10_000 })
```

### token（既存 verify-design-tokens を補完する runtime 観測）

```ts
// option A: runtime computed style 観測
const color = await page.locator('main').first()
  .evaluate((el) => getComputedStyle(el).backgroundColor)
expect(color).not.toBe('rgba(0, 0, 0, 0)') // utility class が適用されている

// option B: matrix としては「verify-design-tokens に委譲」と記載
```

### a11y

```ts
const result = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa'])
  .disableRules(['color-contrast'])
  .analyze()
const blocking = result.violations.filter(v =>
  ['serious', 'critical'].includes(v.impact ?? '')
)
expect(blocking).toEqual([])
```

### interaction（route 別 1 件、smoke レベル）

```ts
// /login の例
await page.locator('input[name="email"]').fill('test@example.com')
await page.locator('[data-testid="login-submit"]').click()
// /admin/members の例
await page.locator('[data-testid="admin-members-search"]').fill('foo')
await page.keyboard.press('Enter')
```

## 3. 共通 3 component の観測戦略

| component | トリガ条件 | Playwright 観測 |
|-----------|-----------|-----------------|
| `not-found.tsx` | 存在しない path `/__not_found_canary` への直接訪問 | `expect(page.locator('[data-testid="not-found"]')).toBeVisible()` |
| `error.tsx` | サーバ side で `throw` する canary route（任意・既存 fixture 有無を Phase 6 で確認） | `expect(page.locator('[data-testid="error-boundary"]')).toBeVisible()`（既存 fixture 無ければ `N/A + future task` 記載） |
| `loading.tsx` | network throttle で fallback UI を捕捉 | `await page.route('**/api/**', r => setTimeout(() => r.continue(), 500))` → `expect(page.locator('[data-testid="loading"]')).toBeVisible()`（observability が困難な場合は `N/A + 観測戦略を future task で確立` 記載） |

## 4. 既存 4 visual baseline との関係

| route | visual baseline 有無 | 採取条件 | 関係 |
|-------|---------------------|----------|------|
| `/` | ✓ `public-top` | `playwright/tests/visual/public-top.spec.ts` | matrix の `visual baseline` 列に `✓ public-top` |
| `/login` | ✓ `login` | `playwright/tests/visual/login.spec.ts` | `✓ login` |
| `/admin` | ✓ `admin-dashboard` | `playwright/tests/visual/admin-dashboard.spec.ts` | `✓ admin-dashboard` |
| `/profile` | ✓ `profile` | `playwright/tests/visual/profile.spec.ts` | `✓ profile` |
| その他 15 routes | — | 未採取 | `—` + section 8 で future task 化 |

## 5. ファイル配置

```
docs/30-workflows/
├── task-25-ui-mvp-w8-par-routes-smoke-coverage/   # 本タスク仕様書
│   ├── index.md / artifacts.json / phase-01..13.md
│   └── outputs/phase-01..13/
└── ui-prototype-alignment-mvp-recovery/
    └── SMOKE-COVERAGE-MATRIX.md                    # 主成果物
```

## 6. 状態所有権

| 責務 | 所有 |
|------|------|
| smoke route 一覧の SSOT | `apps/web/playwright/tests/full-smoke.spec.ts` の `ROUTES[]`（task-18） |
| visual baseline | `apps/web/playwright/tests/visual/` |
| coverage matrix（観測結果の整理） | **本タスクの SMOKE-COVERAGE-MATRIX.md** |
| token SSOT | `docs/00-getting-started-manual/specs/09b-design-tokens.md` §9 JSON |
| CI gate context 名 | `.github/workflows/playwright-smoke.yml`（task-18） |

## 7. 既存コンポーネント再利用可否（[FB-SDK-07-1]）

- **再利用**: 既存 `full-smoke.spec.ts` の `ROUTES[]` 配列 / `visual/*.spec.ts` baseline / `task-18` 仕様 §0.6 で明示済みの 17 URL smoke entries + 2 component surfaces selector
- **新規追加**: なし。matrix 行は既存 spec から逆引きで生成する
