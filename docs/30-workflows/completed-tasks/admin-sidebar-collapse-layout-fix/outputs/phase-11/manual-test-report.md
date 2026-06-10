# Phase 11 Manual Test Report — admin-sidebar-collapse-layout-fix

workflow_state: `implemented_local_evidence_captured` / 生成日: 2026-06-08

本レポートは `manual-test-result.md` を補完する **採番証跡**である。検証項目を AC-1..AC-9 に
対応づけ、各 Status を `captured_local_fixture`（実行済み）として記録する。focused Vitest は 3 files / 30 tests PASS、screenshot は 3 PNG present。

## 証跡の主ソース

| ソース | 内容 | 取得タイミング |
| --- | --- | --- |
| focused vitest | shell の collapsed/expanded className contract（`SidebarNavItem` / `SidebarUserMenu` / `SidebarShell`） | 2026-06-09 実行済み |
| Playwright screenshot | local fixture pixel screenshot（collapsed-desktop / expanded-desktop / collapsed-user-menu-open） | 2026-06-09 取得済み |
| staging 認証済み baseline | 実認証環境の実 sidebar 描画 | Phase 13 user-gated |

> Browser plugin の `iab` は利用不可だったため、同じ localhost を Playwright Chromium fallback で検証した。

## 検証項目（EC = expected-check / SD = screenshot-driven）

| ID | 種別 | 検証内容 | 対応 AC | 確認手段 | Status |
| --- | --- | --- | --- | --- | --- |
| EC-001 | focused vitest | collapsed 時 nav-item className に `px-0` / `w-full` / `justify-center` を含み `px-3` を含まない | AC-1 | jsdom class assertion | captured_local_fixture |
| EC-002 | focused vitest | collapsed 時 user-menu summary className に中央化 class（`px-0 w-full justify-center`）が付与される | AC-1 | jsdom class assertion | captured_local_fixture |
| EC-003 | focused vitest | `SidebarBrand` に collapsed 分岐が新設され、collapsed 時 `justify-center px-0`・expanded 時 `px-3 gap-2` | AC-1 | jsdom class assertion（新規 spec） | captured_local_fixture |
| EC-004 | focused vitest | `AdminPublicReturn`（SidebarShell）が collapsed 時 NavItem と統一の中央化 class を持つ | AC-1 | jsdom class assertion | captured_local_fixture |
| SD-001 | screenshot | icon(18px)/mark(32px)/avatar(36px) が collapsed 幅(64px) 内に収まり aside からはみ出さない | AC-2 | `sidebar-collapsed-desktop.png`（TC-11-1） | captured_local_fixture |
| SD-002 | screenshot | 全行のアイコン水平中心が aside 縦中心線に一致し collapse-toggle と軸が揃う | AC-3 | `sidebar-collapsed-desktop.png`（TC-11-1） | captured_local_fixture |
| EC-005 | focused vitest + screenshot | collapsed active nav-item の左ボーダー（`data-[active=true]:border-[var(--ubm-color-accent)]`）が維持され破綻しない | AC-4 | class assertion + `sidebar-collapsed-desktop.png` | captured_local_fixture |
| SD-003 | screenshot | expanded 時にレイアウト regression がない（テキスト/アイコン配置・既存 baseline 維持） | AC-5 | `sidebar-expanded-desktop.png`（TC-11-2） | captured_local_fixture |
| EC-006 | focused vitest + screenshot | collapsed 時 displayName/role が `sr-only`、expanded 時に表示テキスト。user-menu popover open で意味的可視性が保たれる | AC-6 | class assertion + `sidebar-collapsed-user-menu-open.png`（TC-11-3） | captured_local_fixture |
| EC-007 | grep gate | 色は `var(--ubm-color-*)` 経由のみ。`apps/web/src` 配下に HEX/`bg-[#xxx]`/`text-[#xxx]` の新規追加なし | AC-7 | `pnpm verify:tokens` | captured_local_fixture |
| EC-008 | grep gate | API(`apps/api`)/D1 migration/Google Form schema/endpoint/fetch URL が無変更 | AC-8 | `git diff --name-only -- apps/api`（空） | captured_local_fixture |
| EC-009 | CI 検証 | `pnpm typecheck && pnpm lint && focused vitest` green。shell spec が collapsed レイアウト contract を検証 | AC-9 | typecheck / lint / vitest | captured_local_fixture |

## 取得済み screenshot 一覧

| TC | canonical 名 | viewport | 配置先 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-11-1 | `sidebar-collapsed-desktop.png` | 1280x800 | `outputs/phase-11/screenshots/sidebar-collapsed-desktop.png` | AC-1/2/3/4 |
| TC-11-2 | `sidebar-expanded-desktop.png` | 1280x800 | `outputs/phase-11/screenshots/sidebar-expanded-desktop.png` | AC-5 |
| TC-11-3 | `sidebar-collapsed-user-menu-open.png` | 1280x800 | `outputs/phase-11/screenshots/sidebar-collapsed-user-menu-open.png` | AC-6（+ OOS-1 実機確認） |

## サマリ

| 区分 | 件数 | Status |
| --- | --- | --- |
| focused vitest 検証項目（EC） | 9（EC-001..009） | すべて captured_local_fixture |
| screenshot 検証項目（SD） | 3（SD-001..003） | すべて captured_local_fixture |
| AC カバレッジ | AC-1..AC-9 全網羅 | local evidence captured |

> カバレッジ % は本タスクの要求外。focused contract と screenshot evidence を主証跡とする。
