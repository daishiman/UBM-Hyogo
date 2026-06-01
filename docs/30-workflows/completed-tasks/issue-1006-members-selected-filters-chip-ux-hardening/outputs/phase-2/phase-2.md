# Phase 2: 設計

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

## 1. 既存コンポーネント再利用可否（[FB-SDK-07-1] 対応）

新規 component / 新規 primitive は作らない。既存 `SelectedFiltersBar.client.tsx` / `MemberFilters.client.tsx` / `TagPicker.client.tsx`（label 表示規則の参照元）/ `legacy-public.css` を編集して達成する。アクセシビリティ（`aria-label` / `role`）も既存構造（`<ul role>` + `<button aria-label>`）を維持・拡張する。

## 2. データフローと責務境界

```
members/page.tsx (RSC)
  └─ topTags: TagPickerOption[] = listResult.data.topTags  ({code,label,count})
       └─ <MemberFilters topTags={...} initial={search} ...>   (client)
            ├─ tagLabels = Object.fromEntries(topTags.map(t => [t.code, t.label]))  ← 導出（pure）
            ├─ member-search-input（検索入力 id。onEmpty fallback focus 先）
            └─ <SelectedFiltersBar search onPatch onClearAll tagLabels onEmpty>   (client)
                 ├─ chips[] 構築（tag は own property の tagLabels[code]、未登録/prototype key は code fallback）
                 ├─ intra-bar focus 管理（次/前 chip）= 自身が所有
                 └─ 最後の chip 削除で unmount → onEmpty() を呼び親が searchInput へ focus
```

| 状態 | 所有者 | 根拠 |
| --- | --- | --- |
| `tagLabels`（code→label map） | `MemberFilters`（`topTags` から導出） | API/D1 不変条件。bar は受け取るだけ |
| chips 配列 | `SelectedFiltersBar`（props `search` から純粋導出） | 既存どおり state を持たない |
| intra-bar focus（次/前 chip） | `SelectedFiltersBar`（`useRef`+`useEffect`） | bar 内に閉じた関心 |
| unmount 時 fallback focus | `MemberFilters`（`onEmpty` callback + `member-search-input`） | bar は unmount するため親が所有 |

> state ownership を `Facade`/`UI` で混在させない（skill 要件）。bar は「自分が表示されている間の focus」、親は「bar 消滅後の focus」を分担。

## 3. props 変更設計

### `SelectedFiltersBarProps`（編集）

```ts
export interface SelectedFiltersBarProps {
  search: MembersSearch;
  onPatch: (patch: Partial<MembersSearch>) => void;
  onClearAll: () => void;
  /** code → 表示名。未登録 code は code 自身に fallback する。MemberFilters が topTags から導出して渡す。 */
  tagLabels?: Readonly<Record<string, string>>;
  /** 最後の chip が削除され bar が消える時に呼ばれる。親は検索入力等へ focus を戻す。 */
  onEmpty?: () => void;
}
```

`tagLabels` / `onEmpty` は **optional**。未指定でも現行挙動（code 表示 / fallback focus なし）に degrade するため、他の利用箇所が増えても後方互換。

### chip ラベル解決（tag のみ変更。q/zone/status は不変）

