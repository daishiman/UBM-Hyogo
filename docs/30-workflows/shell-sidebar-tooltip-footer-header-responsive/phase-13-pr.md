---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 13
phase_name: commit-pr-release
created_at: 2026-06-03
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 13: PR

> **本 Phase は計画（draft）。commit / push / `gh pr create` は user の明示承認後のみ実行する（CONST_002・user-gated）。本 spec では実行しない。**

- base ブランチ: `dev`
- branch: `feat/shell-sidebar-tooltip-footer-header-responsive`

## 13.1 含めるファイル一覧（local implementation cycleで生成後に commit）

### 新規（2）

```
apps/web/src/components/shell/SidebarTooltip.tsx
apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx
```

### 編集（コード 6 / テスト 5 / CSS 2）

```
apps/web/src/components/shell/SidebarNavItem.tsx
apps/web/src/components/shell/SidebarUserMenu.tsx
apps/web/src/components/shell/SidebarCollapseToggle.tsx
apps/web/src/components/shell/SidebarShell.tsx
apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx
apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx
apps/web/src/styles/globals.css
apps/web/src/styles/legacy-public.css
```

### workflow ドキュメント

```
docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
```

### Playwright visual spec（Phase 11 計画分・local implementation cycleで追加）

```
apps/web/playwright/tests/visual-staging-authenticated/admin-shell-collapsed-tooltip-authenticated.spec.ts
apps/web/playwright/tests/visual-staging/public-footer-sticky-bottom.spec.ts
apps/web/playwright/tests/visual-staging/mobile-header-sticky.spec.ts
```

## 13.2 commit message ドラフト

```
feat(shell): collapsed サイドバーツールチップ + 公開フッター sticky bottom + モバイルヘッダー sticky top

- add SidebarTooltip (CSS-driven role=tooltip + aria-describedby) wrapping collapsed icon-only controls
- wire nav item / AdminPublicReturn / collapse toggle に SidebarTooltip / user menu は <summary> 内 inline bubble（同 CSS class 流用）
- tooltip CSS を globals.css の shell セクションへ 1 source 追加（色/影/角丸は tokens.css 経由・HEX 0）
- public-footer を position: sticky; bottom: 0 + 不透明 surface-bg 背景でスクロール中常時表示（legacy-public.css）
- mobile-bar に sticky top-0 z-30 を付与しモバイルでスクロール中もヘッダー固定（md:hidden は不変）
- z-index 階層: drawer 40 > tooltip 30 = mobile-bar 30 > footer 20
- adds SidebarTooltip.spec + SidebarNavItem/SidebarShell/SidebarCollapseToggle spec 更新

Refs: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
```

## 13.3 PR タイトル / 本文ドラフト

- **title**: `feat(shell): collapsed ツールチップ + 公開フッター sticky + モバイルヘッダー sticky`
- **base**: `dev`
- **body 必須項目**:
  - **Summary**: shell の 3 UX 改善。(A) collapsed サイドバーの icon-only コントロールにホバー / フォーカスでラベルツールチップ表示、(B) 公開フッターを画面下端 sticky 固定で常時表示、(C) モバイルヘッダー（mobile-bar）を上端 sticky 固定。state owner は既存 `useSidebarState` 1 系のまま、ツールチップは CSS `:hover`/`:focus-within` 駆動で新規 JS state 無し。
  - **Scope**:
    - 新規: `SidebarTooltip.tsx` + `__tests__/SidebarTooltip.spec.tsx`
    - 編集: `SidebarNavItem.tsx` / `SidebarUserMenu.tsx` / `SidebarCollapseToggle.tsx` / `SidebarShell.tsx` / `globals.css` / `legacy-public.css` + spec 3 件
  - **Out of scope**: 汎用 Tooltip primitive 化（`ui/`）/ フッターの会員・管理レイアウト適用 / タッチ hover 対応（Phase 1.6・Phase 10.5 M-1/M-2/M-3）
  - **AC checklist**: AC-A1..A6 / B1..B3 / C1..C3 全 check
  - **CI gate**: typecheck green / lint green / verify-design-tokens green（HEX 0）/ focused vitest green（`@ubm-hyogo/web`）/ apps/api 差分 0
  - **Screenshots**: `outputs/phase-11/` の canonical 3 枚（`sidebar-collapsed-tooltip.png` / `public-footer-sticky-bottom.png` / `mobile-header-sticky.png`）。staging visual baseline は user-gated 実行後に添付
  - **Refs**: workflow `shell-sidebar-tooltip-footer-header-responsive` / 前提 commit `41292e38a`（C1-C4）

## 13.4 pre-flight（PR 作成前・local implementation cycleで実行）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh   # docs-only gate の pre-flight（phase12-compliance / gate-metadata / indexes drift 一括検証）
```

加えて Phase 9 の grep ゲート（HEX 0 / apps/api 差分 0 / `.test.tsx` 不在 / mobile-bar class）を確認する。

## 13.5 user-gated 操作

| 操作 | 実行可否 |
|------|---------|
| local commit | user 明示承認後 |
| push | user 明示承認後 |
| `gh pr create --base dev` | user 明示承認後 |
| staging deploy / Playwright visual baseline 取得（canonical 3 枚） | user 明示承認後 |
| screenshot 取得（実画面） | staging visual user gate |

## 13.6 DoD（Definition of Done）

AC:

- [ ] AC-A1 collapsed で nav item ホバー/フォーカスにツールチップ（`role="tooltip"`）
- [ ] AC-A2 expanded はツールチップ非描画
- [ ] AC-A3 tooltip が一意 id + trigger に `aria-describedby`
- [ ] AC-A4 tooltip の色/影/角丸が token 経由（HEX 0）
- [ ] AC-A5 AdminPublicReturn / UserMenu / CollapseToggle も collapsed で tooltip
- [ ] AC-A6 既存アクセシブル名を壊さず二重読み上げにならない
- [ ] AC-B1 フッターが viewport 下端 sticky・スクロール中常時表示
- [ ] AC-B2 フッター背景が不透明（surface-bg）
- [ ] AC-B3 フッターの色が token 経由
- [ ] AC-C1 mobile-bar が `sticky top-0` 固定・スクロール中表示
- [ ] AC-C2 mobile-bar の z-index が `z-30`
- [ ] AC-C3 `md` 以上で mobile-bar は hidden（回帰なし）

ゲート:

- [ ] typecheck / lint / verify-design-tokens green（HEX 直書き 0）
- [ ] focused vitest green（SidebarTooltip / SidebarNavItem / SidebarShell / SidebarCollapseToggle）
- [ ] `apps/api` 差分 0（I-1）
- [ ] canonical screenshot 3 枚が `outputs/phase-11/` に present
- [ ] PR が `dev` を base に作成済

## 13.7 evidence

`outputs/phase-13/pr-creation-result.md` に以下を記録（実装 / PR サイクルで生成）:

- PR URL
- base SHA（`dev` 取り込み先 commit）
- CI gate 一覧と最終 status（typecheck / lint / verify-design-tokens / vitest）
- 実施日時 / 実施者
