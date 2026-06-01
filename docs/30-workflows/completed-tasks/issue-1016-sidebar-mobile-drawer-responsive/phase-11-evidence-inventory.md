# Phase 11 — Evidence Inventory（VISUAL）

## 0. screenshot_mode

`VISUAL`（375 / 768 / 1280 px の mobile drawer / tablet collapsed / desktop expanded の 3 viewport 4 状態に新 UI 追加）。

Current status: `implemented_local_runtime_pending / focused Vitest present / local screenshot present / staging visual pending`。コード実装、focused Vitest、local screenshot は完了。**staging runtime PASS は主張しない。**

> 本 inventory の screenshot canonical 名・viewport・期待状態は `outputs/phase-11/manual-test-result.md` と完全一致させる。

## 1. screenshot 計画（canonical 4 枚）

| # | Path | viewport | Status | Evidence type | 期待状態 | AC |
|---|------|----------|--------|---------------|---------|----|
| 1 | `outputs/phase-11/screenshots/shell-drawer-mobile-closed.png` | 375px | present | local screenshot（visual-harness） | hamburger 表示・sidebar hidden・drawer 非表示 | AC-2 |
| 2 | `outputs/phase-11/screenshots/shell-drawer-mobile-open.png` | 375px | present | local screenshot（visual-harness） | drawer overlay（`role="dialog"` `aria-modal="true"` `id="shell-drawer"`）+ backdrop | AC-1 / AC-3 / AC-6 |
| 3 | `outputs/phase-11/screenshots/shell-sidebar-tablet-collapsed.png` | 768px | present | local screenshot（visual-harness） | sidebar visible・初期 collapsed・hamburger hidden | AC-8 |
| 4 | `outputs/phase-11/screenshots/shell-sidebar-desktop-expanded.png` | 1280px | present | local screenshot（visual-harness） | sidebar visible・expanded（localStorage 優先） | AC-8 |

## 2. focused vitest 実行計画（4 ファイル）

| # | spec ファイル | 検証 AC | Status |
|---|--------------|---------|--------|
| 1 | `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx` | AC-1 / AC-2（click→setDrawerOpen(true) / `md:hidden` / aria） | present |
| 2 | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | AC-3 / AC-4 / AC-6 / AC-7（dialog 表示 / Esc / backdrop / scroll lock / focus） | present |
| 3 | `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx`（拡張） | AC-5 / AC-8（route-close / md 初期 collapsed・`next/navigation` mock） | present |
| 4 | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx`（既存回帰） | shell mount / nav regression / trigger strip regression | present |

実行コマンド（実測 PASS）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx \
  src/components/shell/__tests__/SidebarDrawer.spec.tsx \
  src/components/shell/__tests__/useSidebarState.spec.tsx \
  src/components/shell/__tests__/SidebarShell.spec.tsx
```

Evidence log: `outputs/phase-11/evidence/focused-vitest.log`（4 files / 21 tests PASS）。

## 3. capture 手順（375 / 768 / 1280px）

Playwright `page.setViewportSize` で dev-only `visual-harness/sidebar-shell` を開き、実コンポーネントを local capture した。staging runtime capture は user-gated。

```
1. `/visual-harness/sidebar-shell` で shell を描画
2. viewport を順に設定:
   - 375px  → #1（drawer closed）→ hamburger クリック → #2（drawer open）
   - 768px  → #3（初期 collapsed・hamburger hidden）
   - 1280px → #4（expanded）
3. 各 viewport で PNG を outputs/phase-11/screenshots/ へ canonical 名で保存
4. metadata は outputs/phase-11/metadata.json に { viewport, state, filename, capturedAt }
```

### browser / server クローズ（FB-MSO-003）

capture スクリプトは `try { ... } finally { await browser.close(); await server?.close(); }` 形式で、例外時も browser / server を必ず close する。リーク防止。

```ts
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  // ... setViewportSize / setContent / screenshot ...
} finally {
  await browser.close();
}
```

## 4. fixture / preconditions

| screenshot | precondition |
|-----------|--------------|
| #1 / #2（375px） | localStorage 未設定。drawer state は context 既定（closed）。#2 は trigger click 後 |
| #3（768px） | localStorage 未設定 → md 初期 collapsed が効くこと（AC-8） |
| #4（1280px） | localStorage 未設定 → lg expanded。`collapsed=true` 値があれば collapsed 優先も別カットで確認可（任意） |

## 5. 既知制限

- local screenshot は取得済み。staging runtime visual は user-gated。
- local screenshot と staging runtime visual を混同しない。

## 完了条件

- [x] canonical screenshot 4 枚（名 / viewport / 期待状態）を保存し manual-test-result.md と一致
- [x] screenshot は全件 `present` と明記
- [x] focused vitest 4 ファイルの実行結果を明示
- [ ] capture 手順（375/768/1280px）+ `try/finally` での browser/server close（FB-MSO-003）を明示
- [x] staging runtime PASS を主張しない
