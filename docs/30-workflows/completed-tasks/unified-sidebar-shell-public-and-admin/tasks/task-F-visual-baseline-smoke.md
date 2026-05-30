# Task F — Visual baseline + smoke spec

[実装区分: 実装仕様書]

## 目的

統合 sidebar shell の regression を防ぐため、Playwright で 3 ロール × 3 viewport の
visual baseline と smoke を捕捉する。

## 前提

- Task A〜E 完了
- 既存 admin-staging-visual の playwright config（`apps/web/playwright.config.ts`）が
  `snapshotPathTemplate {projectName}` 固定を採用済み

## 変更対象ファイル

### 新規

- `apps/web/tests/e2e/sidebar-shell-smoke.spec.ts`
- `apps/web/tests/e2e/sidebar-shell-visual.spec.ts`
- `apps/web/tests/e2e/_helpers/sidebar.ts`（共通操作: open drawer / toggle collapse）

### 編集

- `apps/web/playwright.config.ts`: project `sidebar-shell-visual`（chromium）を追加。`testMatch: 'sidebar-shell-visual.spec.ts'`、viewport を 1280×800 / 768×1024 / 375×812 の 3 種で run

## smoke (sidebar-shell-smoke.spec.ts)

| ケース | 期待 |
|-------|------|
| `viewer` で `/` を開く | sidebar に PUBLIC グループのみ、左下に「ログイン」リンク |
| `member` で `/profile` を開く | sidebar に PUBLIC + MEMBERS、左下 popover に 3 action |
| `admin` で `/admin` を開く | sidebar に 3 group + ADMIN 9 item（total 13）、左下 popover に 4 action（「管理者ダッシュボード」含む）|
| 375px で `/` を開く | sidebar は非表示、hamburger 押下で drawer overlay 表示 |
| 1024px で collapse toggle 押下 | sidebar が collapsed（icon のみ）になり localStorage 反映 |
| route 遷移時 drawer auto-close | drawer 内のリンクをクリックすると drawer が閉じる |

## visual baseline (sidebar-shell-visual.spec.ts)

各 (role × viewport) で `await expect(page).toHaveScreenshot()` を実行:

| viewport | role | screenshot file |
|---------|------|----------------|
| 1280×800 | viewer | `/-1280.png` |
| 1280×800 | member | `/profile-1280.png` |
| 1280×800 | admin | `/admin-1280.png` |
| 768×1024 | viewer | `/-768.png` |
| 768×1024 | admin | `/admin-768.png` |
| 375×812 | viewer | `/-375.png` |
| 375×812 | admin (drawer open) | `/admin-375-drawer.png` |

合計 7 枚。baseline は Linux runner で生成（CI artifact から download）。
ローカル macOS で生成した PNG は commit しない。

## auth fixture

既存 `apps/web/tests/e2e/fixtures/auth.ts` の `viewerStorageState` / `memberStorageState` /
`adminStorageState` を利用。新規 storage state は作らない。

## CI gate

- `playwright-smoke / smoke (chromium)` matrix に `sidebar-shell-smoke` を追加
- `playwright-smoke / visual (sidebar-shell)` を新 matrix として追加
- failure は dev / main の required check 候補（ユーザー承認後）

## ローカル実行

```bash
# smoke
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test sidebar-shell-smoke

# visual (baseline 比較は CI 側のみ)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test sidebar-shell-visual --update-snapshots
# → 生成された PNG は CI からのみ commit
```

## DoD

1. smoke spec 6 ケース green
2. visual spec 7 screenshot baseline が CI で生成・commit される（ユーザー承認後）
3. `pnpm typecheck && pnpm lint` green
4. CI gate に `sidebar-shell-smoke` が登録される
