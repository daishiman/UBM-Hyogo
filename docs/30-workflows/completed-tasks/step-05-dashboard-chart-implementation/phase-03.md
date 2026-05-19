# Phase 3: 詳細設計 / 型 / 関数シグネチャ / SVG markup 契約

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 区分 | 設計 |
| 想定所要 | 0.5 人日 |

## 目的

Phase 5 実装が同一契約に収束するように、型・関数・SVG markup・aria 属性・token 引当を契約として確定する。

## 1. 型定義（変更なし、参照のみ）

`apps/web/src/lib/admin/admin-dashboard-ui.ts` から既存 export を利用する。

```typescript
export interface StatusSlice {
  readonly status: "public" | "member_only" | "hidden";
  readonly count: number;
}
```

## 2. 関数シグネチャ

### 2.1 公開 component

```typescript
export interface StatusDistributionProps {
  readonly slices: ReadonlyArray<StatusSlice> | undefined;
}

export function StatusDistribution(props: StatusDistributionProps): JSX.Element;
```

### 2.2 内部 helper（同一ファイル内 named export せず、`__test__` で `export` する形は取らない）

```typescript
interface BarLayout {
  readonly status: StatusSlice["status"];
  readonly count: number;
  readonly label: string;       // "公開" | "会員限定" | "非公開"
  readonly colorVar: string;    // "var(--ubm-color-ok)" 等
  readonly x: number;           // bar 左端 x 座標 (SVG 単位)
  readonly y: number;           // bar 上端 y 座標
  readonly width: number;       // bar 幅
  readonly height: number;      // bar 高さ
}

function computeBarLayout(
  slices: ReadonlyArray<StatusSlice>,
  viewport: { width: number; height: number; padding: number }
): ReadonlyArray<BarLayout>;
```

- **入力**: 描画対象の `slices`（最大 3 要素を想定。順序は `public, member_only, hidden` で正規化）。
- **出力**: 各 bar の座標 / サイズ / 色 var / ラベルを含む配列。
- **副作用**: なし（純関数）。
- **エラー**: `slices.length === 0` のとき空配列を返す（caller 側で fallback 分岐）。

### 2.3 aria-label 生成

```typescript
function buildAriaLabel(slices: ReadonlyArray<StatusSlice>): string;
// 例: "公開ステータス分布: 公開 12, 会員限定 8, 非公開 3"
```

## 3. SVG markup 契約

```html
<svg
  role="img"
  aria-label="公開ステータス分布: ..."
  viewBox="0 0 600 200"
  preserveAspectRatio="xMidYMid meet"
  class="w-full max-w-[600px] h-auto"
  data-testid="status-distribution-chart"
>
  <!-- 各 bar -->
  <g data-testid="status-bar" data-status="public">
    <rect x={x} y={y} width={width} height={height} fill="var(--ubm-color-ok)" rx="4">
      <title>公開: 12</title>
    </rect>
    <text x={x + width/2} y={y - 6} text-anchor="middle"
          class="fill-[var(--ubm-color-text-primary)] text-xs tabular-nums">
      12
    </text>
    <text x={x + width/2} y={195} text-anchor="middle"
          class="fill-[var(--ubm-color-text-muted)] text-xs">
      公開
    </text>
  </g>
  <!-- member_only, hidden についても同パターン -->
</svg>
```

### 配色 mapping

| status | label (ja) | fill |
| --- | --- | --- |
| `public` | 公開 | `var(--ubm-color-ok)` |
| `member_only` | 会員限定 | `var(--ubm-color-info)` |
| `hidden` | 非公開 | `var(--ubm-color-warn)` |

### レイアウト定数

| 定数 | 値 | 備考 |
| --- | --- | --- |
| viewport.width | 600 | viewBox 幅 |
| viewport.height | 200 | viewBox 高さ |
| chartArea.top | 20 | bar 上端 padding |
| chartArea.bottom | 30 | x 軸 label 領域 |
| chartArea.left | 20 | bar 左端 padding |
| chartArea.right | 20 | bar 右端 padding |
| barGap | 24 | bar 間隔 |
| barWidth | `(560 - 2*24) / 3 = 170` | 3 bar 想定で算出 |

### 高さ計算

```
chartHeight = viewport.height - chartArea.top - chartArea.bottom = 150
maxCount = Math.max(...slices.map(s => s.count), 1)  // 0 除算回避
bar.height = (count / maxCount) * chartHeight
bar.y = chartArea.top + (chartHeight - bar.height)
```

## 4. component 構造

```typescript
export function StatusDistribution({ slices }: StatusDistributionProps) {
  if (!slices || slices.length === 0) {
    return <PlaceholderSection />;  // 既存 placeholder 維持
  }

  const layout = computeBarLayout(slices, VIEWPORT);
  const aria = buildAriaLabel(slices);

  return (
    <section className="ui-card ...">
      <h2>公開ステータス</h2>
      <svg role="img" aria-label={aria} viewBox="0 0 600 200" ...>
        {layout.map(bar => <Bar key={bar.status} {...bar} />)}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-2">
        {/* 既存 chip list を chart 下の補助表示として継続 */}
      </ul>
    </section>
  );
}
```

## 5. token 引当監査

| 項目 | 値 | 出典 |
| --- | --- | --- |
| ok | `oklch(0.55 0.10 155)` | `apps/web/src/styles/tokens.css` |
| info | `oklch(0.55 0.09 230)` | 同上 |
| warn | `oklch(0.62 0.12 75)` | 同上 |
| text-primary | `var(--ubm-color-text-primary)` | 同上 |
| text-muted | `var(--ubm-color-text-muted)` | 同上 |

HEX 直書きおよび `bg-[#xxx]` 形式は禁止（`verify-design-tokens` CI gate）。Tailwind の `fill-[var(--…)]` は許容。

## 実行タスク

- Phase 3: 型、SVG markup、aria、token 引当を実装可能な契約に落とす。

## 参照資料

- - `phase-01.md`
- - `phase-02.md`
- - `apps/web/src/styles/tokens.css`

## 成果物

- - `phase-03.md` に関数 signature と SVG 契約を記録する。

## 統合テスト連携

- - Phase 11 の a11y / token grep gate に接続する。

## 完了条件

- [ ] 型 / 関数シグネチャ / SVG markup / a11y / token が確定している
- [ ] Phase 4 でテストケースに 1:1 マップできる粒度である

## 依存Phase trace

- Phase 1 / phase-01.md
- Phase 2 / phase-02.md
