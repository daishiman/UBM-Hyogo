<!-- workflow: members-list-ux-clarity / phase: 2 -->

# Phase 2 — 設計 (members-list-ux-clarity)

> Workflow: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
> 前提: [phase-1-requirements.md](./phase-1-requirements.md)

## 1. 設計方針

| 原則 | 適用 |
| ---- | ---- |
| 既存 primitive 維持 | `Segmented` / `FormField` / `Search` / `Select` / `TagPicker` / `Chip` を再利用。新 primitive を作らない |
| URL query SSOT | 全絞り込み・density は `URLSearchParams` 経由で `router.replace` する既存挙動を維持 |
| Server Component 構造維持 | `page.tsx` の await connection → safeServerFetch → render の流れは変えず、prop 1 行 (`totalCount`/`displayedCount`) のみ追加 |
| OKLch tokens のみ | sublabel / hint / chip 強調色は既存 `--ubm-color-*` を使う |
| 加法的拡張 | `Segmented` option 型・`SelectedTagsBar` の API は後方互換 optional prop で拡張 |

## 2. DensityToggle UX 強化 (Task A)

### 2.1 ユースケース定義 (画面上に表示する sublabel & HelpHint 内本文)

| value | 主ラベル | sublabel (画面下) | HelpHint 説明 |
| ----- | -------- | ----------------- | ------------- |
| `comfy` | ゆったり | カード詳細 | 顔写真・自己紹介・タグまでカードに表示。じっくり見たい人向け。 |
| `dense` | 密 | カード簡易 | カードを小さくして 1 画面に多く並べる。ざっと見渡したい人向け。 |
| `list` | リスト | 1行リスト | 名前・職業・拠点を 1 行で並べる。名前で素早く探したい人向け。 |

### 2.2 コンポーネント設計

```
DensityToggle (Segmented wrapper)
├ Segmented (既存)
│   options: Array<{ value, label, sublabel? }>  ← Segmented 側に sublabel 追加 (optional)
│   各 button 内: <span>{label}</span> + <span data-role="sublabel">{sublabel}</span>
└ HelpHint (新規 client component, app/components/public/)
    <details data-component="help-hint">
      <summary aria-label="表示密度の説明を見る">?</summary>
      <div role="region" aria-label="表示密度の説明">
        <dl>
          <dt>ゆったり</dt><dd>顔写真・自己紹介・タグまで表示...</dd>
          ...
        </dl>
      </div>
    </details>
```

### 2.3 a11y

- 各 button: `aria-pressed` (Segmented 既存) + `aria-describedby="density-{value}-desc"`
- HelpHint: native `<details><summary>` で focus trap 不要・ESC で閉じる挙動は native
- `<summary>` は `?` icon + visually-hidden text "表示密度の説明を見る"

### 2.4 data-* attributes

- `data-component="density-toggle"` (既存維持)
- `data-component="help-hint"` (新規 — `[data-component="density-toggle"] [data-component="help-hint"]` で CSS scope)
- 各 button: `data-density={value}` を追加 (visual selector 用)

### 2.5 mobile breakpoint

- `@media (max-width: 480px)`: `[data-role="sublabel"]` を `visually-hidden` に切り替え。HelpHint は維持。
- Segmented 自体の overflow scroll は既存挙動維持。

## 3. MemberFilters live-filter affordance (Task B)

### 3.1 UI 構造 (After)

```
<form role="search" data-component="member-filters" aria-describedby="member-filters-hint">
  <FiltersSummaryMobile ... />     ← 既存
  <div data-role="filters-body">
    <div data-role="filter-grid">
      <FormField label="キーワード検索">
        <Search ... />
        <small data-role="live-filter-hint" id="member-filters-hint">
          入力すると即座に結果に反映されます (キーボード Enter 不要)
        </small>
      </FormField>
      <FormField label="UBM区画"><Select ... /></FormField>
      <FormField label="参加ステータス"><Select ... /></FormField>
      <FormField label="並び替え"><Select ... /></FormField>
      {/* ← クリアボタンは filter-grid から削除 */}
    </div>

    <TagPicker heading="タグで絞り込み" ... />

    <SelectedFiltersBar
      extraFilters={{ q, zone, status, sort }}
      tags={initial.tag}
      onRemove={onRemoveFilter}
      onClearAll={onClear}
      hasFilters={hasFilters}
    />
    {/* ↑ ここに clear button を統合・hasFilters===true のときだけ primary variant で表示 */}

    <output
      data-role="result-count"
      aria-live="polite"
      aria-atomic="true"
    >
      {totalCount > 0 ? `${totalCount} 件中 ${displayedCount} 件を表示しています` : "該当者なし"}
    </output>
  </div>
</form>
```

### 3.2 SelectedFiltersBar 設計

```ts
interface SelectedFiltersBarProps {
  // 旧 SelectedTagsBar 互換
  selected: string[];           // tag ids
  onRemove: (tag: string) => void;
  onClearAll: () => void;
  // 新規
  extraFilters?: {
    q?: string;                 // "" 以外で表示
    zone?: string;              // "all" 以外で表示
    status?: string;            // "all" 以外で表示
    sort?: string;              // "recent" 以外で表示
  };
  onRemoveFilter?: (key: "q" | "zone" | "status" | "sort") => void;
  hasFilters: boolean;
}
```

描画ルール:
- chip 1 つにつき `<Chip>キーワード: 山田<button aria-label="キーワード絞り込みを解除">×</button></Chip>` の形
- zone / status / sort はラベル辞書で日本語化 (`ZONE_LABEL[zone]` 等)
- chip が 0 件かつ `hasFilters=false` のときは何も描画しない
- `hasFilters=true` のとき右端に「絞り込みをクリア」 button (primary variant 相当 class) を出す

