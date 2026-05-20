# Phase 5: コア実装 / StatusDistribution.tsx に SVG bar chart を統合

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 区分 | 実装 |
| 想定所要 | 0.5 人日 |

## 目的

Phase 3 契約と Phase 4 テストを満たすように、`StatusDistribution.tsx` を改修する。後方互換 (`slices` empty 時は placeholder) を維持しつつ、`slices` が populated のときに SVG bar chart + chip list を描画する。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | 編集 | SVG bar chart 描画ロジック追加 / fallback 維持 |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` | 新規 | Phase 4 で定義済の test を実装（実コードは Phase 4 と並行可） |

新規 helper を別ファイルに切り出す場合（任意）:

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_dashboard/status-chart-layout.ts` | 新規（optional） | `computeBarLayout` / `buildAriaLabel` 純関数 |

> **既定**: 同一ファイル内に内包する。helper 切り出しは単体テストを別ファイルで書きたい場合のみ行う。

## 実装手順

### 1. 内部 helper 関数（同一ファイル内）

```typescript
type Status = StatusSlice["status"];

const VIEWPORT = { width: 600, height: 200 } as const;
const PADDING = { top: 20, right: 20, bottom: 30, left: 20 } as const;
const BAR_GAP = 24;

const LABEL: Record<Status, string> = {
  public: "公開",
  member_only: "会員限定",
  hidden: "非公開",
};

const COLOR_VAR: Record<Status, string> = {
  public: "var(--ubm-color-ok)",
  member_only: "var(--ubm-color-info)",
  hidden: "var(--ubm-color-warn)",
};

const STATUS_ORDER: ReadonlyArray<Status> = ["public", "member_only", "hidden"];

interface BarLayout {
  readonly status: Status;
  readonly count: number;
  readonly label: string;
  readonly colorVar: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function computeBarLayout(slices: ReadonlyArray<StatusSlice>): ReadonlyArray<BarLayout> {
  if (slices.length === 0) return [];
  const chartWidth = VIEWPORT.width - PADDING.left - PADDING.right;
  const chartHeight = VIEWPORT.height - PADDING.top - PADDING.bottom;
  const totalGap = BAR_GAP * (STATUS_ORDER.length - 1);
  const barWidth = (chartWidth - totalGap) / STATUS_ORDER.length;
  const maxCount = Math.max(...slices.map((s) => s.count), 1);
  const sliceByStatus = new Map(slices.map((s) => [s.status, s.count] as const));

  return STATUS_ORDER.flatMap((status, i) => {
    const count = sliceByStatus.get(status);
    if (count === undefined) return [];
    const height = (count / maxCount) * chartHeight;
    const x = PADDING.left + i * (barWidth + BAR_GAP);
    const y = PADDING.top + (chartHeight - height);
    return [{
      status, count, label: LABEL[status], colorVar: COLOR_VAR[status],
      x, y, width: barWidth, height,
    }];
  });
}

function buildAriaLabel(slices: ReadonlyArray<StatusSlice>): string {
  const parts = STATUS_ORDER
    .map((status) => {
      const slice = slices.find((s) => s.status === status);
      return slice ? `${LABEL[status]} ${slice.count}` : null;
    })
    .filter((v): v is string => v !== null);
  return `公開ステータス分布: ${parts.join(", ")}`;
}
```

### 2. component 本体

```typescript
export function StatusDistribution({ slices }: StatusDistributionProps) {
  if (!slices || slices.length === 0) {
    return (
      <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
        <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">公開ステータス</h2>
        <p role="status" className="mt-2 text-sm text-[var(--ubm-color-text-muted)]">
          分布データは現在集計対象外です
        </p>
      </section>
    );
  }

  const layout = computeBarLayout(slices);
  const ariaLabel = buildAriaLabel(slices);

  return (
    <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">公開ステータス</h2>
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="mt-3 w-full max-w-[600px] h-auto"
        data-testid="status-distribution-chart"
      >
        {layout.map((bar) => (
          <g key={bar.status} data-testid="status-bar" data-status={bar.status}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.colorVar}
              rx={4}
            >
              <title>{`${bar.label}: ${bar.count}`}</title>
            </rect>
            <text
              x={bar.x + bar.width / 2}
              y={bar.y - 6}
              textAnchor="middle"
              className="fill-[var(--ubm-color-text-primary)] text-xs tabular-nums"
            >
              {bar.count}
            </text>
            <text
              x={bar.x + bar.width / 2}
              y={VIEWPORT.height - 8}
              textAnchor="middle"
              className="fill-[var(--ubm-color-text-muted)] text-xs"
            >
              {bar.label}
            </text>
          </g>
        ))}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-2">
        {slices.map((s) => (
          <li
            key={s.status}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${TONE[s.status]}`}
          >
            <span>{LABEL[s.status]}</span>
            <span className="tabular-nums">{s.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### 3. 既存 `TONE` map / import 維持

`TONE` map（chip list 用）と `LABEL` map は既存定義をそのまま流用する（chart 用 `COLOR_VAR` と重複するが、bg-soft / text の chip 専用 class なので残す）。

### 4. テスト実装

Phase 4 で定義した TC-CHART-01〜14 を `StatusDistribution.spec.tsx` に実装。`pnpm test apps/web --run -- StatusDistribution.spec.tsx` が green になることを確認。

## 入出力 / 副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `props.slices: ReadonlyArray<StatusSlice> \| undefined` |
| 出力 | JSX（`<section>` ラッパー / SVG または placeholder） |
| 副作用 | なし（pure component） |
| エラー | throw しない（`slices` が無効値でも fallback に倒す） |

## 実行タスク

- Phase 5: `StatusDistribution.tsx` に SVG bar chart を実装し、chip fallback を維持する。

## 参照資料

- - `phase-03.md`
- - `phase-04.md`
- - `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`

## 成果物

- - 実装 diff と focused spec を成果物にする。

## 統合テスト連携

- - Phase 11 の focused test / grep gate / typecheck に接続する。

## 完了条件

- [ ] `StatusDistribution.tsx` が改修済
- [ ] `StatusDistribution.spec.tsx` が新規作成済
- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm test apps/web --run -- StatusDistribution.spec.tsx` green（focused spec 7 tests で TC-CHART-01〜14 を網羅）
- [ ] HEX 直書き 0 件（grep 確認）
