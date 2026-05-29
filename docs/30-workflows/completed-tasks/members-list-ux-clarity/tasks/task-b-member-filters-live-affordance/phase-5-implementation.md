<!-- workflow: members-list-ux-clarity / task: B / phase: 5 -->

[実装区分: 実装仕様書]

# Phase 5 — 実装手順 (Task B)

> 前提: Phase 2 設計 / Phase 4 テスト計画
> implementation_mode: `new`

## 0. P50 / 前提確認

- `feat/members-list-ux-clarity` ブランチに本タスクの実装は未着手
- 親 workflow は `spec_created`、Task B も `spec_created`
- 既存ファイル `SelectedTagsBar.client.tsx` / `MemberFilters.client.tsx` は変更前の状態 (Phase 4 RED の前提)

## 1. 変更対象ファイル一覧

### 1.1 新規

| パス | 概要 |
| ---- | ---- |
| `apps/web/src/components/public/SelectedFiltersBar.client.tsx` | q/zone/status/tag を統一 chip 列で描画する Client Component |
| `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | Phase 4 TC-B-SFB-01..06 |

### 1.2 編集

| パス | 概要 |
| ---- | ---- |
| `apps/web/src/components/public/MemberFilters.client.tsx` | hint / live region / 件数 prop / SelectedFiltersBar 統合 / 旧 clear button 廃止 |
| `apps/web/src/components/public/SelectedTagsBar.client.tsx` | 後方互換 wrapper として `SelectedFiltersBar` を委譲呼出 (export 名 `SelectedTagsBar` 維持) |
| `apps/web/app/(public)/members/page.tsx` | `<MemberFilters>` に `totalCount` / `displayedCount` prop を渡す (+4..6 行) |
| `apps/web/src/styles/legacy-public.css` | live-filter-hint / result-count / selected-filters-bar / clear-all primary 強調 (+50 / -8 行) |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | Phase 4 § 2 の既存 7 ケース修正 + Phase 4 § 3 の追加 3 ケース |

### 1.3 削除

なし。`SelectedTagsBar.client.tsx` は wrapper として残す。

## 2. 関数 / 型 / Props シグネチャ

### 2.1 `SelectedFiltersBar.client.tsx`

```ts
"use client";

import type { JSX } from "react";

export type SelectedFilterKey = "q" | "zone" | "status" | "tag";

export interface SelectedFiltersBarFilters {
  q: string;
  zone: string;
  status: string;
  tag: string[];
}

export interface SelectedFiltersBarLabels {
  q: (value: string) => string;
  zone: Record<string, string>;
  status: Record<string, string>;
  tag: (code: string) => string;
}

export interface SelectedFiltersBarProps {
  filters: SelectedFiltersBarFilters;
  hasFilters: boolean;
  onClearOne: (key: SelectedFilterKey, value?: string) => void;
  onClearAll: () => void;
  labels?: Partial<SelectedFiltersBarLabels>;
}

const DEFAULT_LABELS: SelectedFiltersBarLabels = {
  q: (v) => `キーワード: ${v}`,
  zone: {
    "0_to_1": "ゾーン: 0→1",
    "1_to_10": "ゾーン: 1→10",
    "10_to_100": "ゾーン: 10→100",
  },
  status: {
    member: "種別: 正会員",
    non_member: "種別: 非会員",
    academy: "種別: アカデミー",
  },
  tag: (c) => `#${c}`,
};

export function SelectedFiltersBar(props: SelectedFiltersBarProps): JSX.Element | null;
```

### 2.2 `MemberFilters.client.tsx` Props 拡張

```ts
export interface MemberFiltersProps {
  initial: MembersSearch;
  topTags?: TagPickerOption[];
  totalCount?: number;       // 既定: 0
  displayedCount?: number;   // 既定: 0
}
```

### 2.3 `SelectedTagsBar.client.tsx` 後方互換 wrapper

```ts
export interface SelectedTagsBarProps {
  selected: string[];
  onRemove: (code: string) => void;
  onClearAll: () => void;
}

export function SelectedTagsBar(props: SelectedTagsBarProps): JSX.Element | null;
```

## 3. 入出力 (props 詳細)

| Component | prop | 型 | 既定 | 説明 |
| --------- | ---- | -- | ---- | ---- |
| `SelectedFiltersBar` | `filters` | `SelectedFiltersBarFilters` | 必須 | q/zone/status/tag を渡す。sort は含まない |
| `SelectedFiltersBar` | `hasFilters` | `boolean` | 必須 | false なら null 返却 |
| `SelectedFiltersBar` | `onClearOne` | `(key, value?) => void` | 必須 | 個別解除 callback |
| `SelectedFiltersBar` | `onClearAll` | `() => void` | 必須 | 全クリア callback |
| `SelectedFiltersBar` | `labels` | `Partial<...>` | DEFAULT_LABELS | ラベル写像表 override |
| `MemberFilters` | `totalCount` | `number` | `0` | 全件数 |
| `MemberFilters` | `displayedCount` | `number` | `0` | 表示件数 |

## 4. URL query 不変条件 (INV-2)

- `q` / `zone` / `status` / `sort` / `tag` / `density` の key / value 仕様は本タスクで変更しない
- `update()` 関数 (URLSearchParams 経由 `router.replace`) は既存実装をそのまま再利用
- chip × は以下のリセット動作とする:
  - `q`: `update({ q: "" })`
  - `zone`: `update({ zone: "all" })`
  - `status`: `update({ status: "all" })`
  - `tag[code]`: `update({ tag: initial.tag.filter((t) => t !== code) })`
- `sort` は chip 化しないため URL からは変更されない
- chip 個別 × による URL 変化は既存 `replaceMock` で検証可能

## 5. `page.tsx` から `MemberFilters` への件数受け渡し設計

```diff
       <MemberFilters
         initial={search}
         topTags={listResult.ok ? listResult.data.topTags : []}
