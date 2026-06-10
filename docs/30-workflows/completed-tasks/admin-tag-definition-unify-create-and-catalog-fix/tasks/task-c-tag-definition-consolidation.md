# [実装区分: 実装仕様書] — Task C: IA 統合（統合パネル + nav + redirect + 視覚整理）

> 正本: [`../_shared-context.md`](../_shared-context.md) / [`../phase-2-design.md`](../phase-2-design.md)（§5/§6/§7）。
> 本書は **Lane C**（`TagDefinitionPanel` 統合 + nav 整理 + catalog redirect + CSS 統合 + 旧 panel 吸収）の実装仕様。
> A（データ層）/ B（作成 UI）の surface を統合する。コード実装は本サイクルで local 完了。commit・PR・push は行わない。

---

## 1. 目的 / AC 対応

`タグ管理`(編集) と `タグカタログ`(lifecycle) の 2 画面分裂を 1 画面「タグ定義管理」に統合し、作成（Lane B）・編集（既存 `TagMasterEditForm` 相当）・有効化/停止/完全削除（`tagCatalogLifecycle.ts` 再利用）を集約する。nav を 2 本（タグ定義 / タグキュー）に整理し、旧 catalog route をリダイレクトする。

| AC | 対応 |
|----|------|
| **AC-7** | nav admin グループの tag 関連を `タグ定義`(`/admin/tag-master`) / `タグキュー`(`/admin/tags`) の 2 本に整理。`タグカタログ` エントリ除去 |
| **AC-8** | `/admin/tags/catalog` → `/admin/tag-master` redirect |
| **AC-9** | 統合画面で作成・編集・有効化・停止・完全削除がすべて行える |
| **AC-10** | 既定表示は有効タグのみ。「停止中も表示」トグルで停止中含む。有効/停止/全体 件数チップ表示 |
| **AC-11** | タグキュー（`/admin/tags` TagQueuePanel）の挙動・ラベル不変 |
| **AC-12** | `.tag-definition-*` は `var(--ubm-*)` 経由のみ。HEX 0 |

> 依存: A（list view 正規化）+ B（`createTag` / 作成フォーム）の surface 確定後に統合。

---

## 2. 変更対象ファイル一覧

| パス | 種別 | 内容 |
|------|------|------|
| `apps/web/src/components/admin/TagDefinitionPanel.tsx` | **新規** | 統合パネル（client・state owner）。A のフィルタ/件数、B の作成フォーム、編集、lifecycle を統合 |
| `apps/web/src/components/shell/shell-config.ts` | 編集 | `ShellNavItemId` union から `"tag-catalog"` 除去・`tag-master` ラベル「タグ管理」→「タグ定義」 |
| `apps/web/src/components/shell/icons.tsx` | 編集 | `PATHS` map から `"tag-catalog"` キー除去（union 整合・same-wave） |
| `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | 編集 | `redirect("/admin/tag-master")` 化 |
| `apps/web/app/(admin)/admin/tag-master/page.tsx` | 編集 | （Lane A と same-wave）`TagDefinitionPanel` 描画・eyebrow/title/breadcrumb を「タグ定義」へ。AdminPageHeader 文言更新 |
| `apps/web/src/styles/globals.css` | 編集 | `.tag-definition-*` 統合スタイル（既存 `.tag-master-*`/`.tag-catalog-*` を統合・tokens 準拠・HEX 0） |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 編集 | nav assertion 更新（tag-catalog 期待除去・「タグ定義」・item 数 12→11） |
| `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx` | **新規** | 統合パネル（一覧/作成/編集/lifecycle/停止中トグル/件数チップ） |
| `apps/web/app/(admin)/admin/tag-master/page.spec.tsx` | 新規 or 更新 | server page → 統合パネル受け渡し・防御正規化 |

### 削除（統合に吸収。live import 0 を grep 証跡化＝Phase 8/9）

| パス | 種別 | 吸収先 |
|------|------|--------|
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | **削除** | `TagDefinitionPanel` へ吸収 |
| `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | **削除** | `TagDefinitionPanel` へ吸収 |
| `apps/web/src/components/admin/__tests__/TagCatalogPanel.component.spec.tsx` | **削除** | 統合パネル spec へ移行（describe.skip 残存禁止・FB-TASK-01/02） |
| `apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx` | **削除** | 同上 |

> **再利用（削除しない）**: `tagCatalogLifecycle.ts`（lifecycle 純関数）/ `TagCatalogRow.tsx`（行 UI・統合一覧で再利用 or 吸収。Phase 8 で最終判断、本仕様の既定は **TagCatalogRow を一覧行として再利用**）/ `TagMasterEditForm.tsx`（編集フォームとして再利用）。

