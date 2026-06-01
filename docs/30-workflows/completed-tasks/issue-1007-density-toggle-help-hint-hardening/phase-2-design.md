# Phase 2: 設計

`[実装区分: 実装仕様書]`

## 2.1 要件レビュー（一次結論）

| 観点 | 結論 |
|------|------|
| 真の論点 | DensityToggle を「再利用しても壊れない feature-local component」に引き上げること。論点は a11y id 一意性 + popover 閉じ操作 + icon 整合の 3 点で、互いに独立 |
| 依存・責務境界 | id 生成と close 挙動は `DensityToggle` 内に閉じる。icon は正本 `Icon` system に委譲（責務分離）。`Segmented` は変更不要（`describedBy` を素通しする既存契約のまま） |
| 価値とコスト | 価値=将来複数配置時の a11y 破綻予防 + keyboard a11y 改善。高コスト項目（汎用 Popover 化）は将来層として除外し初回価値に集中 |
| 改善優先順位 | ① id 一意化（最小・確実）→ ③ icon 整合（独立・小）→ ② close 挙動（effect 管理で最も注意が必要） |
| 4 条件 | 価値性○ / 実現性○（単一ファイル群）/ 整合性○（既存 useId・Escape・Icon パターンに整合）/ 運用性○（focused test で固定） |

### 因果ループ
- 強化ループ: id 一意化 → 複数配置可能 → 他公開/admin preview で再利用 → DensityToggle の価値増。
- バランスループ: close 挙動に listener を増やす → leak リスク増 → cleanup 必須化で抑制。

## 2.2 コンポーネント設計（DensityToggle.client.tsx）

### state ownership テーブル

| state / ref | 所有者 | 役割 | 解放/同期経路 |
|-------------|--------|------|---------------|
| `uid = useId()` | DensityToggle | description id の一意 prefix | 不変（render 毎安定） |
| `detailsRef` | DensityToggle | HelpHint の現在 open 状態参照と命令的 close | summary toggle / Escape / click-outside / unmount |
| `detailsRef: Ref<HTMLDetailsElement>` | DensityToggle | click-outside 判定と focus 戻し | unmount で GC |

### id 一意化（AC-1/AC-2）

```ts
const uid = useId();
const descId = (value: Density) => `${uid}-density-${value}-desc`;

const segmentedOptions = OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  sublabel: option.sublabel,
  describedBy: descId(option.value),
}));
// span 側も id={descId(option.value)} で対応させる
```

> `useId()` は React がツリー位置ごとに一意な安定 id を返すため、複数 instance で prefix が必ず異なる。`Segmented` 側は無変更（`aria-describedby={opt.describedBy}` を素通し）。

### HelpHint close 挙動（AC-3/AC-4/AC-5）— 非制御 `<details>` + 命令的 close（確定実装）

> 当初案は React state で `<details>` の open 状態を制御する方式だったが、ブラウザ標準の toggle 通知は非同期で summary クリック直後の状態同期が不安定になる。よって **`<details>` は非制御**のまま native 標準挙動を維持し、close 操作だけを `detailsRef` 経由で命令的に行う方式を確定とする。Issue の「`<details>` 標準挙動優先・追加イベント最小」にも整合する。

```tsx
const detailsRef = useRef<HTMLDetailsElement>(null);

// close 操作だけ ref 経由で命令的に行う
const closeHelp = useCallback(() => {
  if (detailsRef.current) detailsRef.current.open = false;
}, []);

// listener は mount〜unmount で張り、ハンドラ内で detailsRef.current.open を直接判定する。
// document は browserDocument()（is-browser.ts の正規 getter）経由（no-restricted-globals 対策）。
useEffect(() => {
  const doc = browserDocument();
  if (!doc) return; // SSR / Workers では noop
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && detailsRef.current?.open) {
      closeHelp();
      detailsRef.current?.querySelector("summary")?.focus(); // focus を summary に戻す（AC-3）
    }
  };
  const onPointerDown = (e: PointerEvent) => {
    if (detailsRef.current?.open && !detailsRef.current.contains(e.target as Node)) {
      closeHelp(); // click-outside close（AC-4）
    }
  };
  doc.addEventListener("keydown", onKeyDown);
  doc.addEventListener("pointerdown", onPointerDown);
  return () => {
    doc.removeEventListener("keydown", onKeyDown);
    doc.removeEventListener("pointerdown", onPointerDown); // leak 防止（AC-9）
  };
}, [closeHelp]);
```

```tsx
<details ref={detailsRef} data-component="help-hint">
  <summary aria-label="表示密度の説明を見る">
    <Icon name="help" size="sm" />
  </summary>
  <dl> ...（既存の dt/dd 構造を維持）... </dl>
</details>
```

設計判断:
- **native toggle を維持**: `open` prop を渡さず非制御にすることで summary クリックの開閉は native のまま（AC-5 回帰なし）。`details.open` は同期反映され、ハンドラ内 `detailsRef.current.open` 判定が確実に効く。
- **listener は mount〜unmount**: open 状態に依存せず1度だけ張り、ハンドラ内で `detailsRef.current.open` を見て open のときだけ作用させる。`toggle` 非同期問題を回避し、cleanup は unmount で対称解除（AC-9: leak なし）。
- **SSR / Workers**: `browserDocument()` が undefined を返し effect は noop。`<details>` 初期 closed で hydration mismatch なし。
- **focus 戻し**: Escape 時のみ summary に focus（WAI-ARIA 慣習に整合）。click-outside 時は focus 移動しない。

## 2.3 icon 整合（AC-6） — 既存 Icon system 再利用（FB-SDK-07-1）

`apps/web/src/components/ui/icons.ts`:
```ts
export type IconName =
  | "chevron-down" | ... | "chevron-right"
  | "help"; // 追加
```

`apps/web/src/components/ui/Icon.tsx` の `iconGlyph()` switch に追加（common props = stroke currentColor を継承するため HEX なし）:
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

`DensityToggle` summary 内: `<span aria-hidden="true">?</span>` → `<Icon name="help" size="sm" />`。
- `Icon` は `ariaLabel` 未指定時 `aria-hidden={true}` を付与するため、`summary` の `aria-label="表示密度の説明を見る"` がアクセシブル名の正本として維持される（AC-6）。

## 2.4 CSS（AC-8） — 限定差分（必要時のみ）

`legacy-public.css:1291-1300` の `[data-component="help-hint"] summary` は 28px 円に `place-items: center`。`.ui-icon`（`Icon` の wrapper）は `data-size="sm"`=12px を内包するため、原則そのままで中央に収まる。
- 追加差分が要るのは「icon の色/サイズが summary 既存スタイルと不整合な場合」のみ。その場合 `[data-component="help-hint"] summary .ui-icon { color: inherit; }` の 1 ブロックに留める。HEX は書かない。

## 2.5 検証パス設計

| lane | 内容 | 直列/並列 |
|------|------|-----------|
| L1 | 実装（DensityToggle / icons / Icon） | 直列（依存: icons→Icon→DensityToggle） |
| L2 | focused test（DensityToggle.client.spec） | L1 後 |
| L3 | typecheck / verify-design-tokens / Playwright smoke | L2 後（締め・直列） |

## 完了条件
- 関数シグネチャ・state ownership・close 挙動・icon 追加・CSS 方針が確定し、Phase 3 でレビュー可能なこと。
