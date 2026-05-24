---
phase: 6
title: Test strategy — 単体 / integration / a11y
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 6 — Test strategy

[実装区分: 実装仕様書]

## 1. 単体テスト（primitive 単体 / 新規）

`apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx`（Phase 5 §4 にスケルトン）。検証ケース:

| ケース | assert |
| --- | --- |
| 既定描画 | `header[data-shell="topbar"]` が存在する |
| 既定 breadcrumb | `[data-component="admin-breadcrumb-slot"]` の textContent に「管理」 |
| 既定 actions | `[data-component="admin-topbar-actions"]` が `aria-hidden="true"` かつ空 |
| breadcrumb 注入 | props 値が slot に反映される |
| actions 注入 | props 値が反映され `aria-hidden` が外れる |
| token class | header className に `border-[var(--ubm-color-border-default)]` |
| a11y | axe critical violation 0 |

## 2. integration テスト（既存 layout / 無修正で pass）

`apps/web/app/(admin)/layout.spec.tsx` を**変更せず** pass させる。既存 assert:
- 未認証 → `/login?next=/admin` redirect
- non-admin → `/login?gate=forbidden` redirect
- admin session → wrapper に `data-theme="cool"` / `data-route-group="admin"` / `data-testid="admin-shell"`、`data-shell="sidebar"`、**`data-shell="topbar"`**、`main[data-route="admin"]` が存在
- admin render で axe critical 0

primitive 抽出後も `data-shell="topbar"` が DOM に出るため、この spec は無修正で通る（regression gate）。

## 3. a11y

- primitive spec 内 axe（`color-contrast` / `region` / `landmark-one-main` は helper 側で disable 済み）。
- actions 既定 placeholder は `aria-hidden="true"` で支援技術から隠す。実 actions 注入時は読み上げ対象。
- axe helper（`apps/web/src/test/axe.ts`）が利用不可な環境では role / attribute 検証で代替（`getByRole` / `getAttribute`）。

## 4. テスト suffix 規約

- `*.spec.tsx` のみ（CLAUDE.md 不変条件8 / lefthook `block-test-suffix`）。`*.test.tsx` 禁止。

## 5. 検証コマンド

```bash
mise exec -- pnpm exec vitest run apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx
mise exec -- pnpm exec vitest run "apps/web/app/(admin)/layout.spec.tsx"
```

## 6. visual regression の扱い

本タスクは inline JSX → primitive の**リファクタで visual delta なし**。新規 screenshot baseline は取得しない。admin dashboard の visual 非回帰は既存の full-visual baseline（`apps/web/playwright/tests/visual-full/full-visual.spec.ts` の `admin` route × 3 viewport）が担保する。実装後に visual-full が green であることを確認すれば十分（新規 baseline コミット不要）。
