# Phase 12: 実装ガイド — issue-924 style-src-attr 撤去

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL]`

---

## Part 1: 中学生レベル説明

### この作業はなにをするの？

ウェブサイトには「悪い人がページの中にこっそり悪いコードを書き込めないようにする壁」があります。これが **CSP（Content-Security-Policy）** という仕組みです。

UBM 兵庫支部会のサイトでは、その壁の一部分に「HTML タグの `style="..."` という書き方は全部許す」という穴がまだ残っていました。これがあると、悪い人がページに `<div style="どんな色でも書ける">` のようなコードを差し込めてしまいます。

今回の作業は、この **最後の穴をふさぐ**ことです。

### どうやってふさぐの？

サイトのプログラムには、`style={{ 色: "赤" }}` のように JavaScript で直接書いていた場所が **51 箇所**ありました。これを全部、別の書き方に変えます:

1. **動かない色や形** → Tailwind というツールの class 名（`text-red-500` みたいなもの）に変える
2. **変わる色（Avatar の人ごとの色）** → 12 色から選ぶ仕組みにして `data-hue="0"` のように属性で書く。本物の色は CSS ファイル側で決める
3. **変わる大きさ（Icon の大きさ）** → 4 種類の標準サイズに揃えて `data-size="md"` のように属性で書く
4. **変わるグラフ（ゾーン分布）** → SVG という別の絵の仕組みで書く。SVG は CSP の規制を受けない

### なぜ大事？

今のままでは、CSP の壁があるけど穴があるので「完全には守れていない」状態です。今回の作業で穴をふさぐと、CSP が本来の力を発揮します。これは銀行やショッピングサイトでも当たり前にやっている「最後の仕上げ」です。

### 終わったあとどうなる？

- 51 箇所の `style={{...}}` が 0 箇所に
- CSP から `style-src-attr` というルールが消える
- 「もう一度 `style={{...}}` を書いたら自動で警告」する仕組み（grep gate）が動く
- 見た目はほぼ変わらない（変わったら困る）

---

## Part 2: 技術者レベル説明

### 2.1 全体構成

```
[React component]
   ├─ style={{ ... }}            ← 撤去対象
   ↓
   ├─ className="..."            ← Tailwind / token utility（区分A）
   ├─ data-hue + globals.css     ← 動的 hue（区分B / Avatar）
   ├─ data-size + globals.css    ← 動的 size（区分B / Icon）
   └─ <svg><rect width="..." />  ← 動的 percentage（区分C / ZoneDistribution）

[apps/web/src/lib/security-headers.ts]
   └─ buildCspDirective() の `style-src-attr 'unsafe-inline'` 行を削除
```

### 2.2 TS シグネチャ

```ts
// apps/web/src/lib/security-headers.ts (unchanged signature)
export function buildCspDirective(cfg: SecurityHeaderConfig): string;

// apps/web/src/components/ui/Avatar.tsx
type AvatarProps = {
  memberId?: string;
  name: string;
  hue?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};
export function Avatar(props: AvatarProps): JSX.Element;

// apps/web/src/components/ui/Icon.tsx
type IconSize = "sm" | "md" | "lg" | "xl";
type IconProps = { name?: string; size?: IconSize; ariaLabel?: string; children?: ReactNode };
export function Icon(props: IconProps): JSX.Element;

// apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx
type ZoneSlice = { zone: string; count: number };
type ZoneDistributionProps = { slices: ZoneSlice[] };
export function ZoneDistribution(props: ZoneDistributionProps): JSX.Element;
```

### 2.3 区分 A: 静的 style の置換疑似コード

```tsx
// before
<div style={{ background: 'var(--ubm-color-surface-elevated)', padding: 16, borderRadius: 8 }}>