```ts
const resolveTag = (code: string) =>
  Object.hasOwn(tagLabels, code) ? tagLabels[code] : code;
// label:      `#${resolveTag(tag)}`
// removeLabel: `${resolveTag(tag)} タグ絞り込みを解除`
```

> `removeLabel`（aria-label）も表示名に揃え、スクリーンリーダーと視覚表示の文言を一致させる。fallback 時は code が入る（防御的・例外なし＝[WEEKGRD-02] 準拠）。

## 4. focus 管理設計

### 4.1 メカニズム

`SelectedFiltersBar` を pure function → focus state を持つ client component へ最小拡張:

```ts
const chipRefs = useRef(new Map<string, HTMLButtonElement>());   // chip.key -> button
const pendingFocusRef = useRef<string | null>(null);
```

- 各 chip `<button ref={el => { if (el) chipRefs.current.set(chip.key, el); else chipRefs.current.delete(chip.key); }}>`。
- `useEffect(() => { /* pendingFocusRef を解決して focus、その後 null クリア */ }, [chips.map(c => c.key).join("|")])` で chips 変化後に focus 復帰。

### 4.2 削除時の focus 先決定（onRemove ラッパ）

chip 削除ボタン押下時、削除前に「次の focus 先」を計算して `pendingFocusRef` に積む:

| 状況 | pendingFocus | 補足 |
| --- | --- | --- |
| 削除後も chip が残り、削除した index の次が存在 | 次 chip（`chips[i+1].key`） | リスト前進 |
| 削除した chip が末尾（次が無い）が、前に chip あり | 前 chip（`chips[i-1].key`） | リスト後退 |
| 削除後に chip が 0 件になる（= bar unmount） | `onEmpty?.()` を呼ぶ | useEffect は走らない（unmount）。親が focus |

> clear-all は通常「次/前 chip」優先で focus が当たるため、chip が残る限り clear へは飛ばさない。chip 1 件 → 0 件のときのみ `onEmpty`。

### 4.3 `MemberFilters` 側の `onEmpty` 配線

- 検索入力（`Search`）へ `id="member-search-input"` を渡し、`onEmpty` 内で `document.getElementById("member-search-input")?.focus()` を実行する（`isBrowser()` guard 済み）。

> 実装者は ref 転送 / querySelector のどちらでも可。Phase 4 の MemberFilters spec が「最後の chip 削除 → 検索入力に focus」を assert することで観測挙動を固定する。

## 5. mobile overflow CSS 設計

`apps/web/src/styles/legacy-public.css` の `[data-component="selected-filters-bar"]`（:1375）付近へ mobile breakpoint を追加:

```css
/* mobile: chip 群とクリアを縦積みし、操作密度を確保（selected-filters-bar 配下に限定） */
@media (max-width: 640px) {
  [data-component="selected-filters-bar"] {
    flex-direction: column;
    align-items: stretch;
    gap: var(--ubm-space-2);
  }
  [data-component="member-filters"] [data-role="active-filters"] {
    /* 既存 flex-wrap: wrap を維持しつつ横スクロールさせない */
    width: 100%;
  }
  [data-component="member-filters"] [data-role="clear-all"] {
    align-self: flex-end;
  }
}
```

- 色・サイズは既存 `var(--ubm-...)` トークンのみ。HEX 直書きなし（不変条件 / `verify-design-tokens`）。
- selector は `[data-component="selected-filters-bar"]` / `[data-component="member-filters"]` 配下に閉じ、他画面へ波及しない。
- breakpoint `640px` は既存 `FiltersSummaryMobile`（`<=640px`）に整合（Phase 1 §8 / issue-276 と同一境界）。

## 6. 入力 / 出力 / 副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `search: MembersSearch`、`tagLabels?`、`onPatch`/`onClearAll`/`onEmpty` callbacks |
| 出力 | chip 群（表示名解決済）、clear-all、a11y 属性。描画のみ（DOM） |
| 副作用 | `useEffect` による `.focus()` 呼び出し（chips 変化時）。`onPatch`/`onClearAll`/`onEmpty` の呼び出し |
| エラー処理 | `tagLabels` 未登録 code は `code` を返す（throw しない）。`chipRefs` に target 不在なら focus をスキップ（防御的） |

## 7. ステップ間 state 引き渡しテーブル（focus 復帰の同期点）

| トリガ | 引き渡し | 反映タイミング |
| --- | --- | --- |
| chip 削除ボタン押下 | `pendingFocusRef` に次 focus 先を記録 → `onRemove()`（= `onPatch`） | 即時（クリック時） |
| `onPatch` → `router.replace` → RSC 再フェッチ → 新 `search` prop | `chips` 再導出 | 再レンダー時 |
| `chips` 変化 | `useEffect` が `pendingFocusRef` を解決し `.focus()` | レンダー後 |
| chips→0 | `useEffect` 走らず（unmount）。`onEmpty()` を削除クリック時に呼ぶ | 親が focus |

## 8. ライブラリ選定

新規ライブラリ採用なし（React 既存 hooks のみ）。複合フィールド semantics 等の実測確認は不要。