### 3.3 件数 propagation (page.tsx 連携)

- `page.tsx` から `<MemberFilters totalCount={...} displayedCount={...} />` を渡す
- `listResult.ok` の場合のみ実数、不正系は `totalCount={0} displayedCount={0}`
- `MemberFilters` は当該 prop が変わったときだけ `<output>` 内容を更新 (React は同値再レンダで diff なしのため自然に達成される)

### 3.4 クリア統合の理由

| 観点 | 現状 (filter-grid 末尾の disabled button) | After (chip 列右端の強調 button) |
| ---- | ----------------------------------------- | -------------------------------- |
| 視認性 | フォーム末尾で目立たない | 適用中条件の隣で文脈が明確 |
| 押し間違い | disabled でも focus 可能 | 描画なし → 押し間違いゼロ |
| プロトタイプ整合 | プロトタイプには明示ボタン位置の規定なし | chip 列パターン (admin/tag UI) と整合 |

### 3.5 a11y

- `aria-live="polite"` は `<output>` (=live region) 1 箇所のみ
- chip 列の × button は `aria-label` で対象を明示 (`キーワード絞り込みを解除` 等)
- "クリア" は `<button type="button">` で focusable / Enter-Space 動作 native

## 4. /members page integration & visual baseline (Task C)

### 4.1 page.tsx 変更

```diff
       <MemberFilters
         initial={search}
         topTags={listResult.ok ? listResult.data.topTags : []}
+        totalCount={listResult.ok ? listResult.data.pagination.total : 0}
+        displayedCount={listResult.ok ? listResult.data.items.length : 0}
       />
```

- 既存の `<p data-role="pagination-meta">` は MemberFilters 内 `<output>` と二重になるため、削除し `MemberFilters` 側に集約 (or `pagination-meta` を機械可読 metadata 専用に残し aria-live は MemberFilters 側にする)。本タスクは「ユーザー向け表現は MemberFilters 側 1 箇所、機械可読 metadata は `data-role="pagination-meta"` を維持」とする。

### 4.2 Playwright visual baseline

新規 `apps/web/playwright/tests/members-ux-clarity.spec.ts`:

| 軸 | 値 |
| -- | -- |
| viewport | 375 / 768 / 1024 / 1440 |
| density | comfy / dense / list |
| state | empty (q=__none__) / filtered (q=山田 + zone=0_to_1) |

- snapshot 名: `members-ux-clarity-{density}-{state}-{viewport}.png`
- masked region: `[data-role="pagination-meta"]` / `time` (時刻系)
- baseline 生成は Linux runner (user-gated)

### 4.3 既存 spec への影響

- `members-prototype-alignment.spec.ts` は selector 変更が無ければそのまま PASS する想定。`SelectedTagsBar` を selector で参照している場合は `SelectedFiltersBar` に合わせて Phase 4 で更新する (Task B / C 横断確認事項)。

## 5. URL query 互換 (INV-2)

| key | type | 変更 |
| --- | ---- | ---- |
| `q` | string | なし |
| `zone` | `all` \| `0_to_1` \| `1_to_10` \| `10_to_100` | なし |
| `status` | `all` \| `member` \| `non_member` \| `academy` | なし |
| `sort` | `recent` \| `name` | なし |
| `tag` | string[] (append) | なし |
| `density` | `comfy` (デフォルト/省略) \| `dense` \| `list` | なし |

絞り込み chip の × クリックは「該当 key を `params.delete()` し replace」する既存パターンと同等で実装する。

## 6. 検証手段 (Phase 4 で test plan 化)

| 種別 | コマンド (草案) | 担当タスク |
| ---- | -------------- | -------- |
| typecheck | `pnpm --filter @ubm/web typecheck` | 全タスク |
| component test | `pnpm --filter @ubm/web vitest run src/components/public/__tests__/DensityToggle.client.spec.tsx` | A |
| component test | `pnpm --filter @ubm/web vitest run src/components/public/__tests__/MemberFilters.client.spec.tsx src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | B |
| visual | `pnpm --filter @ubm/web exec playwright test members-ux-clarity` | C |
| design tokens | `pnpm verify-design-tokens` | 全タスク (CI) |

## 7. data-* / CSS selector 一覧 (CSS 担当が参照)

| selector | 用途 |
| -------- | ---- |
| `[data-component="density-toggle"] [data-role="sublabel"]` | sublabel 小文字テキスト |
| `[data-component="help-hint"]` | popover root |
| `[data-component="member-filters"] [data-role="live-filter-hint"]` | "即時反映" microcopy |
| `[data-component="member-filters"] [data-role="result-count"]` | live region |
| `[data-component="selected-filters-bar"]` | chip 列 root |
| `[data-component="selected-filters-bar"] [data-role="clear-all"]` | 強調 clear button |
| `[data-component="selected-filters-bar"][data-empty="true"]` | hasFilters=false 時の描画スキップマーカー |

## 8. open questions (Phase 3 で解消する論点)

- HelpHint を `<details>` ベースで実装するか、`useState` + button + section にするか
- result-count の文言を "X 件中 Y 件" にするか "Y 件表示 (全 X 件)" にするか
- "並び替え" を SelectedFiltersBar に含めるか (絞り込みではなく順序のため除外候補)
- mobile (375px) で chip 列が長くなったときの折り返し vs 横スクロール

## DoD

- [x] AC ごとの UI 構造案が記述されている
- [x] data-* / CSS selector が一覧化されている
- [x] URL query 互換性が表で示されている
- [x] 検証手段の草案が示されている
- [x] open questions が phase-3 への引継ぎ事項として列挙されている
