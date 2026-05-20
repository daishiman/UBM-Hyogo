# Phase 2: アーキテクチャ設計 / モジュール配置 / データフロー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 区分 | 設計 |
| 想定所要 | 0.25 人日 |

## 目的

Phase 1 SSOT を前提に、SVG bar chart 描画ロジックの物理配置とデータフローを確定する。新規 helper は **同一ディレクトリ内に閉じる**（cross-feature 依存を増やさない）。

## モジュール配置

```
apps/web/src/
├── features/admin/components/_dashboard/
│   ├── StatusDistribution.tsx         (改修: chart + fallback)
│   └── StatusDistribution.spec.tsx    (新規: 単体テスト)
├── lib/admin/
│   └── admin-dashboard-ui.ts          (loose byStatus parse: shared schema 拡張後も invalid status を drop)
└── styles/
    └── tokens.css                      (変更なし: OKLch token を流用)
```

### 配置判断

- **StatusDistribution.tsx 単一ファイル内に SVG render 関数を内包する**:
  - 理由 (1): SVG bar 描画は本 component 固有で、他 chart には再利用しない（KpiCard / ZoneDistribution は別目的）。
  - 理由 (2): file 分割は将来 chart library 導入時の refactor で行う（YAGNI）。
  - 例外: bar 計算ロジックのみは内部 helper 関数 `computeBarLayout(slices)` として切り出し、純関数化することで単体テスト容易性を担保する。

## データフロー

```
GET /api/admin/dashboard (apps/api)
        │
        ▼ ({ kpi, byStatus?, byZone?, ... })
apps/web/src/lib/admin/admin-dashboard-ui.ts
        │  toAdminDashboardUi(raw)
        ▼ ({ slices: ReadonlyArray<StatusSlice> | undefined })
apps/web/src/app/(admin)/admin/page.tsx
        │
        ▼ <StatusDistribution slices={ui.byStatus} />
apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx
        │
        ├─ slices == empty → placeholder
        └─ slices populated → SVG bar chart + chip list
```

### 改修方針

- `toAdminDashboardUi()` は optional `byStatus` を `StatusSlice[]` として吸収し、API が `byStatus` を返さない legacy response では `slices === undefined` で fallback に倒れる。
- API 側で `byStatus` を同一 `/admin/dashboard` response に追加し、`public` / `member_only` / `hidden` の3分類を返す。

## 状態管理

- `StatusDistribution` は **pure presentational component**（state 持たない）。
- hover tooltip は CSS `:hover` + `<title>` 要素で済ませ、React state を増やさない。
- responsive は SVG `viewBox` + CSS で吸収（`window resize` listener 不要）。

## 影響範囲

| 項目 | 影響 |
| --- | --- |
| `apps/api` | なし |
| D1 schema | なし |
| 既存 caller の signature | なし（props 不変） |
| 既存 visual snapshot | あり（chart 表示追加で snapshot 更新が必要） |

## 実行タスク

- Phase 2: component 内 helper、データフロー、状態管理なしの配置方針を確定する。

## 参照資料

- - `phase-01.md`
- - `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md`
- - `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`
- - `apps/web/src/lib/admin/admin-dashboard-ui.ts`
- - `apps/api/src/routes/admin/dashboard.ts`
- - `apps/api/src/repository/dashboard.ts`
- - `packages/shared/src/zod/viewmodel.ts`

## 成果物

- - module placement と data flow を `phase-02.md` に記録する。

## 統合テスト連携

- - Phase 11 で component render test に接続する。

## 完了条件

- [ ] モジュール配置 / データフロー / 状態管理方針が確定している
- [ ] Phase 3 で詳細設計（型 / 関数 / SVG markup）に進める状態である
