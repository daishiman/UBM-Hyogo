---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 9
phase_name: QA / CI gate
created_at: 2026-06-03
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 9: QA / CI gate

## 9.1 必須 green ゲート

実コマンドは `apps/web/package.json`（`@ubm-hyogo/web`）と root `package.json` を正本とする。

| gate | コマンド | 期待 |
|------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | green |
| lint | `mise exec -- pnpm lint` | green（`@ubm-hyogo/web` の `lint` は `tsc --noEmit` + `eslint 'src/**/*.{ts,tsx}'`） |
| focused vitest (SidebarTooltip) | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarTooltip` | green（AC-A1〜A3 / A6 の DOM 契約） |
| focused vitest (SidebarNavItem) | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarNavItem` | green（collapsed tooltip 配線 / expanded 非ラップ） |
| focused vitest (SidebarShell) | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarShell` | green（mobile-bar `sticky top-0 z-30` / AdminPublicReturn tooltip 化） |
| focused vitest (SidebarCollapseToggle) | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarCollapseToggle` | green（collapsed tooltip ラップ） |
| verify:tokens（HEX 0 / color token 検査） | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens`（= `tokens.runtime.spec.ts`）<br>+ root `mise exec -- pnpm verify:tokens`（`scripts/verify-design-tokens.ts`） | green（tooltip 背景 / フッター背景が token 経由・HEX 0 件・AC-A4 / B3） |
| verify-design-tokens（CI gate） | CI workflow `verify-design-tokens`（task-18 導入済） | green（新規 CSS / class の色が全て `var(--ubm-color-*)`） |
| coverage threshold | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | threshold drop なし（Phase 7） |

> `lint` 内に `tsc --noEmit` が含まれるため typecheck と二重だが、CLAUDE.md / 既存 package.json の定義を踏襲して両方記載する。

## 9.2 不変条件 / 回帰の grep ゲート

```bash
# AC-A4 / B3 / I-2: 新規 CSS・class に HEX / palette 直値が無い
grep -rnE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/globals.css | grep -iE 'tooltip'
# 期待: 出力なし（tooltip 系の色は全て var(--ubm-color-*)）
grep -nE '(bg|text|border)-\[#' apps/web/src/components/shell/SidebarShell.tsx
# 期待: 出力なし

# AC-B2: フッター背景が不透明 token
grep -nE 'background:\s*var\(--ubm-color-surface-bg\)' apps/web/src/styles/legacy-public.css
# 期待: [data-component="public-footer"] ブロックに 1 件

# AC-C2 / C3: mobile-bar の z-30 と md:hidden 維持
grep -nE 'data-shell="mobile-bar"' apps/web/src/components/shell/SidebarShell.tsx
# 期待: className に sticky / top-0 / z-30 / md:hidden が全て含まれる

# I-4: tooltip が新規 JS state を持たない（CSS :hover/:focus-within 駆動）
grep -nE 'useState' apps/web/src/components/shell/SidebarTooltip.tsx
# 期待: 出力なし（state は持たない・useId のみ）

# I-3: 汎用 primitive を増やしていない
grep -rn 'Tooltip' apps/web/src/components/ui/
# 期待: 出力なし（tooltip は shell 配下のみ）
```

## 9.3 `apps/api` 差分 0 の確認

```bash
git diff --name-only dev...HEAD | grep -E '^apps/api/'
# 期待: 出力なし（本タスクは純 apps/web UI・I-1）
```

D1 migration / Google Form schema / auth middleware にも変更が無いことを併せて確認する（変更 file は `apps/web/src/components/shell/**` + `apps/web/src/styles/{globals,legacy-public}.css` に閉じる）。

## 9.4 test suffix ゲート（lefthook 整合）

- 新規 test は `SidebarTooltip.spec.tsx` のみ（`.spec.tsx`）。`.test.tsx` は作らない（CLAUDE.md 不変条件 #8）。
- lefthook `block-test-suffix` / CI `verify-test-suffix` が `*.test.{ts,tsx}` を reject する。本タスクの新規 / 編集 test は全て `*.spec.tsx` で整合。

```bash
git diff --name-only dev...HEAD | grep -E '\.test\.(ts|tsx)$'
# 期待: 出力なし
```

## 9.5 失敗時の対処

- typecheck fail: `SidebarTooltipProps`（`label` / `collapsed` / `children: ReactElement`）と `cloneElement` の型整合を確認。`children.props["aria-describedby"]` アクセスは型 narrowing が必要。
- verify:tokens fail: tooltip / フッター背景の HEX 残存を `grep -nE '#[0-9a-fA-F]{3,8}'` で特定し `var(--ubm-color-*)` へ置換。z-index / opacity / space は色でないため対象外。
- vitest fail: `SidebarTooltip` の collapsed 分岐で `role="tooltip"` が拾えない場合、collapsed prop の伝播と `cloneElement` の `aria-describedby` 注入位置を確認。expanded で tooltip が残る場合はパススルー return（`collapsed===false → return children`）を確認。
- coverage fail: Phase 7.6 の不足 branch（describedby 既存有無 / external・internal nav 経路 / user menu viewer・auth）を補う。

## 9.6 ゲート判定

全 gate green → Phase 10（最終レビュー）へ。fail → Phase 5 / 6 / 8 へ戻る。

> local semantic gate は focused shell Vitest 5 files / 33 tests PASS。typecheck / lint / token gate と staging visual screenshot は最終検証で確認し、staging 実画面証跡は user gate で取得する。
