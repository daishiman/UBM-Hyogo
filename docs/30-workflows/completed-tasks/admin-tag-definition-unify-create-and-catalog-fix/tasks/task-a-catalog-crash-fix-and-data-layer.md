# [実装区分: 実装仕様書] — Task A: カタログクラッシュ修正 + 統合データ層

> 正本: [`../_shared-context.md`](../_shared-context.md) / [`../phase-2-design.md`](../phase-2-design.md)（§3）。
> 本書は **Lane A**（データ正規化 adapter + クラッシュ class 根絶 + server page 防御化）の実装仕様。
> コード実装は本サイクルで local 完了。commit・PR・push は行わない。

---

## 1. 目的 / AC 対応

タグ定義一覧の防御正規化を純関数に隔離し、`reduce` を含む集計を「常に正規化済み配列」上でのみ実行することで、`TagCatalogPanel.tsx:71` 由来の `Cannot read properties of undefined (reading 'reduce')` クラッシュ class を根絶する。統合パネル（Lane C）が消費する **list 正規化 adapter** とフィルタ・件数集計の純関数を提供する。

| AC | 対応 |
|----|------|
| **AC-1** | クラッシュ解消。タグ 0 件時は EmptyState（描画は Lane C。本 Lane は「`items` が常に配列」を保証） |
| **AC-2** | `items` が `undefined`/`null`/欠落/非配列でも空配列に畳む。`total` 欠落は 0（or items.length） |
| **AC-13** | `apps/api` diff 空（本 Lane は web のみ。API 非変更） |

> 本 Lane は **C の前提**（データ shape 確定）。B とは独立。

---

## 2. 変更対象ファイル一覧

| パス | 種別 | 内容 |
|------|------|------|
| `apps/web/src/components/admin/tagDefinitionView.ts` | **新規** | 正規化 adapter + フィルタ + 件数集計の純関数群。`TagDefinitionItem` は **`tagCatalogLifecycle.ts` から `import type` で再利用**（二重定義禁止） |
| `apps/web/app/(admin)/admin/tag-master/page.tsx` | 編集 | `safeServerFetch` 結果を `normalizeTagDefinitionList` 通過させ、統合パネル（Lane C で導入する `TagDefinitionPanel`）へ渡す |
| `apps/web/src/components/admin/__tests__/tagDefinitionView.spec.ts` | **新規** | 純関数の防御正規化・フィルタ・件数の網羅テスト |

> `apps/web/app/(admin)/admin/tag-master/page.tsx` の panel 差替（`TagMasterPanel` → `TagDefinitionPanel`）本体は Lane C と同期（same-wave）。本 Lane では「正規化通過させた normalized view を props で渡す」配線契約を確定する。

---

## 3. 型二重定義の一本化決定（Phase 3 残課題の確定）

`TagDefinitionItem`（`{ tagId, code, label, category, active }`）は `apps/web/src/components/admin/tagCatalogLifecycle.ts:5` に既存。**lifecycle 側を正本とし、`tagDefinitionView.ts` では再定義せず `import type` で再利用する**（phase-3 §2 の二重定義回避を本 Lane で確定）。

理由: lifecycle の `applyLifecycleSuccess` / `visibleLifecycleOperations` が同型を消費しており、view 側で別定義すると lifecycle 戻り値と structural には一致しても nominal 文書上は二重管理になる。`import type` 再利用で SSOT を 1 つに保つ。

```ts
// tagDefinitionView.ts 冒頭
import type { TagDefinitionItem } from "./tagCatalogLifecycle";
export type { TagDefinitionItem }; // 統合パネル / page が view 経由で参照できるよう re-export
```

> 旧 `TagCatalogPanel.tsx:20` の `TagCatalogListView`（`{ total; items: TagDefinitionItem[] }`）は本 Lane の `TagDefinitionListView` に置換される（panel ごと Lane C で吸収）。

---

## 4. 関数・型シグネチャ / 構造（tagDefinitionView.ts）

```ts
import type { TagDefinitionItem } from "./tagCatalogLifecycle";
export type { TagDefinitionItem };

// 統合パネルが消費する正規化済み view（items は必ず配列）
export interface TagDefinitionListView {
  readonly total: number;
  readonly items: TagDefinitionItem[];
}

// API 生レスポンス（防御対象。全フィールド unknown 扱い）
export interface RawTagListResponse {
  readonly total?: unknown;
  readonly items?: unknown;
}

export function normalizeTagDefinitionList(
  raw: RawTagListResponse | null | undefined,
): TagDefinitionListView;

export function filterTagDefinitions(
  items: readonly TagDefinitionItem[],
  opts: { readonly query: string; readonly showInactive: boolean },
): TagDefinitionItem[];

export function countTagDefinitions(
  items: readonly TagDefinitionItem[],
): { readonly active: number; readonly inactive: number; readonly total: number };
```

