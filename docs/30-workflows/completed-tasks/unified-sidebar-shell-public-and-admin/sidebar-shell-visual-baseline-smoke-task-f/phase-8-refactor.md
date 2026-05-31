---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 8
phase_name: リファクタリング
created_at: 2026-05-29
---

# Phase 8: リファクタリング

[実装区分: 実装仕様書]

本 Task F は新規ファイルのみで構成し（spec 2 本 + helper 1 本 + config 追記 + CI 追記）、
Task E と異なり既存 spec の削除・統合・rename は無い。したがって本 Phase の主眼は
「共通操作の helper 集約」「selector 契約の単一正本化」「旧パス誤参照の grep gate」
「import path / glob 整合」「命名規約」を**最初から壊れない形で書き切る**ことにある。

---

## 1. 共通操作の helper 集約（`_helpers.ts`）

shell の共通操作はすべて `apps/web/playwright/tests/sidebar-shell/_helpers.ts` に集約し、
smoke / visual 両 spec から再利用する。各 spec は「fixture page → goto → helper 呼び出し → assert / screenshot」
の数行構成に保ち、spec 本体に操作ロジックを散らさない。

集約する関数（Phase 2 §4 の signature を正本とする）:

| 関数 | 責務 | 実装要点 |
|---|---|---|
| `waitShellReady(page)` | shell landmark の表示待ち | `[data-testid="app-shell"]` と `[data-testid="shell-sidebar"]` が visible になるまで `await expect(...).toBeVisible()`。ネットワーク idle ではなく landmark 到達で待つ |
| `freezeAnimations(page)` | animation / transition / caret 抑止（visual 安定化） | `page.addStyleTag` で `*{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}` を注入 |
| `openDrawer(page)` | mobile drawer を開く | `[data-testid="shell-drawer-toggle"]` を click → `[data-testid="shell-drawer"]` が visible になるまで待つ |
| `toggleCollapse(page)` | collapse 状態へ遷移 | `[data-testid="shell-collapse-toggle"]` を click → collapsed クラス / 幅縮小を待つ |

- 各 spec の 1 test は原則 6〜10 行（import + fixture 受け取り + goto + helper 1〜2 呼び出し + assert/screenshot）に収める。
- helper は副作用を持つ操作のみを置き、assertion は spec 側に残す（screenshot/visible 判定は呼び出し元の責務）。
- helper の戻り値は `Promise<void>` に統一し、locator を返さない（selector は §2 の通り helper 内に閉じる）。

---

## 2. selector 契約の単一正本化

`data-testid` は helper 内（`_helpers.ts`）と各 spec の冒頭定数のいずれか一方を正本とし、
**spec 本体に生 selector 文字列を散らさない**。本仕様では helper が触る操作系 selector は helper 内に閉じ、
spec が直接参照する nav / link 系 selector は `_helpers.ts` から `export const SHELL_TESTID` として export して共有する。

```ts
// apps/web/playwright/tests/sidebar-shell/_helpers.ts（抜粋イメージ）
export const SHELL_TESTID = {
  root: 'app-shell',
  sidebar: 'shell-sidebar',
  drawerToggle: 'shell-drawer-toggle',
  drawer: 'shell-drawer',
  collapseToggle: 'shell-collapse-toggle',
  userMenu: 'shell-user-menu',
} as const
```

- 上記 6 testid は親 Task A〜E が shell component に付与する想定 attribute（Phase 2 §4 / Phase 3 R7）と 1:1 整合させる。
- Phase 5 着手時に親実装の実 attribute を `git grep -n "data-testid=\"shell-" apps/web/src/components/shell` で確認し、
  乖離があれば **Task F 側で testid を勝手に増やさず**、親 spec へ同一 wave で attribute 追加を申し送る（R7）。
- nav group（PUBLIC / MEMBERS / ADMIN）や「ログイン」「管理者ダッシュボード」などのラベル文言は、
  親 design spec（`unified-sidebar-shell-public-and-admin/index.md`）のロール語彙を正本に role-based locator
  （`getByRole('link', { name: 'ログイン' })` 等）で参照し、CSS class 依存の脆い selector を使わない。

---

## 3. grep gate（旧パス / 誤参照の 0 件確認）