---

## 3. `TagDefinitionPanel.tsx` 構造（新規・state owner）

### 3.1 props / state ownership（phase-2-design §5）

```ts
import type { TagDefinitionListView, TagDefinitionItem } from "./tagDefinitionView";

export interface TagDefinitionPanelProps {
  readonly initial: TagDefinitionListView;   // Lane A の normalizeTagDefinitionList 通過済み（items 必ず配列）
  readonly query: string;
}
```

| state | 所有者 | 初期値 | 更新契機 |
|-------|-------|--------|---------|
| `items` | Panel | `initial.items`（正規化済み） | 作成(prepend) / 編集(map) / lifecycle(`applyLifecycleSuccess`) |
| `selectedId` | Panel | `null` | 行クリック / 作成成功（作成 item を選択） |
| `mode` | Panel | `"idle"` | `"create"`（新規ボタン）/ `"edit"`（行選択） |
| `showInactive` | Panel | `false`（Q2 既定有効のみ） | トグル |
| `searchText` | Panel | `query` prop | 検索入力 |
| `errors` | Panel | `{}` | lifecycle 失敗時 `parseTagLifecycleError` |
| `pending` | Panel | `null` | physical-delete 確認待ち（ConfirmDialog） |
| 作成フォーム入力 | `TagDefinitionCreateForm`（内部） | 空 | Lane B が所有 |
| 編集フォーム入力 | `TagMasterEditForm`（内部 + `useEffect([tag])` 再同期） | 選択タグ値 | 既存実装 |

### 3.2 派生値（A の純関数を使用）

```ts
import { filterTagDefinitions, countTagDefinitions } from "./tagDefinitionView";
import {
  applyLifecycleSuccess, parseTagLifecycleError,
  TAG_LIFECYCLE_DESCRIPTORS, visibleLifecycleOperations,
} from "./tagCatalogLifecycle";

const counts = countTagDefinitions(items);                                // 全 items（フィルタ前）で件数チップ
const visibleTags = filterTagDefinitions(items, { query: searchText, showInactive });
```

> **reduce はパネルに書かない**（A の `countTagDefinitions` に隔離）。クラッシュ class 根絶。

### 3.3 レイアウト（phase-2-design §7）

```
<section className="tag-definition-panel" aria-label="タグ定義管理">
  toolbar (Card):
    検索 Input（aria-label="タグ検索"）  [+ 新規タグ作成 Button variant=primary（mode="create" に切替）]
    chip-row: <Chip tone="green">有効 {counts.active}件</Chip>
             <Chip tone="stone">停止中 {counts.inactive}件</Chip>
             <Chip tone="warm">全体 {counts.total}件</Chip>
    toggle: 停止中も表示（checkbox・既定 OFF・role/aria 明示）
  grid (.tag-definition-grid):
    左 (Card, data-testid="admin-tag-definition-list"):
      visibleTags が空 → <EmptyState title="該当するタグはありません" />
      else → 一覧行（TagCatalogRow 再利用 or 行 button）:
        label / <code>code</code> · category / 状態 Chip（有効=green / 停止中=stone）
        行 click → setSelectedId(tag.tagId) + mode="edit"
        lifecycle 操作ボタン（visibleLifecycleOperations(tag)）
    右 (Card):
      mode==="create" → <TagDefinitionCreateForm onCreated={handleCreated} onCancel={...} />
      mode==="edit" && selected → <TagMasterEditForm tag={selected} onSaved={handleSaved} /> + lifecycle 操作群
      mode==="idle" → 「左の一覧から選択、または『新規タグ作成』」案内
  <ConfirmDialog ... />  // physical-delete 確認（既存 TagCatalogPanel:217-233 ロジック移植）
</section>
```

### 3.4 ハンドラ（既存ロジック移植・新規ロジックを生やさない）

| ハンドラ | 由来 | 動作 |
|---------|------|------|
| `handleCreated(item)` | 新規 | `setItems(prev => [item, ...prev])`・`setSelectedId(item.tagId)`・`setMode("edit")`（AC-4 即時反映+選択） |
| `handleSaved(updated)` | TagMasterPanel:30 移植 | `setItems(map で置換)`・`setSelectedId(updated.tagId)` |
| `runOperation(target)` | TagCatalogPanel:91-126 移植 | lifecycle mutation → `applyLifecycleSuccess` で items 更新・失敗は `parseTagLifecycleError`。**`finally` で busy/pending 解放を唯一の出口に**（FB-STATE-DETAIL-003） |
| toggle showInactive | 新規 | `setShowInactive(v => !v)` |

