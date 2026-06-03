# workflow-sidebar-footer-pinning-and-account-popover-ux-artifact-inventory

| field | value |
| --- | --- |
| task_id | `sidebar-footer-pinning-and-account-popover-ux` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate` |
| workflow root | `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/` |
| parent | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/` |
| issue | none |
| user-gated | staging authenticated screenshots, commit, push, PR |

## Purpose

Unified sidebar shell の UI/UX 不具合 4 件を同一 local cycle で修正する。

| concern | change |
| --- | --- |
| C1 | desktop sidebar を `100dvh` fixed-height + `overflow:hidden` にし、nav のみ内部スクロール、footer controls を `data-shell-block="sidebar-footer"` に固定 |
| C2 | collapsed sidebar の nav / public-return / user summary を中央寄せし、badge を `data-shell-block="nav-badge-dot"` に縮約 |
| C3 | `SidebarUserMenu` の `<details>` 正本を維持し、`browserDocument()` 経由の pointerdown / Escape close を追加 |
| C4 | `<main data-shell="main">` を flex column 化し、`PublicFooter` を `margin-top:auto` にする |

## Implementation Artifacts

| path | role |
| --- | --- |
| `apps/web/src/styles/globals.css` | `[data-shell="sidebar"]` fixed-height / overflow contract |
| `apps/web/src/styles/legacy-public.css` | `PublicFooter` sticky footer contract |
| `apps/web/src/components/shell/SidebarShell.tsx` | desktop aside split into scroll nav + fixed footer, main flex-column |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | outside pointerdown / Escape close via `browserDocument()` |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | collapsed center alignment + badge dot |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | footer block / main flex / collapsed structure regression |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | outside close / inside preserve / Escape close regression |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | collapsed center / badge dot regression |

## Workflow Artifacts

| path | role |
| --- | --- |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/index.md` | workflow index / AC / scope |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/artifacts.json` | root metadata |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/artifacts.json` | output metadata mirror |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/phase-11/manual-test-result.md` | local evidence + staging screenshot boundary |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/phase-11/screenshot-plan.json` | canonical staging screenshot plan |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/phase-12/phase12-task-spec-compliance-check.md` | task-spec compliance verdict |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/phase-12/system-spec-update-summary.md` | aiworkflow sync summary |

## Evidence

| command | result |
| --- | --- |
| `pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | PASS: 3 files / 22 tests |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS: 1 file / 9 tests |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |

## Invariants

- API endpoint / D1 schema / Google Form schema / auth middleware are unchanged.
- `useSidebarState()` return shape and `SidebarShell` / `SidebarUserMenu` public props are unchanged.
- Direct document access remains routed through `apps/web/src/lib/is-browser.ts` `browserDocument()`.
- DOM observation attributes are additive.
- Staging authenticated screenshots remain user-gated and are not claimed as captured.

## Lessons Learned

- **L-SFPP-001**: Phase 12 compliance の Phase 11 evidence 表 (`## 4`) の Path 列は **単一の実在ファイルパスのみ**。`outputs/phase-11/a.png / b.png` のように複数パスを ` / ` で連結すると gate parser が複合文字列を 1 パスとして `statSync` できず、PNG が実在しても `missing-evidence` で `ok:false` になる。証跡が複数あるときは行を分割して 1 行 1 ファイルにする。
- **L-SFPP-002**: ネイティブ `<details>` は outside-click 閉じをサポートしない。別 state を増やさず `<details>.open` を単一の真実源に保ったまま、`browserDocument()` 経由の `pointerdown` + `Escape` listener を **open 中のみ** 登録し cleanup で対称解除することで、SSR 安全 + hydration mismatch なしの popover 外側クリック閉じを実現できる。
- **L-SFPP-003**: sidebar の footer 固定は JS を使わず CSS のみで完結させる。`min-height:100vh`（高さ非固定）を `height/max-height:100dvh` + `overflow:hidden` に変え、aside を nav scroll area + fixed footer area の 2 段 flex に分割する。CSS のみのため server/client で同一描画になり hydration mismatch を回避できる。
- **L-SFPP-004**: collapsed sidebar のはみ出しは `overflow:hidden` + `justify-center` + badge を dot 化（`data-shell-block="nav-badge-dot"`）で吸収し、DOM 観測属性は既存契約を壊さない **additive** な追加に留める。
- **L-SFPP-005**: `indexes/{quick-reference,resource-map,topic-map}.md` と `keywords.json` は `generate-index.js` が `references/*.md` から再生成する **生成物**。手動編集ではなく `references/` に inventory を置いて `pnpm indexes:rebuild` で同期させるのが正本経路（CI `verify-indexes-up-to-date` gate が drift を fail にする）。
