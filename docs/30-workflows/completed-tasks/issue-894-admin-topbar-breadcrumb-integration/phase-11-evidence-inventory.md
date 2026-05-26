# Phase 11: Evidence Inventory

## 1. Overview

本タスクは admin breadcrumb の表示責務を変える UI 実装であり、spec assertion / grep 結果 / typecheck・lint ログに加えて Playwright screenshot を evidence として採用する。

## 2. visualEvidence 宣言

```yaml
visualEvidence: VISUAL
taskType: implementation
rationale: |
  breadcrumb の表示位置・粒度が変わるため、authenticated admin runtime screenshot を取得する。
  token / class は既存 primitive を再利用し、DOM/a11y contract は spec で固定する。
```

## 3. Evidence 表

| Evidence | 種類 | 取得方法 | 期待値 | 保管先（実装後） |
|----------|------|----------|--------|------------------|
| layout.spec.tsx 新規 assertion pass | spec | `vitest run "app/(admin)/layout.spec.tsx"` | slot 内 breadcrumb primitive 検出 + 既存 data-* pass | vitest 出力 |
| Breadcrumb.spec.tsx regression pass | spec | `vitest run "src/components/admin/Breadcrumb.spec.tsx"` | 既存 contract + final item current span case が pass | vitest 出力 |
| 「管理」ラベル grep 0 件 | grep | `grep -rn 'label: "管理"' "apps/web/app/(admin)/admin/"` | 0 hit | 標準出力 |
| `"use client"` 不在 | grep | `head -1 "apps/web/app/(admin)/layout.tsx"` | `"use client"` でない | 標準出力 |
| HEX 直書き 0 件 | grep | Phase 10 §3.3 のコマンド | 0 hit | 標準出力 |
| typecheck pass | command | `pnpm typecheck` | 0 error | 標準出力 |
| lint pass | command | `pnpm lint` | 0 warning | 標準出力 |
| axe critical 0 | spec | layout.spec.tsx 内 axe assertion | critical 0 | vitest 出力 |
| admin dashboard screenshot | Playwright | authenticated admin fixture で `/admin` を撮影 | topbar slot に Breadcrumb primitive + current label「管理」、href link なし | `outputs/phase-11/screenshots/admin-dashboard-breadcrumb-desktop.png` |

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| phase 11 main | outputs/phase-11/main.md | present |
| layout vitest | outputs/phase-11/evidence/layout-vitest.log | present |
| breadcrumb vitest | outputs/phase-11/evidence/breadcrumb-vitest.log | present |
| grep gates | outputs/phase-11/evidence/grep-gates.log | present |
| typecheck | outputs/phase-11/evidence/typecheck.log | present |
| lint | outputs/phase-11/evidence/lint.log | present |
| admin screenshot | outputs/phase-11/screenshots/admin-dashboard-breadcrumb-desktop.png | present |

## 5. screenshot 取得根拠

- 既存 visual regression（playwright-smoke）は `/admin` / `/admin/members` の topbar / page header 領域を baseline として保持しているが、本タスクは:
  - topbar slot の中身を **空文字「管理」テキスト** から **Breadcrumb primitive 経由の current label「管理」** に変える（textContent 同一、link 化なし）
  - AdminPageHeader の breadcrumb 配列を 2 件 → 1 件にする（描画される文字列が短くなる）
- 視覚的差分は仕様上の意図だが、UI/UX 変更であるため `/admin` の runtime screenshot を保存する。pixel-perfect baseline 更新は本タスクでは行わず、DOM contract と screenshot evidence で確認する。

## 6. 代替 evidence の十分性

- DOM 階層（data-* 契約）は spec で完全カバー
- a11y は axe + `aria-current` 契約で担保
- 仕様準拠は grep で機械的に検証可能
- 後続レビュアーが再現可能な検証コマンドを Phase 10 に集約済み
