# Phase 2: 設計 — issue-924 style-src-attr 撤去

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL]`

---

## 1. 全体方針

`style={{...}}` を 3 区分に分類し、それぞれ最小コストの置換手段を選ぶ。

| 区分 | 占有数（概算） | 置換手段 |
|------|--------------|---------|
| (A) 静的な色 / spacing / display 制御 | ~30 箇所 | Tailwind utility class または `tokens.css` の CSS variable を className 経由で参照 |
| (B) 動的だが有限段階で量子化可能 | Avatar hue 1 種、Icon size 1 種 | `data-*` 属性 + CSS rule（`tokens.css` または専用 module） |
| (C) 動的かつ連続値 | ZoneDistribution percentage | SVG `<rect width={...}>` 等の SVG 属性に置換（`style-src-attr` 対象外） |

---

## 2. `security-headers.ts` の修正

### 2.1 現状

```ts
// apps/web/src/lib/security-headers.ts:69-77 抜粋
cfg.nonce
  ? `script-src 'self' 'nonce-${cfg.nonce}' 'strict-dynamic'`
  : "script-src 'self'",
cfg.nonce ? `style-src 'self' 'nonce-${cfg.nonce}'` : "style-src 'self'",
cfg.nonce
  ? `style-src-elem 'self' 'nonce-${cfg.nonce}'`
  : "style-src-elem 'self'",
["style-src-attr ", "'unsafe", "-inline'"].join(""),  // ← 削除対象
```

### 2.2 修正後

```ts
cfg.nonce
  ? `script-src 'self' 'nonce-${cfg.nonce}' 'strict-dynamic'`
  : "script-src 'self'",
cfg.nonce ? `style-src 'self' 'nonce-${cfg.nonce}'` : "style-src 'self'",
cfg.nonce
  ? `style-src-elem 'self' 'nonce-${cfg.nonce}'`
  : "style-src-elem 'self'",
// style-src-attr は出力しない（属性 style は inline DOM 注入対策のため許可しない）
```

> directive を完全に omit することで、CSP3 仕様では `style-src` にフォールバックする。`style-src` は nonce 単独であるため属性 style（nonce 適用不能）は禁止扱いとなり、目的（属性 style 全廃 + 攻撃者注入 block）を達成する。

### 2.3 関数シグネチャ（不変）

`buildCspDirective(cfg: SecurityHeaderConfig): string` は呼び出し側との契約を変更しない。

---

## 3. 区分 (A) 静的 style の置換戦略

### 3.1 色値

| before | after |
|--------|------|
| `style={{ color: '#1a1a1a' }}` | `className="text-[var(--ubm-color-text-strong)]"` または既存 token utility |
| `style={{ background: 'linear-gradient(...)' }}` | `className="bg-gradient-to-r from-... to-..."` または `tokens.css` に gradient utility 追加 |
| `style={{ borderColor: 'var(--ubm-color-border)' }}` | `className="border-[var(--ubm-color-border)]"` |

### 3.2 spacing / sizing

| before | after |
|--------|------|
| `style={{ paddingLeft: 16 }}` | `className="pl-4"` |
| `style={{ width: '100%' }}` | `className="w-full"` |

### 3.3 display / position

| before | after |
|--------|------|
| `style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}` | `className="grid grid-cols-[1fr_2fr]"` |

---

## 4. 区分 (B) 動的 + 有限段階の置換戦略

### 4.1 Avatar の動的 hue

**現状**:
```tsx
const hue = hashToHue(seed);  // 0-360 deg
return <div style={{ backgroundColor: `hsl(${hue} 60% 70%)` }} />;
```

**設計**:
- 連続 hue を 12 bucket（30 deg 刻み）に量子化する `bucketHue` を新設。
- `data-hue="0..11"` 属性として出力。
- `apps/web/src/components/ui/Avatar.module.css`（新規）に `[data-hue="0"] { background-color: hsl(0 60% 70%); } ... [data-hue="11"] { background-color: hsl(330 60% 70%); }` を 12 ルール記述。

```ts
// apps/web/src/components/ui/avatar-hue.ts（新規）
export function bucketHue(seed: string): 0|1|2|3|4|5|6|7|8|9|10|11 {
  const raw = hashToHue(seed);  // 0..359
  return Math.floor(raw / 30) as 0|1|2|3|4|5|6|7|8|9|10|11;
}
```

```tsx
// Avatar.tsx
<div data-hue={bucketHue(seed)} className={styles.avatar} />
```

> 12 段階で十分: 視認上 hue 30 deg 差は識別可能だが個人特定性は維持される。色覚多様性配慮として、`tokens.css` の OKLch トークンと整合する 12 色を採用する（Phase 5 で具体値確定）。

### 4.2 Icon の動的 size px

**現状**:
```tsx
<svg style={{ width: size, height: size }} />
```

**設計**:
- 既存 design system で許容している size セット（16 / 20 / 24 / 32 / 40 px）に限定し、`data-size="16"` 等を属性化。
- `Icon.module.css`（または `tokens.css`）に `[data-icon-size="16"] svg { width: 16px; height: 16px; }` 等の rule を追加。

```tsx
<span data-icon-size={size} className={styles.icon}>{children}</span>
```

> 既存コードで非標準 size が混在している場合は Phase 5 でリスト化し、最も近い標準 size に丸める or 例外として追加する。

### 4.3 ZoneDistribution の percentage gradient

**現状**:
```tsx
<div style={{ background: `linear-gradient(90deg, var(--c1) ${p1}%, var(--c2) ${p2}%, ...)` }} />
```

**設計**:
- SVG `<rect width={p1 + '%'} fill="var(--c1)" />` を横並びに配置する SVG コンポーネントに置換。
- SVG 属性 `width` / `fill` は CSP `style-src-attr` の評価対象外（属性 style は `style="..."` 形式のみ対象）。
- `viewBox="0 0 100 10"` の固定スケーリングで親要素幅に追従させる。

```tsx
// ZoneDistribution.tsx 抜粋（疑似）
<svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-2 w-full">
  {segments.map((seg, i) => (
    <rect
      key={seg.zone}
      x={seg.cumulativeStart}
      y={0}
      width={seg.percentage}
      height={10}
      fill={`var(--ubm-zone-color-${seg.zone})`}
    />
  ))}
