<!-- workflow: members-list-ux-clarity / task: A / phase: 5 -->

# Phase 5 — 実装手順 (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

> CONST_005 必須項目を完全に埋める。各擬似コードは「設計の骨格」を示すものであり、
> Phase 5 実装時に呼び出し方や OKLch token 名は実コードで確認・調整して問題ない。

## 1. 変更対象ファイル一覧

### 1.1 新規

| パス | 役割 |
| ---- | ---- |
| `apps/web/src/components/public/DensityToggle.client.tsx` | `<details>` ベース汎用 popover component |

### 1.2 編集

| パス | 主な変更内容 |
| ---- | ------------ |
| `apps/web/src/components/ui/Segmented.tsx` | `SegmentedOption` 型に `sublabel?` / `ariaDescribedBy?` 追加・`<button>` 内 sublabel 描画 |
| `apps/web/src/components/public/DensityToggle.client.tsx` | OPTIONS 拡張・wrapper div 追加・visually-hidden description span 3 個配置・HelpHint 組み込み |
| `apps/web/src/styles/legacy-public.css` | sublabel / help-hint / mobile media query 用 CSS 追加 (OKLch tokens のみ) |
| `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | TC-A1〜A7 追加 (既存 TC-E1〜E3 は無修正) |

### 1.3 削除

なし。

## 2. 各ファイル擬似コード・差分方針

### 2.1 `apps/web/src/components/ui/Segmented.tsx`

```ts
// 型拡張 (加法・後方互換)
export interface SegmentedOption {
  value: string;
  label: string;
  sublabel?: string;          // NEW
  ariaDescribedBy?: string;   // NEW
}

// button 内構造
<button
  key={opt.value}
  type="button"
  role="radio"
  aria-checked={opt.value === value}
  aria-describedby={opt.ariaDescribedBy}     // NEW
  onClick={() => onChange(opt.value)}
>
  <span data-role="label">{opt.label}</span>
  {opt.sublabel ? (
    <span data-role="sublabel">{opt.sublabel}</span>
  ) : null}
</button>
```

副作用: なし (純粋描画)
不変条件: `role="radiogroup"` / `aria-label` / `aria-checked` / `onChange` シグネチャは無変更。

### 2.2 `apps/web/src/components/public/DensityToggle.client.tsx` (新規)

```ts
"use client";

import { Fragment } from "react";

export interface HelpHintItem {
  label: string;
  description: string;
}

export interface HelpHintProps {
  triggerLabel: string;
  items: ReadonlyArray<HelpHintItem>;
}

export function HelpHint({ triggerLabel, items }: HelpHintProps) {
  return (
    <details data-component="help-hint">
      <summary aria-label={triggerLabel}>
        <span aria-hidden="true">?</span>
      </summary>
      <div role="region" aria-label={triggerLabel}>
        <dl>
          {items.map(({ label, description }) => (
            <Fragment key={label}>
              <dt>{label}</dt>
              <dd>{description}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </details>
  );
}
```

副作用: なし (`<details>` の native open state のみ)
不変条件: 新 primitive ではなく feature レベル client component として `components/public/` に配置。

### 2.3 `apps/web/src/components/public/DensityToggle.client.tsx`

```ts
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Segmented } from "../ui/Segmented";

type Density = "comfy" | "dense" | "list";

interface DensityOption {
  value: Density;
  label: string;
  sublabel: string;
  description: string;
}

const OPTIONS: ReadonlyArray<DensityOption> = [
  { value: "comfy", label: "ゆったり", sublabel: "カード詳細", description: "顔写真・自己紹介・タグまでカードに表示。じっくり見たい人向け。" },
  { value: "dense", label: "密",       sublabel: "カード簡易", description: "カードを小さくして 1 画面に多く並べる。ざっと見渡したい人向け。" },
  { value: "list",  label: "リスト",   sublabel: "1行リスト",  description: "名前・職業・拠点を 1 行で並べる。名前で素早く探したい人向け。" },
];

export interface DensityToggleProps {
  value: Density;
}

export function DensityToggle({ value }: DensityToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(sp ? sp.toString() : "");
      if (next === "comfy") {
        params.delete("density");
      } else {
        params.set("density", next);
      }
      const qs = params.toString();
      const base = pathname ?? "/members";
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [router, pathname, sp],
  );

  return (
    <div data-component="density-toggle-wrapper">
      <Segmented
        ariaLabel="表示密度"
        data-component="density-toggle"
        value={value}
        options={OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
          sublabel: o.sublabel,
          ariaDescribedBy: `density-${o.value}-desc`,
        }))}
        onChange={onChange}
      />
      {OPTIONS.map((o) => (
        <span
          key={o.value}
          id={`density-${o.value}-desc`}
          data-role="density-description"
          className="sr-only"
        >
          {o.description}
        </span>
      ))}
      <HelpHint
        triggerLabel="表示密度の説明を見る"
        items={OPTIONS.map((o) => ({ label: o.label, description: o.description }))}
      />
    </div>
  );
}
```

入出力:
- 入力: `value: "comfy" | "dense" | "list"`
- 出力: URL query (`density`) を `router.replace` で更新
- 副作用: URL state 更新のみ (Before/After 同一)

不変条件:
- URL query SSOT (`density` 省略時が `comfy`)
- 主ラベル文字列 (`ゆったり` / `密` / `リスト`) 不変
- `role="radiogroup"` / `aria-label="表示密度"` 不変

### 2.4 `apps/web/src/styles/legacy-public.css`

追加スタイル (実トークン名は `apps/web/src/styles/tokens.css` を Phase 5 実装時に確認):

```css
[data-component="density-toggle-wrapper"] {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--ubm-space-2);
  position: relative;
}