// after
<div className="bg-[var(--ubm-color-surface-elevated)] p-4 rounded-lg">
```

### 2.4 区分 B-1: Avatar の動的 hue

```ts
// apps/web/src/components/ui/Avatar.tsx
const resolvedHue = hue ?? hashStringToHue(memberId ?? name);
const hueBucket = Math.round((((resolvedHue % 360) + 360) % 360) / 30) % 12;
```

```css
/* apps/web/src/styles/globals.css */
.ui-avatar[data-hue="0"]  { background: oklch(0.68 0.16 20); }
.ui-avatar[data-hue="1"]  { background: oklch(0.68 0.16 50); }
.ui-avatar[data-hue="2"]  { background: oklch(0.68 0.16 80); }
/* ... 12 ルール ... */
.ui-avatar[data-hue="11"] { background: oklch(0.68 0.16 350); }
```

```tsx
// apps/web/src/components/ui/Avatar.tsx
export function Avatar({ memberId, name, hue, size = "md", className }: AvatarProps) {
  return <div className={["ui-avatar", className].filter(Boolean).join(" ")} data-size={size} data-hue={hueBucket} aria-label={name} />;
}
```

### 2.5 区分 B-2: Icon の動的 size

```css
/* apps/web/src/styles/globals.css */
.ui-icon[data-size="sm"] { width: 12px; height: 12px; }
.ui-icon[data-size="md"] { width: 16px; height: 16px; }
.ui-icon[data-size="lg"] { width: 20px; height: 20px; }
.ui-icon[data-size="xl"] { width: 24px; height: 24px; }
```

```tsx
// apps/web/src/components/ui/Icon.tsx
export function Icon({ name, size = "md", ariaLabel, className, children }: IconProps) {
  return <span className={cn("ui-icon", className)} data-size={size}>{children ?? iconGlyph(name)}</span>;
}
```

### 2.6 区分 C: ZoneDistribution の SVG 置換

```tsx
// apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx
export function ZoneDistribution({ data }: ZoneDistributionProps) {
  let cursor = 0;
  return (
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-2 w-full">
      {data.map((seg) => {
        const x = cursor;
        cursor += seg.percentage;
        return (
          <rect
            key={seg.zone}
            x={x}
            y={0}
            width={seg.percentage}
            height={10}
            fill={`var(--ubm-zone-color-${seg.zone})`}
          />
        );
      })}
    </svg>
  );
}
```

> SVG attribute `fill` / `width` / `x` / `height` は `style` 属性ではなく presentation attribute のため、CSP `style-src-attr` の評価対象外。

### 2.7 `security-headers.ts` 修正の差分

```diff
   cfg.nonce
     ? `style-src-elem 'self' 'nonce-${cfg.nonce}'`
     : "style-src-elem 'self'",
-  ["style-src-attr ", "'unsafe", "-inline'"].join(""),
   "img-src 'self' data: https:",
```

### 2.8 grep gate

```bash
#!/usr/bin/env bash
# scripts/verify-no-inline-style.sh
set -euo pipefail
hits=$(rg -l "style=\{" apps/web/src apps/web/app \
  --glob '*.tsx' --glob '*.ts' 2>/dev/null || true)
if [[ -n "$hits" ]]; then
  echo "[verify-no-inline-style] FAIL — inline style={{...}} detected:" >&2
  echo "$hits" >&2
  exit 1
fi
echo "[verify-no-inline-style] OK"
```

### 2.9 Review correction

30 種思考法 + エレガント検証で、初回実装後に `style={col.width ? ...}` と `style={style}` が残っていたことを検出した。`AdminTableColumn.width` と `GoogleBrandIcon.style` は現行呼び出しで未使用だったため、同サイクルで削除した。grep gate も `style={{` 限定から `style={` 全般へ拡張し、CSP 対象 DOM の inline style prop を取り逃がさない。

### 2.10 Screenshot evidence

Phase 11 screenshot reference: `outputs/phase-11/screenshots/style-src-attr-retirement-static-sanity.png`。

ローカル Next dev は起動後 `/instrumentation` compile で 60 秒以内に HTML 応答を返さなかったため、19 route の実ブラウザ visual regression は引き続き user-gated。今回サイクル内では `tokens.css` + `globals.css` と実 DOM shape（Avatar hue / Icon size / ZoneDistribution SVG / AdminTable）を Playwright Chromium で描画した static visual sanity screenshot を保存した。

### 2.11 ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/security-headers.smoke.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/visual --project=chromium
bash scripts/verify-no-inline-style.sh
bash scripts/verify-pr-ready.sh
```

### 2.12 DoD（完了条件）

- 51 箇所の `style={{...}}` → 0 箇所
- `security-headers.ts:76` の `style-src-attr` 行削除
- focused unit / Playwright smoke / grep gate すべて green
- 19 routes visual baseline 退行 0（または承認 baseline 更新済み）
- nonce 仕様（issue #871）不変条件保持
- lefthook pre-push + CI workflow に grep gate 配線済み
- `mise exec -- pnpm typecheck && pnpm lint` PASS
- `bash scripts/verify-pr-ready.sh` PASS