> 編集フォームは `TagMasterEditForm`（`AdminTagRef` を受ける）。`TagDefinitionItem` から `active` を落とした 4 項目を渡せば型整合（`AdminTagRef` は active 無）。lifecycle 操作には `TagDefinitionItem`（active 有）を使う。1 行で両型を扱うため、一覧行は `TagDefinitionItem` を保持し、編集フォームへは `{tagId,code,label,category}` を渡す。

---

## 4. nav 整理（shell-config.ts / icons.tsx）

### 4.1 shell-config.ts

`ShellNavItemId` union（:9-25）から `"tag-catalog"` を除去:

Before:
```ts
  | "tag-master"
  | "tag-queue"
  | "tag-catalog"
```
After:
```ts
  | "tag-master"
  | "tag-queue"
```

`buildAdminGroup`（:84-91）の items 編集:

Before:
```ts
      { id: "tag-master", href: "/admin/tag-master", label: "タグ管理", icon: "tag-master" },
      { id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" },
      {
        id: "tag-catalog",
        href: "/admin/tags/catalog",
        label: "タグカタログ",
        icon: "tag-catalog",
      },
```
After:
```ts
      { id: "tag-master", href: "/admin/tag-master", label: "タグ定義", icon: "tag-master" },
      { id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" },
```

- `isNavItemActive`（:137）の `/admin/tags` 完全一致特例は **維持**（タグキューが他 `/admin/tags/*` で誤 active にならないガード。安全側）。

### 4.2 icons.tsx

`PATHS: Record<ShellNavItemId, string>`（:25-46）から `"tag-catalog": "M4 5h16..."`（:38）の行を**削除**。union から除いた以上、Record の網羅性で typecheck が要求するため same-wave 必須（残すと未使用キーで型エラー・Feedback 6 型 navigation 3 点更新漏れ防止）。

---

## 5. catalog redirect（tags/catalog/page.tsx）

Before（safeServerFetch + TagCatalogPanel 描画・60 行）→ After（redirect のみ）:

```tsx
import { redirect } from "next/navigation";

export default function AdminTagCatalogPage() {
  redirect("/admin/tag-master");
}
```

- `safeServerFetch` / `TagCatalogPanel` / `AdminPageHeader` import を全除去（TagCatalogPanel 削除と整合）。
- `export const dynamic` は不要（redirect は静的に解決）→ 除去。
- query（`q` 等）は引き継がない（統合先で再検索・phase-2-design §6）。

---

## 6. tag-master/page.tsx（Lane A と same-wave）

`AdminPageHeader` 文言を IA 整理に合わせ更新:

```tsx
<AdminPageHeader
  eyebrow="ADMIN / TAG DEFINITION"
  title="タグ定義管理"
  description="タグの作成・編集・有効化・停止・完全削除を 1 画面で管理します。"
  breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "タグ定義" }]}
/>
<TagDefinitionPanel initial={normalizeTagDefinitionList(result.data)} query="" />
```

---

## 7. CSS 統合（globals.css）

- 新規 `.tag-definition-panel` / `.tag-definition-grid` / `.tag-definition-toolbar` / `.tag-definition-list` / `.tag-definition-item` / `.tag-definition-card` 等を定義。
- 既存 `.tag-master-*` / `.tag-catalog-*` のレイアウト・色を統合して移植。**色は `var(--ubm-*)` トークン経由のみ**。新規 HEX 直書き 0（`verify-design-tokens` PASS・AC-12）。
- `TagMasterEditForm` が参照する `.tag-master-card` / `.tag-master-error` / `.tag-master-actions` 等のクラスは編集フォーム再利用のため **残置**（または `.tag-definition-*` へ rename しフォーム側 className も same-wave 更新。既定は churn 最小で残置）。
- 状態 Chip・トグルの配色は既存 tone（green/stone/warm）primitive に委譲し、CSS 側で HEX を持たない。

> 削除する `.tag-catalog-pager` 等、redirect で不要化したクラスは残存しても無害だが、live セレクタ参照 0 を確認の上で除去推奨（Phase 9 で grep）。

---

## 8. テスト方針

### `TagDefinitionPanel.component.spec.tsx`（新規・@testing-library/react）

`createTag` / lifecycle mutation を `vi.mock`。`useRouter` は `next/navigation` を mock。