[data-component="density-toggle"] button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ubm-space-1);
}

[data-component="density-toggle"] [data-role="sublabel"] {
  font-size: var(--ubm-font-size-xs);
  color: var(--ubm-color-fg-muted);
  font-weight: 400;
}

.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

[data-component="help-hint"] {
  position: relative;
}

[data-component="help-hint"] > summary {
  list-style: none;
  cursor: pointer;
  width: var(--ubm-space-6);
  height: var(--ubm-space-6);
  border-radius: var(--ubm-radius-full);
  background: var(--ubm-color-bg-subtle);
  color: var(--ubm-color-fg-default);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

[data-component="help-hint"] > summary::-webkit-details-marker { display: none; }

[data-component="help-hint"][open] > div {
  position: absolute;
  top: calc(100% + var(--ubm-space-1));
  right: 0;
  min-width: 280px;
  max-width: calc(100vw - 2rem);
  background: var(--ubm-color-bg-surface);
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-md);
  padding: var(--ubm-space-3);
  box-shadow: var(--ubm-shadow-md);
  z-index: 10;
}

[data-component="help-hint"] dl {
  margin: 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--ubm-space-1) var(--ubm-space-2);
}

[data-component="help-hint"] dt {
  font-weight: 600;
  color: var(--ubm-color-fg-default);
}

[data-component="help-hint"] dd {
  margin: 0;
  color: var(--ubm-color-fg-muted);
}

@media (max-width: 480px) {
  [data-component="density-toggle"] [data-role="sublabel"] {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0);
    white-space: nowrap; border: 0;
  }
}
```

> 実装時に既存 `legacy-public.css` で `.sr-only` が既に定義されていれば再定義しない。
> 既存トークン名と差異がある場合は実定義に合わせる (新トークン定義は禁止)。

### 2.5 テスト追加 (`__tests__/DensityToggle.client.spec.tsx`)

既存 3 ケースは無修正。末尾に Phase 4 のテストケース TC-A1〜A7 を `describe("DensityToggle - sublabel & HelpHint", ...)` で追加。

## 3. データ構造まとめ

```ts
interface DensityOption {
  value: "comfy" | "dense" | "list";
  label: string;        // プロトタイプ主ラベル (不変)
  sublabel: string;     // ボタン下段
  description: string;  // visually-hidden + HelpHint dd
  iconHint?: string;    // 将来拡張余地 (未使用)
}
```

OPTIONS は単一 const として `DensityToggle.client.tsx` 内に閉じ込め、Segmented / visually-hidden span / HelpHint
の 3 箇所が同じ const から map で派生する (DRY)。

## 4. 入出力・副作用・URL query 不変条件

| 項目 | 内容 |
| ---- | ---- |
| 入力 props | `value: Density` |
| 出力 | URL query (`density` 削除/設定) を `router.replace({ scroll: false })` |
| 副作用 | URL state 更新のみ (ローカル state 追加なし) |
| URL query key | `density` のみ操作 (`q` / `zone` / `status` / `sort` / `tag` 不変) |
| URL query SSOT | `density=comfy` は省略・`density=dense` / `density=list` は明示 |

## 5. ローカル実行コマンド

```bash
# typecheck (web パッケージ全体)
mise exec -- pnpm --filter @ubm/web typecheck

# 対象 spec
mise exec -- pnpm --filter @ubm/web vitest run \
  src/components/public/__tests__/DensityToggle.client.spec.tsx

# lint
mise exec -- pnpm --filter @ubm/web lint

# design tokens gate (CI 等価)
mise exec -- pnpm verify-design-tokens
```

## 6. DoD (Definition of Done)

- [ ] AC-A1〜A8 を全て満たす実装が完了
- [ ] Phase 4 のテストケース TC-E1〜E3 + TC-A1〜A7 が全 GREEN
- [ ] `pnpm --filter @ubm/web typecheck` が PASS
- [ ] `pnpm --filter @ubm/web lint` が PASS
- [ ] `pnpm verify-design-tokens` が GREEN (HEX 0 件 / 新 primitive 0)
- [ ] `git grep -n "SelectedTagsBar" apps/` で本 task の影響なしを確認 (Task B との独立性)
- [ ] `git grep -n "from '../ui/Segmented'" apps/web/src` で他呼び出し元への影響 0 (optional prop のみ)
- [ ] HelpHint の summary キーボード操作 (Enter / Space) で open/close が動作 (native 挙動)
- [ ] URL query `density` の append / delete 挙動が Before と同一

## 7. canUseTool / 副作用境界

本タスクは Renderer (Next.js client component) に閉じる。Server Component / API / D1 への影響なし。
`next/navigation` の `useRouter().replace` のみが副作用境界 (既存と同等)。