実装完了後、以下の grep が **すべて 0 件** であることを Phase 9 §3 で確認する。
source task が記載した旧パス（`apps/web/tests/e2e/sidebar-shell`）と、Task E から誤って引きずる
`*StorageState` 参照を検出する。

```bash
# (1) source task の旧 e2e パス参照が残っていないこと（0 件）
git grep -n "tests/e2e/sidebar-shell" -- apps/web .github/workflows

# (2) 存在しない storageState export を誤参照していないこと（0 件）
git grep -n "viewerStorageState\|memberStorageState\|adminStorageState" -- apps/web/playwright/tests/sidebar-shell

# (3) sidebar-shell spec/config 内に旧 helper dir 参照が無いこと（0 件）
git grep -n "_helpers/sidebar" -- apps/web
```

- (1)(2)(3) いずれかが 1 件以上ヒットした場合はパストポロジ補正（phase-1 §7）違反として実装を差し戻す。

---

## 4. import path / glob 整合

| 対象 | 正本 path | 根拠 |
|---|---|---|
| spec → helper | `import { waitShellReady, ... } from './_helpers'`（同階層） | helper は spec と同一 dir `apps/web/playwright/tests/sidebar-shell/` |
| spec → auth fixture | `import { test, expect } from '../../fixtures/auth'`（2 階層上） | fixture 実体は `apps/web/playwright/fixtures/auth.ts`。spec は `apps/web/playwright/tests/sidebar-shell/` 配下のため `../../fixtures/auth` |
| config testMatch（smoke） | `testMatch: /sidebar-shell\/sidebar-shell-smoke\.spec\.ts$/` | smoke 専用 project に固定（Phase 3 R2） |
| config testMatch（visual） | `testMatch: /sidebar-shell-visual\.spec\.ts$/` + `testDir: './playwright/tests/sidebar-shell'` | visual 3 project 共通（Phase 2 §7） |
| config testIgnore（既存 default project） | `desktop-chromium` / `visual-chromium` の testIgnore に `/sidebar-shell\/sidebar-shell-visual\.spec\.ts$/` を追加 | visual spec が local default project で誤実行され baseline 重複するのを防ぐ（Phase 2 §7 / Phase 3 R6） |

- auth fixture の相対階層（`../../fixtures/auth`）は Task E（`../../../fixtures/auth`、3 階層上）とは**異なる**点に注意。
  Task F の spec は `tests/sidebar-shell/`（2 階層）配下のため 2 階層上が正しい。Phase 5 着手時に `ls apps/web/playwright/fixtures/auth.ts` で実在を確認する。
- testMatch glob を `sidebar-shell/**/*.spec.ts` 系に固定し、`apps/web/tests/e2e/` 配下の旧想定 path を構造的に match させない。

---

## 5. naming（spec / helper / baseline file 命名規約）

| 種別 | 規約 | 例 |
|---|---|---|
| smoke spec | `sidebar-shell-smoke.spec.ts`（`*.spec.ts` のみ。`.test.ts` 禁止） | `sidebar-shell-smoke.spec.ts` |
| visual spec | `sidebar-shell-visual.spec.ts` | `sidebar-shell-visual.spec.ts` |
| helper | `_helpers.ts`（同階層、underscore prefix で testMatch から除外） | `_helpers.ts` |
| screenshot 引数 | `home-` / `profile-` / `admin-` prefix + viewport 幅。パス区切り `/` を含めない（Phase 3 R5） | `home-1280.png` / `profile-1280.png` / `admin-375-drawer.png` |
| baseline file（自動付与） | `<arg>-sidebar-shell-visual-<viewport>-linux.png` | `home-1280.png-sidebar-shell-visual-desktop-linux.png` |

- screenshot 引数の `/` 正規化（task-F の `/-1280.png` → `home-1280.png`）を再掲。`toHaveScreenshot('home-1280.png', ...)` のように
  第 1 引数へパス区切りを含めないことで、`-linux.png` 正本が snapshot dir 直下に安定配置される。
- 7 screenshot の引数名は Phase 1 §3.2 の表（V1〜V7）と逐語一致させる。
- `.spec.ts` 以外の suffix（特に `.test.ts`）は lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix` が reject する（CLAUDE.md 不変条件 #8）。
