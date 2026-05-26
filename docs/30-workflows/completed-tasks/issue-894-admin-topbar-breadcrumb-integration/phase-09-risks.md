# Phase 9: Risks & Mitigations

## 1. Overview

本タスクは小規模 UI 配線だが、RSC 境界 / data-* 契約 / 後続規約逸脱の 4 リスクを抱える。

## 2. リスク一覧

### R1: RSC 境界の意図せぬ client 化

- **発生条件**: `(admin)/layout.tsx` で `usePathname` 等 client API を持ち込む / `"use client"` を冒頭に書く
- **影響**: layout 全体が client component 化し、`getSession()` の SSR / token 取り回しが破壊される。Auth 境界 invariant #11 にも抵触し得る
- **対策**:
  - Phase 5 の after コードは props 注入のみで client API を一切使わない
  - Gate-B チェックで `head -1 apps/web/app/(admin)/layout.tsx` が `"use client"` でないことを確認
  - 案 A（動的パンくず集約）採用を不採用とする設計判断を Phase 2 で固定

### R2: data-* 契約の破壊

- **発生条件**: breadcrumb slot の DOM 階層を誤って書き換える / Breadcrumb primitive 内部の `data-component` を改変する
- **影響**: 既存 layout.spec.tsx が fail / E2E 検証フックが破壊される / 他 admin spec が連鎖 fail
- **対策**:
  - AdminTopbar 内部 / Breadcrumb primitive 内部は **触らない**
  - layout.tsx の slot 注入のみで実装
  - Gate-B で既存 6 つの data-* selector が引き続き検出可能であることを spec で確認

### R3: 「管理」ラベル重複検出漏れ

- **発生条件**: AdminPageHeader 利用 page の `breadcrumbs` 配列先頭から `{ label: "管理", href: "/admin" }` を除去し忘れる
- **影響**: AC-3 違反。ユーザー視点で「管理」が画面内 2 箇所に並ぶ
- **対策**:
  - `grep -rn 'label: "管理"' "apps/web/app/(admin)/admin/"` を Gate-B チェックに含める
  - 期待値: 0 件（topbar 静的ラベルは `(admin)/layout.tsx` 側にあるためこの grep には載らない）

### R4: 後続 admin page 追加時の規約逸脱

- **発生条件**: 将来 AdminPageHeader を使う新規 admin page で `breadcrumbs={[{ label: "管理", href: "/admin" }, ...]}` を再導入する
- **影響**: 「管理」二重表示の再発
- **対策**:
  - Phase 12 で task-specification-creator skill の patterns-lessons に「AdminPageHeader の breadcrumbs は現在地のみを渡す（先頭の "管理" は topbar slot 所有）」を追記候補として記載
  - 本 workflow の Phase 2 / Phase 8 を後続タスク仕様書からの参照対象として明示

### R5: a11y duplicate landmark warning

- **発生条件**: topbar の `<nav aria-label="breadcrumb">` と AdminPageHeader 内の `<nav aria-label="breadcrumb">` が同一画面に併存
- **影響**: axe で best-practice warning が出る可能性（critical ではない見込み）
- **対策**:
  - 既定対応は不要（critical 0 が DoD のため）
  - 万一 warning が critical 扱いになれば AdminPageHeader 側の `aria-label` を `"breadcrumb (current page)"` 等へ差別化する予備策をここに明記しておく

## 3. リスク優先度

| ID | 発生確率 | 影響度 | 優先度 |
|----|---------|--------|--------|
| R1 | 低 | 高 | 高 |
| R2 | 低 | 中 | 中 |
| R3 | 中 | 中 | 中 |
| R4 | 中 | 低 | 低 |
| R5 | 低 | 低 | 低 |