</svg>
```

---

## 5. テストの設計

### 5.1 unit (`apps/web/src/lib/__tests__/security-headers.spec.ts`)

追加 assertion:

```ts
it('does not include style-src-attr directive', () => {
  const csp = buildCspDirective({ ...baseCfg, nonce: 'abc' });
  expect(csp).not.toContain('style-src-attr');
});

it('does not include style-src-attr when nonce is absent', () => {
  const csp = buildCspDirective(baseCfg);
  expect(csp).not.toContain('style-src-attr');
});
```

### 5.2 Playwright smoke (`apps/web/tests/security-headers.smoke.spec.ts`)

追加 assertion:

```ts
test('CSP response header omits style-src-attr', async ({ request }) => {
  const res = await request.get('/');
  const csp = res.headers()['content-security-policy-report-only']
           ?? res.headers()['content-security-policy'];
  expect(csp).toBeDefined();
  expect(csp).not.toMatch(/style-src-attr/);
});
```

### 5.3 grep gate (`scripts/verify-no-inline-style.sh` 新規)

```bash
#!/usr/bin/env bash
set -euo pipefail
hits=$(rg -l "style=\{\{" apps/web/src apps/web/app --glob '*.tsx' --glob '*.ts' || true)
if [[ -n "$hits" ]]; then
  echo "inline style={{...}} detected:" >&2
  echo "$hits" >&2
  exit 1
fi
echo "no inline style={{...}} hits — OK"
```

- `lefthook.yml` の `pre-push` に追加。
- `.github/workflows/verify-style-src-attr.yml`（新規）または既存 verify workflow に追加。

---

## 6. nonce 仕様の不変条件

issue #871 で確立した以下は本サイクルで一切変更しない:

- `script-src 'self' 'nonce-<n>' 'strict-dynamic'`
- `style-src 'self' 'nonce-<n>'`
- `style-src-elem 'self' 'nonce-<n>'`
- `cspMode: 'report-only'`
- middleware の nonce 生成・request/response 双方への注入

---

## 7. risks と緩和策

| risk | 影響 | 緩和策 |
|------|------|--------|
| 静的置換時に Tailwind class が長くなり可読性低下 | code review 工数増 | `tokens.css` に semantic utility（`.ubm-card-elevated` 等）を必要なら追加し集約 |
| Avatar の 12 段階量子化で同一 hue 衝突が増える | UX 識別性低下 | hash 関数を seed × 12 で再分散させる。1 サイクル内で観察し必要なら段階数を 16 に拡張 |
| ZoneDistribution の SVG 化で既存 baseline が pixel diff | visual regression | pixel-tolerance を Phase 11 で確認し、必要なら baseline 更新（visual evidence 添付） |
| `style-src-attr` omit によりブラウザ実装差で fallback 評価が異なる | 想定外の inline 評価 | Playwright で実 response を assert + CSP3 仕様準拠の主要ブラウザ（Chromium）で 19 routes 走査 |
