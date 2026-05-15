# step-05-dashboard-chart 実装仕様書

**[実装区分: 実装仕様書 (data visualization)]**
**[直列順序: 5/5 | 前提: step-01..04 complete (optional)]**

## 1. 目的

admin ダッシュボードの StatusDistribution component を改善し、`toAdminDashboardUi()` から `byStatus` データが得られた場合、chart 描画する。dependencies に chart library がなければ SVG 直書きで簡易実装。

**API 状態確認済 (2026-05-15)**: `apps/api/src/routes/admin/dashboard.ts` の response に **`byStatus` field は未実装**。本 spec は以下 2 段階で進める。
1. **Phase 5a (frontend)**: StatusDistribution.tsx に SVG chart logic を実装。`byStatus` props が `undefined / null / empty` の場合は既存 chip list を fallback として描画（後方互換維持）。
2. **Phase 5b (backend, scope 外)**: API 側に `byStatus: Array<{status, count}>` field 追加。本 improvements workflow では実施せず、別タスク化。frontend 側は 5a で受け皿だけ準備。

## 2. スコープ

- **変更対象**: `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`
- **新規実装**: chart rendering logic (SVG または library)
- **API**: `GET /api/admin/dashboard` (既に実装、byStatus 拡張を期待)
- **UI パターン**: status slice data → bar chart or donut chart

## 3. 変更対象ファイル一覧

```
apps/web/src/features/admin/components/_dashboard/
  ├── StatusDistribution.tsx (改善: chart logic 追加)
  └── (optional) StatusChart.tsx (新規, if extracted)

apps/web/src/lib/admin/
  ├── admin-dashboard-ui.ts (既存、byStatus parse logic)
```

## 4. 設計

### 4.1 StatusDistribution component (改善)

**現在の実装**: chip list で status count を表示

**改善内容**:
1. `slices` が undefined または empty → placeholder表示 (現状)
2. `slices` に data → chart 描画 + chip list (optional)

**Props** (変更なし):
```typescript
interface StatusDistributionProps {
  readonly slices: ReadonlyArray<StatusSlice> | undefined;
}

interface StatusSlice {
  readonly status: "public" | "member_only" | "hidden";
  readonly count: number;
}
```

### 4.2 Chart rendering strategy

**条件判定**:
1. dependencies に `recharts` 存在 → recharts bar/donut chart
2. dependencies に `visx` 存在 → visx primitives
3. どちらもない → SVG 直書き（簡易bar chart）

**現在の dependencies**: package.json を確認 → recharts/visx 未発見 → SVG直書き採用

**SVG Bar Chart 仕様**:
- width: 100%, max-width: 600px
- height: 200px
- 3 bars (public, member_only, hidden)
- color mapping:
  - public: `var(--ubm-color-ok)`
  - member_only: `var(--ubm-color-info)`
  - hidden: `var(--ubm-color-warn)`
- tooltip on hover (count表示)
- y-axis: count scale
- x-axis: status labels

**chart library追加不可理由** (CONST_005):
- 新規dependencies追加は別タスク化
- step-05は既存dependencies onlyで実装

## 5. 関数・型シグネチャ

### StatusDistribution (現状継続)
```typescript
export function StatusDistribution({
  slices,
}: StatusDistributionProps): ReactNode;
```

### (optional) BarChart helper
```typescript
function renderBarChart(
  slices: ReadonlyArray<StatusSlice>,
  containerRef?: React.RefObject<HTMLDivElement>
): SVGSVGElement;
```

## 6. 入出力・副作用

### StatusDistribution
- **入力**: slices data (from toAdminDashboardUi)
- **出力**: chart or placeholder HTML
- **副作用**: window resize listener (if responsive SVG)

## 7. テスト方針

### StatusDistribution.spec.tsx
- [✓] slices === undefined → placeholder render
- [✓] slices.length === 0 → placeholder render
- [✓] slices populated → chart render (SVG check)
- [✓] bar heights proportional to counts
- [✓] color classes applied correctly
- [✓] labels render (public/member_only/hidden)
- [✓] tooltip render on hover (if implemented)

### SVG rendering
- [✓] SVG viewBox set correctly
- [✓] rect elements for bars
- [✓] text elements for labels
- [✓] responsive on parent resize (optional)

## 8. ローカル実行コマンド

```bash
# unit test
pnpm test apps/web --run -- StatusDistribution.spec.tsx

# dev server (manual visual check)
pnpm dev
# → http://localhost:3000/admin (login 後)
# → StatusDistribution card 表示
# → chart render or placeholder

# e2e visual
pnpm e2e:visual --project=visual-chromium
```

## 9. DoD

### 実装完了
- [✓] StatusDistribution chart rendering logic
- [✓] SVG or library chart component
- [✓] unit test green
- [✓] placeholder → chart transition smooth

### 品質
- [✓] color token 使用 (HEX 直書きなし)
- [✓] responsive design (mobile, desktop)
- [✓] a11y: SVG role, aria-label
- [✓] JSDoc: chart logic 주석

### 動作確認
- [✓] byStatus data render
- [✓] chart appearance (各status category)
- [✓] smoke test PASS
- [✓] visual test snapshots

## 10. リスク

1. **byStatus API response**: API side で byStatus data をまだ返していない場合、chart は未表示
2. **SVG responsiveness**: viewport width 変更時の re-render handling
3. **library dependency**: 将来 recharts 等を導入する場合の refactor コスト

## 11. 前提

**step-01..04**: 完全に独立 (optional dependency, API data待ち)

## 12. 実装パターン（SVG直書き例）

```typescript
function renderBarChart(slices: ReadonlyArray<StatusSlice>) {
  const maxCount = Math.max(...slices.map(s => s.count));
  const colors = {
    public: "var(--ubm-color-ok)",
    member_only: "var(--ubm-color-info)",
    hidden: "var(--ubm-color-warn)"
  };
  // SVG markup with rect/text elements
  // scale bars proportional to maxCount
}
```

---

**Updated**: 2026-05-15
**Status**: Ready for implementation (SVG-first strategy)