| ケース | 操作 | 期待（external DOM / prop 観測・VSCPKR-03） |
|--------|------|------|
| P-1 既定有効のみ | active 2 / inactive 1 の initial | 一覧に active 2 行のみ。件数チップ「有効 2件 / 停止中 1件 / 全体 3件」 |
| P-2 停止中トグル ON | toggle click | inactive 行も表示（3 行） |
| P-3 0 件 | initial.items=[] | EmptyState「該当するタグはありません」・クラッシュなし（AC-1 回帰 guard） |
| P-4 作成導線 | 「新規タグ作成」click | 右パネルに作成フォーム（mode=create） |
| P-5 作成成功反映 | createTag が item を返す | 一覧 prepend・作成 item 選択・mode=edit（AC-4） |
| P-6 検索 | searchText="vip" | code/label/category 部分一致行のみ |
| P-7 lifecycle deactivate | 行の「しまう」 | `applyLifecycleSuccess` で active→false・状態 Chip 切替 |
| P-8 physical-delete 確認 | 「完全削除」click | ConfirmDialog 表示。確定で行除去。使用中 409 は `parseTagLifecycleError` で referenceCount メッセージ（回帰 guard） |

> **internal vs external（VSCPKR-03）**: トグル/検索/作成は DOM 操作 → 表示行数・チップ文言・mock 呼出で検証。内部 `useState` を直接覗かない。
> **window モック（VSCPKR-02）**: 本パネルは `window` 直接依存なし。`useRouter` は module mock。`vi.stubGlobal("window")` 禁止。必要時は `Object.defineProperty(window, ...)`。

### `shell-config.spec.ts`（更新）

Before（既存・:24-50 抜粋）の更新点:

| 既存 assertion | 更新後 |
|----------------|--------|
| `expect(admin?.items).toHaveLength(12)` | `toHaveLength(11)`（tag-catalog 除去で 1 減） |
| `expect(...map(i=>i.id)).toContain("tag-catalog")` | **削除**。代わりに `.not.toContain("tag-catalog")` を追加 |
| `tag-master` label `"タグ管理"` | `"タグ定義"` |
| `tag-catalog` の href/label をチェックする it（:36-43） | **削除**（describe.skip にしない・FB-TASK-01/02） |
| `isNavItemActive("/admin/tags","/admin/tag-master")===false` | 維持（特例不変の回帰 guard） |

### `tag-master/page.spec.tsx`（新規 or 更新）

| ケース | 期待 |
|--------|------|
| PG-1 ok:true 正常 | `TagDefinitionPanel` に `normalizeTagDefinitionList` 通過済み initial が渡る |
| PG-2 items 欠落レスポンス | 防御正規化で空配列・クラッシュなし（AC-2 回帰 guard） |
| PG-3 ok:false | `AdminSectionErrorClient` 描画（既存挙動維持） |

> catalog redirect の検証（`redirect` 呼出）は Phase 6（`phase-6-test-additions.md` T-6）で `next/navigation` の `redirect` mock により確認する。

---

## 9. ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root . \
  apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/app/\(admin\)/admin/tag-master/page.spec.tsx
mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts                 # HEX 0（AC-12）
git -C apps/api diff --stat                            # 空（AC-13）

# 旧 panel live import 0 証跡（テストファイル除く）
grep -rn "TagCatalogPanel\|TagMasterPanel" apps/web/src apps/web/app --include="*.ts" --include="*.tsx" | grep -v "__tests__"
```

---

## 10. DoD（Definition of Done）

- [x] `TagDefinitionPanel.tsx` が A のフィルタ/件数 + B の作成フォーム + `TagMasterEditForm` 編集 + `tagCatalogLifecycle` lifecycle を統合。`reduce` をパネルに書かない（A の `countTagDefinitions` 隔離）。
- [x] nav admin グループが `タグ定義`(`/admin/tag-master`) / `タグキュー`(`/admin/tags`) の 2 本。`tag-catalog` が union / icons.tsx / nav / spec から **完全除去**（typecheck green = Record 網羅整合）。
- [x] `/admin/tags/catalog` が `/admin/tag-master` へ redirect（`TagCatalogPanel` import 0）。
- [x] `globals.css` の `.tag-definition-*` が tokens 経由色のみ・新規 HEX 0（`verify-design-tokens` PASS）。
- [x] 旧 `TagCatalogPanel.tsx` / `TagMasterPanel.tsx` + それぞれの spec を削除し、live import 0 を grep 証跡化（describe.skip 残存 0）。
- [x] `TagDefinitionPanel.component.spec.tsx`（P-1〜8）/ `shell-config.spec.ts`（更新）/ `tag-master/page.spec.tsx`（PG-1〜3）GREEN。
- [x] タグキュー（`/admin/tags`）非接触（`git diff` に `tags/page.tsx` / `TagQueuePanel` が出ない・AC-11）。
- [x] `pnpm typecheck` / `pnpm lint` green・`git -C apps/api diff --stat` 空。
