# Phase 5: 実装手順（TDD Green）

`[実装区分: 実装仕様書]`

## 5.1 変更ファイル一覧（新規/編集/削除）

| # | パス | 種別 | 概要 |
|---|------|------|------|
| 1 | `apps/web/src/components/ui/icons.ts` | 編集 | `IconName` union に `"help"` を追加 |
| 2 | `apps/web/src/components/ui/Icon.tsx` | 編集 | `iconGlyph()` の switch に `case "help"` を追加 |
| 3 | `apps/web/src/components/public/DensityToggle.client.tsx` | 編集 | useId 化 / 非制御 details + Escape + click-outside / Icon 化 |
| 4 | `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 編集 | Phase 4/6 の TC-1〜TC-13 と value=list 回帰 guard を実装 |
| 5 | `apps/web/src/styles/legacy-public.css` | 編集（条件付き） | summary 内 `.ui-icon` 整合（視覚崩れ時のみ） |

> 依存順序: 1 → 2 → 3（IconName 追加 → glyph 実装 → 使用）→ 4。

## 5.2 Step 1: `icons.ts`

```ts
export type IconName =
  | "chevron-down"
  | "chevron-up"
  | "x"
  | "search"
  | "check"
  | "menu"
  | "external-link"
  | "send"
  | "inbox"
  | "arrow-left"
  | "briefcase"
  | "map-pin"
  | "chevron-right"
  | "help"; // 追加
```

## 5.3 Step 2: `Icon.tsx`

`iconGlyph()` の `switch (name)` 末尾（`case "chevron-right"` の後）に追加。`common`（`stroke="currentColor"` 等）を spread するため HEX を書かない。

```tsx
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3" />
          <path d="M12 17h.01" />
        </svg>
      );
```

> `IconName` を union 拡張すると `iconGlyph` の switch は網羅性チェックで `help` 追加を要求するため、追加漏れは typecheck で検出される。

## 5.4 Step 3: `DensityToggle.client.tsx`

入出力・副作用:
- 入力: `props.value: Density`（既存）
- 出力: radiogroup + visually-hidden descriptions + HelpHint（DOM）
- 副作用: mount 時に `document` へ `keydown`/`pointerdown` listener を add し、unmount で remove。作用条件は handler 内の `detailsRef.current.open` 判定に限定する。URL replace は既存 `onChange` のまま。

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef } from "react";

import { browserDocument } from "../../lib/is-browser";
import { Icon } from "../ui/Icon";
import { Segmented } from "../ui/Segmented";

type Density = "comfy" | "dense" | "list";

const OPTIONS: ReadonlyArray<{
  value: Density;
  label: string;
  sublabel: string;
  description: string;
}> = [
  /* 既存 3 要素のまま */
];

export interface DensityToggleProps {
  value: Density;
}

export function DensityToggle({ value }: DensityToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const uid = useId();
  const descId = (v: Density) => `${uid}-density-${v}-desc`;

  const detailsRef = useRef<HTMLDetailsElement>(null);

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

  // <details> は非制御のまま native 標準挙動を維持し、close 操作だけ ref 経由で命令的に行う。
  const closeHelp = useCallback(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, []);

  // listener は mount〜unmount で張り、ハンドラ内で detailsRef.current.open を直接判定。
  useEffect(() => {
    const doc = browserDocument();
    if (!doc) return; // SSR / Workers では noop
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailsRef.current?.open) {
        closeHelp();
        detailsRef.current?.querySelector("summary")?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (detailsRef.current?.open && !detailsRef.current.contains(e.target as Node)) {
        closeHelp();
      }
    };
    doc.addEventListener("keydown", onKeyDown);
    doc.addEventListener("pointerdown", onPointerDown);
    return () => {
      doc.removeEventListener("keydown", onKeyDown);
      doc.removeEventListener("pointerdown", onPointerDown);
    };
  }, [closeHelp]);

  const segmentedOptions = OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    sublabel: option.sublabel,
    describedBy: descId(option.value),
  }));

  return (
    <div data-component="density-toggle-control">
      <Segmented
        ariaLabel="表示密度"
        data-component="density-toggle"
        value={value}
        options={segmentedOptions}
        onChange={onChange}
      />
      {OPTIONS.map((option) => (
        <span key={option.value} id={descId(option.value)} className="visually-hidden">
          {option.description}
        </span>
      ))}
      <details ref={detailsRef} data-component="help-hint">
        <summary aria-label="表示密度の説明を見る">
          <Icon name="help" size="sm" />
        </summary>
        <dl>
          {OPTIONS.map((option) => (
            <div key={option.value}>
              <dt>{option.label}</dt>
              <dd>{option.description}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
```

実装上の注意（確定実装の根拠）:
- **React state 制御をやめた理由**: `<details>` の `toggle` イベントは HTML 仕様で非同期発火のため、summary クリック直後に state が同期せず、effect の listener 張り替えが間に合わない（jsdom テストで再現）。非制御 + `detailsRef.current.open` 同期判定に確定。
- **lint 対策**: `document` 直接参照は `no-restricted-globals` で reject されるため、`apps/web/src/lib/is-browser.ts` の `browserDocument()`（正規 getter）経由で取得する。
- import に `useCallback, useEffect, useId, useRef`（`useState` 不要）と `Icon` / `browserDocument` を追加する。

## 5.5 Step 4: テスト実装

Phase 4 の TC-1〜TC-10 を `DensityToggle.client.spec.tsx` に実装。click-outside テスト用に outside 要素を含むラッパーで render する。

## 5.6 Step 5: CSS（条件付き）

`mise exec -- pnpm --filter @ubm-hyogo/web dev` で `/members` を開き、summary 内 icon が 28px 円に収まり色が `--ubm-color-text-secondary` を継承しているか目視。崩れる場合のみ `legacy-public.css` の help-hint ブロックに以下を追記:

```css
  [data-component="help-hint"] summary .ui-icon {
    color: inherit;
  }
```

## 5.7 実行・検証コマンド（Green）

```bash
mise exec -- pnpm exec vitest run apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

## 5.8 DoD（Definition of Done）

- [x] `vitest` で DensityToggle.client.spec の全 TC（既存 4 + 新規 11）が PASS（GREEN / 15 passed）
- [x] `typecheck` exit 0（`IconName` 網羅性含む）
- [x] `?` 平文が DOM から消え `<Icon name="help" />` に置換
- [x] 同一ページ 2〜3 配置で id 衝突ゼロ（TC-1〜TC-3 / TC-11 PASS）
- [x] Escape / click-outside / native toggle / Tab 非 close が全て期待動作（TC-4〜TC-7 / TC-13 PASS）
- [x] HEX 直書き・新規 primitive なし

## 完了条件
- 変更ファイル一覧・シグネチャ・入出力/副作用・テスト・実行コマンド・DoD（CONST_005 全項目）が揃い、後続実行者が迷わず実装着手できること。
