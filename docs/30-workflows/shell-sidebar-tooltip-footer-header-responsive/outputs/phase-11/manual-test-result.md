---
phase: 11
phase_name: 手動テスト / Evidence
task: shell-sidebar-tooltip-footer-header-responsive
captured_at: 2026-06-03
visual_category: VISUAL
evidence_status: present
screenshot_status: local_present_staging_pending
---

# Phase 11: 手動テスト / Evidence 結果（VISUAL）

> 本タスクは **VISUAL**。local semantic evidence と local browser screenshot 3 名は取得済み。staging visual screenshot は user gate で取得するため、現時点は `screenshot_status: local_present_staging_pending`。staging screenshot の捏造はしない。

## 実施サマリ

| 項目 | 結果 |
|------|------|
| 実施日 | 2026-06-03 |
| 実施者 | Codex automation-30 improvement cycle |
| spec 状態 | `implemented_local_evidence_captured` |
| focused vitest（shell 5 spec） | **PASS**（5 files / 33 tests） |
| web typecheck / lint / token gate | **PASS**（`typecheck` / `lint` / `verify-design-tokens`） |
| root token gate | **PASS**（`pnpm verify:tokens`） |
| canonical screenshot 3 名 | **local present**（`outputs/phase-11/*.png`） / staging pending |
| Playwright visual baseline | **pending**（user-gated staging 実行） |

## 1. 検証層と evidence の対応（VISUAL 3 層）

| 層 | evidence | 状態 |
|----|----------|------|
| Semantic（DOM 契約 / a11y） | RTL unit（`SidebarTooltip.spec` 他）で `role="tooltip"` / `aria-describedby` / collapsed 分岐 / mobile-bar class を assert | PASS |
| Visual（実画面） | local browser screenshot 3 名 + Playwright staging visual baseline | local present / staging pending（user-gated） |
| AI UX（体験） | 手動でツールチップ即時表示 / フッター・ヘッダーの常時表示を目視 | local browser pass / staging pending（user-gated） |

## 2. 自動テスト（focused vitest）結果

```bash
pnpm vitest run --passWithNoTests --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx
```

| spec | 結果 | 対応 AC |
|------|------|---------|
| `SidebarTooltip.spec.tsx` | PASS | AC-A1 / A2 / A3 |
| `SidebarNavItem.spec.tsx` | PASS | AC-A1 / A2 / A6 |
| `SidebarShell.spec.tsx` | PASS | AC-A5 / C1 / C2 / C3 |
| `SidebarCollapseToggle.spec.tsx` | PASS | AC-A5 |
| `SidebarUserMenu.spec.tsx` | PASS | AC-A5 |

Lane B（footer sticky）/ Lane C の実 sticky 挙動は jsdom で評価不可。`AC-B1` / `AC-B2` / `AC-C1` の実挙動は visual / 手動で担保する（honest scope）。CSS 宣言と DOM class は local evidence で確認済み。

## 3. canonical screenshot の取得状態

| canonical 名 | レーン | viewport | 状態 | 取得方法 |
|--------------|--------|----------|------|----------|
| `sidebar-collapsed-tooltip.png` | A | 1280 | **local present / staging pending** | local browser で `/admin` collapse state → nav item hover/focus 相当の tooltip DOM/CSS を撮影。staging は user gate |
| `public-footer-sticky-bottom.png` | B | 1280 | **local present / staging pending** | local browser で公開 route をスクロールし、フッター下端固定の状態を撮影。staging は user gate |
| `mobile-header-sticky.png` | C | 375 | **local present / staging pending** | local browser viewport 375 でスクロール後 mobile-bar 上端固定を撮影。staging は user gate |

## 4. 手動確認手順（staging visual user gate）

- レーン A: collapsed で nav item / 公開に戻る / ユーザーメニュー / collapse toggle にホバーまたは focus → ラベルバブル即時表示。expanded で非表示。
- レーン B: 公開ページをスクロール中、フッターが画面下端に固定・背景が不透明。
- レーン C: viewport 375 で本文スクロール後も mobile-bar が上端固定・768px 以上で hidden。

## 5. Gate-B 状態

- 新規 / 編集 spec green: **PASS**。
- canonical screenshot 3 枚 present: **local present** / staging pending。
- 手動確認 pass 記録: **local browser pass** / staging pending。

→ `evidence_status: present` / `screenshot_status: local_present_staging_pending`。Gate-B は local semantic + local browser visual まで PASS、staging visual evidence は user-gated boundary として残す。