### 4.1 `normalizeTagDefinitionList` 防御ロジック（疑似コード）

```
function normalizeTagDefinitionList(raw):
  if raw is null/undefined → return { total: 0, items: [] }
  rawItems = raw.items
  if rawItems is not Array → items = []          // null / "x" / {} / undefined を全て [] へ
  else:
    items = rawItems
      .filter(it => it is non-null object)
      .map(it => normalizeItem(it))               // 各 item を safe-coerce
  total =
    typeof raw.total === "number" && Number.isFinite(raw.total) && raw.total >= 0
      ? raw.total
      : items.length                              // total 非数/負/欠落 → items.length
  return { total, items }

function normalizeItem(it):                        // 各フィールド safe-coerce
  return {
    tagId:    coerceString(it.tagId),
    code:     coerceString(it.code),
    label:    coerceString(it.label),
    category: coerceString(it.category),
    active:   coerceBool(it.active),               // 真偽値以外は API rowBody が boolean を返す前提で Boolean(it.active)
  }

coerceString(v) = typeof v === "string" ? v : ""   // 例外を投げない（WEEKGRD-02）
coerceBool(v)   = typeof v === "boolean" ? v : Boolean(v)
```

> **クラッシュ class 根絶**: panel の `useState(initial.items)` に渡る値は必ず `normalizeTagDefinitionList` 通過後の配列。`reduce` は `countTagDefinitions` 内に閉じ込め、入力が常に配列であることを型と正規化で保証する。

### 4.2 `filterTagDefinitions`（純関数）

```
function filterTagDefinitions(items, { query, showInactive }):
  base = showInactive ? items : items.filter(it => it.active)   // 既定 showInactive=false → active のみ（Q2）
  q = query.trim().toLowerCase()
  if q === "" → return [...base]
  return base.filter(it =>
    [it.code, it.label, it.category].some(v => v.toLowerCase().includes(q))
  )                                                              // code/label/category 部分一致（既存 TagMasterPanel:20-26 踏襲）
```

### 4.3 `countTagDefinitions`（純関数・reduce 隔離点）

```
function countTagDefinitions(items):
  // reduce はここに閉じる。入力は正規化済み配列ゆえ undefined 不可。
  return items.reduce(
    (acc, it) => {
      if (it.active) acc.active += 1
      else acc.inactive += 1
      acc.total += 1
      return acc
    },
    { active: 0, inactive: 0, total: 0 }
  )
```

> 件数チップ（有効 N / 停止中 M / 全体 T）は **常に全 items（フィルタ前）**から算出する（チップは状態の全体像を示すため）。フィルタ後件数とは別。

---

## 5. 入力・出力・副作用・エラーハンドリング

| 関数 | 入力 | 出力 | 副作用 | エラー |
|------|------|------|--------|--------|
| `normalizeTagDefinitionList` | 生レスポンス（null 許容） | `TagDefinitionListView`（items 必ず配列） | なし（純関数） | **投げない**（無効値を安全値へ畳む） |
| `filterTagDefinitions` | items + opts | フィルタ済み配列 | なし | 投げない |
| `countTagDefinitions` | items | `{active,inactive,total}` | なし | 投げない |

- すべて純関数。fetch・router・DOM・グローバル状態に触れない。
- 例外を一切投げない（防御正規化の責務はクラッシュを発生させないこと自体）。

### 5.1 server page（tag-master/page.tsx）配線

Before（現状・TagMasterPanel に items を直接渡す）:

```tsx
const result = await safeServerFetch<AdminTagsPageResponse>("/admin/tags?page=1&pageSize=100");
// ...
{result.ok ? (
  <TagMasterPanel
    initialTags={result.data.items ?? []}
    total={result.data.total ?? result.data.items?.length ?? 0}
  />
) : ( ... )}
```

After（normalize 通過 → Lane C の `TagDefinitionPanel` へ渡す）:

```tsx
import { normalizeTagDefinitionList } from "../../../../src/components/admin/tagDefinitionView";
import { TagDefinitionPanel } from "../../../../src/components/admin/TagDefinitionPanel"; // Lane C 導入
// AdminTagsPageResponse 型は撤去 or RawTagListResponse 互換に置換
// ...
{result.ok ? (
  <TagDefinitionPanel initial={normalizeTagDefinitionList(result.data)} query="" />
) : (
  <AdminSectionErrorClient ... />
)}
```

- `eyebrow` / `title` / `description` / `breadcrumbs` の文言は Lane C の IA 整理（「タグ定義」）に同期。
- `safeServerFetch` の型引数は `RawTagListResponse`（unknown 許容）にし、`result.data` を normalize に通す。`result.ok=false` 経路は既存 `AdminSectionErrorClient` を維持（本 Lane で挙動変更なし）。

---

## 6. テスト方針

新規 `apps/web/src/components/admin/__tests__/tagDefinitionView.spec.ts`（純関数のみ・DOM 不要）。

### `normalizeTagDefinitionList`（falsy 網羅）

| ケース | 入力 | 期待 |
|--------|------|------|
| N-1 | `undefined` | `{ total: 0, items: [] }` |
| N-2 | `null` | `{ total: 0, items: [] }` |
| N-3 | `{}` | `{ total: 0, items: [] }`（items 欠落） |
| N-4 | `{ items: null }` | `{ total: 0, items: [] }` |
| N-5 | `{ items: "x" }` | `{ total: 0, items: [] }`（非配列） |
| N-6 | `{ items: [{ tagId:"t1", code:"vip", label:"VIP", category:"membership", active:true }] }` | `total: 1`・items 1 件・各フィールド保持・`active===true` |
| N-7 | `{ total: 7, items: [...1件...] }` | `total: 7`（明示数値優先・items.length と乖離可） |
| N-8 | `{ total: "x", items: [...1件...] }` | `total: 1`（非数 → items.length） |
| N-9 | `{ items: [null, {tagId:"t2",...}] }` | null item を除外し 1 件 |

### `filterTagDefinitions`

| ケース | 期待 |
|--------|------|
| F-1 showInactive=false | active のみ返す（停止中を除外） |
| F-2 showInactive=true | active + inactive 両方 |
| F-3 query="vip"（code 一致） | 部分一致行のみ |
| F-4 query="" | base 全件（trim 後空） |
| F-5 query 大文字 "VIP" | 小文字化照合でヒット |

### `countTagDefinitions`

| ケース | 期待 |
|--------|------|
| C-1 空配列 | `{active:0, inactive:0, total:0}`（**reduce が空でも安全**＝クラッシュ class 根絶の回帰 guard） |
| C-2 active 2 / inactive 1 | `{active:2, inactive:1, total:3}` |

> **TDD RED 期待値**: 純関数未実装段階では import が解決せず spec が fail（RED）。実装後 GREEN。
> **操作対象**: 純関数のため internal state なし。入力 → 出力の値検証のみ（VSCPKR-03 = external 観測点）。`window`/`vi.stubGlobal` 不要。

---

## 7. ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root . \
  apps/web/src/components/admin/__tests__/tagDefinitionView.spec.ts
mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts            # 本 Lane は CSS 無変更だが横断 gate
git -C apps/api diff --stat                       # 空であること（AC-13）
```

> vitest は repo root が root のため **フルパス指定**（`--root .` + `apps/web/src/...`）。相対実行だと "No test files" になる（_shared-context verify_commands 準拠）。

---

## 8. DoD（Definition of Done）

- [x] `tagDefinitionView.ts` が `normalizeTagDefinitionList` / `filterTagDefinitions` / `countTagDefinitions` を export し、`TagDefinitionItem` を `tagCatalogLifecycle.ts` から `import type` 再利用（二重定義 0）。
- [x] `tagDefinitionView.spec.ts` の N-1〜N-9 / F-1〜F-5 / C-1〜C-2 が GREEN（特に C-1 空配列・N-1/N-2/N-4/N-5 の防御）。
- [x] `tag-master/page.tsx` が `safeServerFetch` 結果を `normalizeTagDefinitionList` 通過させ `TagDefinitionPanel` へ渡す（Lane C と same-wave）。
- [x] `pnpm typecheck` / `pnpm lint` green。
- [x] `git -C apps/api diff --stat` 空（AC-13）。
- [x] `reduce` 呼び出しが `countTagDefinitions` 内のみ（`grep -rn "\.reduce(" apps/web/src/components/admin/` で panel 側に残存しないこと＝クラッシュ class 根絶証跡）。
