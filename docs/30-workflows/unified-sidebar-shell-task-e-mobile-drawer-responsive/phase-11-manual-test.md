---
spec_classification: implementation_spec
state: spec_created
phase: 11
phase_name: 手動テスト / Evidence
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 11: 手動テスト / Evidence

## 11.1 手動テスト手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

別 terminal でログインし、ブラウザの DevTools responsive モードで viewport を以下 3 段に切り替えて確認する:

1. **375px** (sm / モバイル相当・`<768px`)
2. **768px** (md / タブレット相当・`768-1023px`)
3. **1280px** (lg / デスクトップ相当・`>=1024px`)

各 viewport で SidebarShell を mount する route(`/profile` などの member layout、または `/admin` の admin layout)を開き、下記観点表に沿って挙動を確認する。

## 11.2 確認観点

### 375px (sm / `<768px`)

| 観点 | 期待 |
|------|------|
| aside | `hidden md:flex` により非表示 (AC-E1) |
| hamburger | `md:hidden` により表示 (画面上部 56px 帯) (AC-E1, E11) |
| drawer 表示 | hamburger click で `setDrawerOpen(true)` → drawer が横からスライド表示 (AC-E2) |
| dialog 属性 | drawer が `role="dialog" aria-modal="true"` を持つ (AC-E3) |
| close (Esc) | Esc キーで `onClose` → drawer が閉じる (AC-E4) |
| close (backdrop) | backdrop click で `onClose` → drawer が閉じる (AC-E4) |
| scroll lock | drawer open 時 `body[data-shell-drawer-open="true"]` が付与され背景 scroll が止まる (AC-E5) |
| 初期 focus | drawer 表示時に最初のリンクへ focus が当たる (AC-E6) |
| focus trap | Tab / Shift+Tab が drawer 内で循環し外へ抜けない (AC-E6) |
| link click | drawer 内 link click → drawer が閉じ、かつ遷移する (AC-E7, E8) |
| route 変化 auto-close | route が変わると drawer が自動で閉じる (AC-E7) |

### 768px (md / `768-1023px`)

| 観点 | 期待 |
|------|------|
| aside | 表示。初期状態は collapsed (AC-E9) |
| hamburger | `md:hidden` により非表示 (AC-E1, E11) |
| drawer | unmount され出てこない (AC-E11) |

### 1280px (lg / `>=1024px`)

| 観点 | 期待 |
|------|------|
| aside | 表示。初期状態は expanded (AC-E9) |
| localStorage 優先 | `ubm:shell:collapsed` に保存値がある場合はその値が初期値より優先される (AC-E9) |
| hamburger | `md:hidden` により非表示 (AC-E1, E11) |
| drawer | unmount され出てこない (AC-E11) |
| matchMedia | 初期判定が 1 回のみ実行される (resize で再評価しない) (AC-E10) |

## 11.3 Evidence 配置

screenshot を以下に配置:

```
docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/outputs/phase-11/
├── 01-sm-375-collapsed-sidebar-hidden.png   # 375px: aside 非表示 + hamburger 表示
├── 02-sm-375-drawer-open.png                # 375px: drawer open + 初期 focus
├── 03-md-768-collapsed.png                  # 768px: aside collapsed + hamburger 非表示
└── 04-lg-1280-expanded.png                  # 1280px: aside expanded + hamburger 非表示
```

必要に応じて drawer focus trap / scroll lock 確認の補助 shot を追加してよい(例: `05-sm-375-scroll-lock.png`)。

加えて `manual-test-result.md` に以下を記述:

- 実施日時 / 実施者
- 各 viewport (375px / 768px / 1280px) の確認結果 (pass / fail)
- drawer open/close・scroll lock・focus trap・link click auto-close の個別結果
- focused vitest 実行結果ログの path (新規 2 spec)
- visual baseline 更新は Task F 委譲である旨

## 11.4 visual baseline (Task F 委譲)

Playwright snapshot による responsive visual baseline 取得は Task F(visual baseline smoke)の責務。本タスクの Evidence は手動確認 screenshot + focused vitest 結果に限定する。

## 11.5 Gate-B 通過条件

- 新規 2 spec が green:
  - `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx`
  - `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx`
- screenshot 4 枚(+補助)が `outputs/phase-11/` 配下に存在
- `manual-test-result.md` に 3 viewport (375px / 768px / 1280px) 全 pass を記録

→ local evidence captured。staging authenticated screenshot / visual baseline 更新は Task F・Phase 13 user-gated。

evidence status は enum `present` / `pending` を使用する(`passed` / `pending_user_approval` 等は使わない)。