+        totalCount={listResult.ok ? listResult.data.pagination.total : 0}
+        displayedCount={listResult.ok ? listResult.data.items.length : 0}
       />
```

- `listResult.ok=false` のとき両方 `0` (`該当者なし` 表示)
- `pagination.total` は API 既存 surface (`listMembers` 返却) からそのまま参照
- `<p data-role="pagination-meta">` は機械可読 metadata として維持し、aria-live を付与しない (二重通知防止)

## 6. 実装手順 (TDD 順)

### Step 1: 既存 spec の修正 + 追加ケースを書く (RED)

1. `MemberFilters.client.spec.tsx` の Phase 4 § 2 既存 7 ケースを書換える
2. Phase 4 § 3 TC-B-MF-01..03 を追加する
3. `vitest run` で fail を確認 (実装未変更のため selector 差異・新 prop で fail)

### Step 2: `SelectedFiltersBar.client.spec.tsx` を書く (RED)

1. Phase 4 § 4 TC-B-SFB-01..06 を新規作成
2. import 先は未実装 → ファイル not found で fail

### Step 3: `SelectedFiltersBar.client.tsx` を実装 (GREEN)

1. Phase 2 § 3 / Phase 5 § 2.1 の通り実装
2. 描画順: `q` chip → `zone` chip → `status` chip → `tag` chips → 右端 `clear-all`
3. `hasFilters=false` で `null` 返却
4. unknown `zone` / `status` 値は chip 化しない (label 写像表に無いキーはスキップ)
5. spec が PASS することを確認

### Step 4: `MemberFilters.client.tsx` を改修 (GREEN)

1. Props に `totalCount` / `displayedCount` 追加
2. `form` に `aria-describedby="member-filters-hint"` 追加
3. Search 下に `<small id="member-filters-hint" data-role="live-filter-hint">` 配置
4. `filter-grid` 末尾の旧 clear button を削除
5. `TagPicker` 後に `<SelectedFiltersBar filters={...} hasFilters={hasFilters} onClearOne={onClearOne} onClearAll={onClear} />` 配置
6. `<output data-role="result-count" aria-live="polite" aria-atomic="true" role="status">` を `data-role="filters-body"` 末尾に配置
7. `onClearOne` callback を `useCallback` で実装 (Phase 2 § 4.3)
8. `resultCountText` の三項分岐を実装 (Phase 2 § 4.4)
9. import から `SelectedTagsBar` を削除し `SelectedFiltersBar` を import
10. spec が PASS することを確認

### Step 5: `SelectedTagsBar.client.tsx` を wrapper 化

1. Phase 2 § 8 の通り wrapper 実装
2. 既存 `SelectedTagsBar` 直接利用箇所 (`/members` 経路以外) の動作維持を `git grep` で確認

### Step 6: `page.tsx` の prop 渡し

1. Phase 5 § 5 の diff を適用 (+4 行)
2. `pagination-meta` には触れない

### Step 7: CSS 追記 (`legacy-public.css`)

1. `[data-role="live-filter-hint"]`: font-size small / color muted token (`var(--ubm-color-text-muted)` 相当)
2. `[data-role="result-count"]`: 余白調整 / aria-live 視認用 padding
3. `[data-component="selected-filters-bar"]`: flex-wrap / gap / 背景 token
4. `[data-component="selected-filters-bar"] [data-role="clear-all"]`: primary tone (`var(--ubm-color-accent)` 系 token) で強調
5. HEX 直書きなし (`verify-design-tokens` gate 維持)

### Step 8: ローカル検証

```bash
mise exec -- pnpm --filter @ubm/web typecheck
mise exec -- pnpm --filter @ubm/web lint
mise exec -- pnpm --filter @ubm/web vitest run \
  src/components/public/__tests__/MemberFilters.client.spec.tsx \
  src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx
mise exec -- pnpm verify-design-tokens
```

## 7. ローカル実行コマンド (DoD 用)

```bash
# typecheck (web app)
mise exec -- pnpm --filter @ubm/web typecheck

# lint (web app)
mise exec -- pnpm --filter @ubm/web lint

# component tests (Task B 局所)
mise exec -- pnpm --filter @ubm/web vitest run \
  src/components/public/__tests__/MemberFilters.client.spec.tsx \
  src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx

# design tokens gate
mise exec -- pnpm verify-design-tokens
```

## 8. DoD

- [ ] Phase 4 の全テストケースが PASS
- [ ] `pnpm --filter @ubm/web typecheck` GREEN
- [ ] `pnpm --filter @ubm/web lint` GREEN
- [ ] `verify-design-tokens` GREEN (HEX 直書き 0)
- [ ] `SelectedTagsBar` の旧 API が wrapper 経由で動く
- [ ] 既存 `MemberFilters.client.spec.tsx` の意図 (button name / `すべてクリア` / selector 主要部) が後方互換維持
- [ ] URL query 仕様 (`q`/`zone`/`status`/`sort`/`tag`/`density`) 不変
- [ ] 新 primitive 追加 0
- [ ] API endpoint / D1 schema / Google Form 変更 0
