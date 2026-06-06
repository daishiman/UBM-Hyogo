# workflow-shell-sidebar-tooltip-footer-header-responsive-artifact-inventory

| field | value |
| --- | --- |
| task_id | `shell-sidebar-tooltip-footer-header-responsive` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / local_browser_screenshots_present_staging_visual_pending_user_gate` |
| workflow root | `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/` |
| parent | none |
| issue | none |
| user-gated | staging visual screenshots, commit, push, PR |

## Purpose

Unified sidebar shell の追加 UX 改善として、collapsed icon-only controls の tooltip、公開フッターの sticky bottom、モバイルヘッダーの sticky top を同一 local cycle で実装する。

| concern | change |
| --- | --- |
| A | `SidebarTooltip` を shell 固有 primitive として追加し、collapsed nav / public return / collapse toggle に `role="tooltip"` + `aria-describedby` を付与 |
| A-details | `<details><summary>` 制約のある user menu は wrap せず、`summary` 内に同じ `.ubm-shell-tooltip` bubble を配置 |
| B | `[data-component="public-footer"]` を `position: sticky; bottom: 0; z-index: 20; background: var(--ubm-color-surface-bg)` 化 |
| C | mobile-bar に `sticky top-0 z-30` を追加し、`md:hidden` は維持 |

## Implementation Artifacts

| path | role |
| --- | --- |
| `apps/web/src/components/shell/SidebarTooltip.tsx` | collapsed tooltip wrapper / `aria-describedby` merge |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | collapsed nav item tooltip wiring |
| `apps/web/src/components/shell/SidebarShell.tsx` | admin public-return tooltip + mobile-bar sticky |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | summary-internal tooltip bubble |
| `apps/web/src/components/shell/SidebarCollapseToggle.tsx` | collapsed expand tooltip |
| `apps/web/src/styles/globals.css` | `.ubm-shell-tooltip(-wrap)` CSS |
| `apps/web/src/styles/legacy-public.css` | public footer sticky bottom CSS |
| `apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx` | tooltip DOM contract |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | nav tooltip regression |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | mobile-bar / public-return regression |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | details>summary tooltip regression |
| `apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx` | collapse toggle tooltip regression |

## Workflow Artifacts

| path | role |
| --- | --- |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/index.md` | workflow index / state |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/artifacts.json` | root metadata |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/artifacts.json` | output metadata mirror |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/phase-11/manual-test-result.md` | local visual evidence + staging boundary |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/phase-11/sidebar-collapsed-tooltip.png` | local browser screenshot |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/phase-11/public-footer-sticky-bottom.png` | local browser screenshot |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/phase-11/mobile-header-sticky.png` | local browser screenshot |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/phase-12/main.md` | strict 7 main |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/phase-12/phase12-task-spec-compliance-check.md` | task-spec compliance verdict |
| `docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/phase-12/system-spec-update-summary.md` | API/IPC/DB no-change + aiworkflow sync summary |

## Evidence

| command | result |
| --- | --- |
| `pnpm vitest run --passWithNoTests --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx` | PASS: 5 files / 33 tests |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS |
| `pnpm verify:tokens` | PASS |

## Invariants

- API endpoint / D1 schema / Google Form schema / auth middleware are unchanged.
- `useSidebarState()` remains the sole sidebar state owner.
- New primitive is shell-local only; `apps/web/src/components/ui/` is unchanged.
- Tooltip label is exposed as description, not as a replacement for the trigger accessible name.
- Local browser screenshots are present under `outputs/phase-11/`; staging visual screenshots remain user-gated and are not claimed as captured.

## Lessons Learned

苦戦箇所（実装で困難だった点）を将来簡潔に再解決できるよう番号付きで体系化する。先行 `sidebar-footer-pinning-and-account-popover-ux`（L-SFPP）と同じく artifact-inventory 埋め込み式（専用 lessons ファイルは新設しない＝既存 global ルールで足りるため）。

| ID | Lesson |
| --- | --- |
| L-SHTL-001 | **tooltip / sticky は祖先の `overflow` にクリップされる**。collapsed sidebar の tooltip バブルは sidebar 外（右側）へ吹き出すため、collapsed `SidebarNav` / `<aside>` が `overflow-hidden` / `overflow-y-auto` だと balloon が切れる。automation-30 review でこの clipping を検出し、対象祖先を `overflow-visible` へ補正して解決。public footer の `position: sticky; bottom: 0` も同様に `main` / `div.flex-1.flex-col` / shell-root に `overflow: hidden/clip` が無いことを grep 確認してから付与する（sticky は最近接スクロール祖先基準）。 |
| L-SHTL-002 | **`<details><summary>` は sibling `<span>` で wrap 不可**。`<summary>` は `<details>` の直下子でなければならず、外側 wrap は DOM contract を壊す。`SidebarUserMenu` は wrap せず `<summary>` を `relative` にして内部へ同じ `.ubm-shell-tooltip` bubble を直接配置（D-3）。汎用 wrap コンポーネントは semantics 要素へ無条件適用しない。 |
| L-SHTL-003 | **CSS `position: sticky` は jsdom で検証不可**（layout engine を持たず scroll offset を計算しない）。honest scope として unit test は DOM/class assertion のみ担保し、実 sticky 挙動は Phase 11 staging visual screenshot（user gate）へ委譲する。screenshot 未取得を PASS と捏造しない。Lane B/C（footer / mobile-bar sticky）はこの方針で `legacy-public.css` / `SidebarShell` の文字列 grep + visual baseline を主検証にした。 |
| L-SHTL-004 | **Phase 12 strict 7 の `outputs/phase-12/main.md` は物理ファイル必須**。root `phase-12-documentation.md` は strict 7 の `main.md` の代替として数えられず、今回の準拠 FAIL 原因だった。物理 `main.md` を作成して補正済み。 |
| L-SHTL-005 | **tooltip の accessible name は移管せず description として付与する**。`role="tooltip"` + `aria-describedby` で関連付け、trigger 側の既存 accessible name（sr-only ラベル / `aria-label` / `aria-current`）は維持する。`cloneElement` で既存 `aria-describedby` があれば space 区切りで連結し description 喪失を防ぐ。name と description が同文言でも多くの SR は二重読み上げしない。 |

> 上記はいずれも本タスク scope 内で消化済み（local implementation guidance）。既存 spec / VISUAL evidence boundary が既にカバーするため、新規 global skill ルール（task-specification-creator 等）の追加は不要と判定。`outputs/phase-12/main.md` strict 7 物理配置ルールも既存テンプレ要件であり、本サイクルは欠落補正のみ。
