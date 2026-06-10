# Phase 2 — 設計

> 正本: [`_shared-context.md`](./_shared-context.md) / [`phase-1-requirements.md`](./phase-1-requirements.md)。

## 1. トポロジ（統合後のデータ・責務フロー）

```
Server: /admin/tag-master/page.tsx
  └─ safeServerFetch<RawTagListView>("/admin/tags?page=1&pageSize=100")
       └─ normalizeTagDefinitionList(result.ok ? result.data : null)   // tagDefinitionView.ts (純関数・防御正規化)
            → { total: number; items: TagDefinitionItem[] }            // items は必ず配列（?? []）
  └─ <TagDefinitionPanel initial={normalized} query=... />             // client

Client: TagDefinitionPanel (state owner)
  ├─ filter state: showInactive (既定 false → 有効のみ)・searchText・selectedId
  ├─ items state: TagDefinitionItem[]（作成/編集/lifecycle で更新）
  ├─ 左: タグ一覧（状態バッジ・検索・件数チップ・停止中トグル）
  ├─ 右: 詳細
  │    ├─ 未選択 & 作成モード → <TagDefinitionCreateForm onCreated=... />
  │    ├─ 選択中 → 編集フォーム（既存 TagMasterEditForm 相当）＋ lifecycle 操作
  │    └─ lifecycle: tagCatalogLifecycle.ts の descriptor / applyLifecycleSuccess を再利用
  └─ ConfirmDialog（完全削除 destructive 確認）

API（変更しない）: GET/POST/PATCH/DELETE /admin/tags（rowBody は active を返す）
```

## 2. 既存コンポーネント再利用可否（FB-SDK-07-1）

| 必要機能 | 再利用元 | 判断 |
|---------|---------|------|
| 編集フォーム | `TagMasterEditForm`（PATCH + 楽観 expectedCode） | **再利用**（作成分岐 `if(!tag)` を活かして作成対応へ拡張、または作成は別 `TagDefinitionCreateForm` に分離） |
| lifecycle 操作 | `tagCatalogLifecycle.ts`（descriptor/apply/parse） | **そのまま再利用**（新規実装しない） |
| lifecycle row | `TagCatalogRow` | 再利用 or 一覧行へ吸収（Phase 8 で判断） |
| primitives | Button/Card/Chip/Input/FormField/EmptyState/ConfirmDialog | 再利用 |
| mutation | `useAdminMutation` | 再利用 |

> 新規 UI は **統合シェル（`TagDefinitionPanel`）と作成フォーム**のみ。lifecycle / edit / primitives はすべて既存資産を流用し、新規実装面積を最小化する。

## 3. データ adapter 設計（Lane A 中核）

### `apps/web/src/components/admin/tagDefinitionView.ts`（新規・純関数）

```ts
// 統合パネルが消費する正本型（active を含む）
export interface TagDefinitionItem {
  readonly tagId: string;
  readonly code: string;
  readonly label: string;
  readonly category: string;
  readonly active: boolean;
}

export interface TagDefinitionListView {
  readonly total: number;
  readonly items: TagDefinitionItem[];
}

// API 生レスポンス（防御対象。フィールドは optional 扱い）
export interface RawTagListResponse {
  readonly total?: unknown;
  readonly items?: unknown;
}

// 防御正規化: items 欠落/null/非配列 → []、total 非数 → items.length or 0。
// 各 item も tagId/code/label/category を string、active を boolean に safe-coerce。
export function normalizeTagDefinitionList(
  raw: RawTagListResponse | null | undefined,
): TagDefinitionListView;

// 一覧フィルタ（純関数）: showInactive=false なら active のみ、検索は code/label/category 部分一致。
export function filterTagDefinitions(
  items: readonly TagDefinitionItem[],
  opts: { readonly query: string; readonly showInactive: boolean },
): TagDefinitionItem[];

// 件数集計（純関数。reduce はここに閉じ込め、null 安全）。
export function countTagDefinitions(
  items: readonly TagDefinitionItem[],
): { readonly active: number; readonly inactive: number; readonly total: number };
```

> **クラッシュ根絶ポイント**: `reduce` は `countTagDefinitions` 内に閉じ、入力は常に正規化済み配列。panel 側で `useState(initial.items)` する値も `normalizeTagDefinitionList` 通過後ゆえ undefined にならない。
> **WEEKGRD-02 準拠**: 正規化は「例外を投げず無効値を安全値へ畳む」防御戦略。

## 4. 作成フロー設計（Lane B）

### web api fn（`features/admin/api/tags.ts` 追加）

```ts
export type AdminTagCreateInput = {
  readonly code: string;
  readonly label: string;
  readonly category: string;
};
export type AdminTagCreateErrorCode = "tag_code_conflict" | "invalid_body" | "invalid_json";
export class TagCreateError extends Error {
  readonly status: number;
  readonly code: AdminTagCreateErrorCode | null;
  readonly bodyText: string;
}
// POST /api/admin/tags（既存 proxy）。201 で AdminTagRef & {active} を返す。
export async function createTag(input: AdminTagCreateInput): Promise<TagDefinitionItem>;
```

- 409 → `TagCreateError(code: "tag_code_conflict")`。401 → `AuthRequiredError`（既存パターン踏襲）。
- 戻り値は `active: true` を含む `TagDefinitionItem`（作成直後は有効）。API rowBody は active を返す。欠落時は `active: true` をデフォルト。

### `TagDefinitionCreateForm.tsx`（新規）

- FormField 経由の `code` / `label` / `category` 3 入力（不変条件 #5）。
- クライアント検証: `CODE_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/`、label/category 非空。
- `useAdminMutation` で送信。成功 → `onCreated(item)` で親へ通知（一覧 prepend + 選択）。
- 409 → フォーム内 `role="alert"` で「同じコードのタグが既にあります。別のコードを指定してください。」。

## 5. state ownership（FB STATE-DETAIL / W1-02b-2 ステップ間 state テーブル）

| state | 所有者 | 初期値 | 更新契機 |
|-------|-------|--------|---------|
| `items` | `TagDefinitionPanel` | `initial.items`（正規化済み） | 作成(prepend) / 編集(map) / lifecycle(`applyLifecycleSuccess`) |
| `selectedId` | `TagDefinitionPanel` | `null`（既定は作成導線を促す or 先頭） | 行クリック / 作成成功 |
| `mode` | `TagDefinitionPanel` | `"idle"` | `"create"`（新規ボタン）/`"edit"`（行選択） |
| `showInactive` | `TagDefinitionPanel` | `false`（Q2 既定有効のみ） | トグル |
| `searchText` | `TagDefinitionPanel` | `query` prop | 入力 |
| 作成フォーム入力 | `TagDefinitionCreateForm`（内部 state） | 空 | 入力。作成成功 or キャンセルで reset |
| 編集フォーム入力 | edit form（内部 state） | 選択タグ値 | `useEffect([tag])` で選択変更時に再同期（FB STATE-DETAIL-03） |

> ロック変数（mutation isLoading）の解放は成功/失敗/キャンセル全経路で `finally` を唯一の出口に（FB-STATE-DETAIL-003）。

## 6. nav / redirect 設計（Lane C）

### shell-config.ts
- `ShellNavItemId` union から `"tag-catalog"` を**除去**。`"tag-master" | "tag-queue"` は残す。
- `buildAdminGroup` の items から `tag-catalog` エントリを削除。`tag-master` の `label` を `"タグ管理"` → **`"タグ定義"`** に変更（href `/admin/tag-master` は維持）。
- `tag-queue`（`/admin/tags`・ラベル「タグキュー」）は不変。
- icon resolver（shell の icon マップ）に `tag-catalog` 参照が残る場合は same-wave で除去。`isNavItemActive` の `/admin/tags` 特例は維持（タグキューが catalog で誤 active にならないガード。redirect 後 catalog URL は踏まれないが安全側で残す）。

### catalog redirect
- `apps/web/app/(admin)/admin/tags/catalog/page.tsx` を Next.js `redirect("/admin/tag-master")`（`next/navigation`）に置換。`export const dynamic = "force-dynamic"` は維持 or 不要なら除去。query（`q` 等）は引き継がない（統合先で再検索）。

## 7. 統合パネル UI レイアウト（Lane C）

```
[タグ定義管理]  eyebrow: ADMIN / TAG DEFINITION
 toolbar(Card):
   [検索 input]  [+ 新規タグ作成 Button(primary)]
   chip-row: 有効 N件 / 停止中 M件 / 全体 T件
   toggle: 停止中も表示（既定 OFF）
 grid:
   左(Card): タグ一覧（visibleTags = filterTagDefinitions(items, {query,showInactive})）
     行: label / <code> · category / 状態 Chip（有効=green / 停止中=stone）
     空: EmptyState「該当するタグはありません」
   右(Card):
     mode=create → TagDefinitionCreateForm
     mode=edit & selected → 編集フォーム + lifecycle 操作群（visibleLifecycleOperations）
     mode=idle → 「左の一覧から選択、または『新規タグ作成』」
 ConfirmDialog: 完全削除（destructive・使用中は referenceCount 表示）
```

- CSS: `.tag-definition-*`（globals.css）。既存 `.tag-master-*` / `.tag-catalog-*` を統合/改名し、tokens 経由色のみ。新規 HEX 0。
- アクセシビリティ: 一覧 `aria-pressed`、状態 Chip に文言、トグル `role` 明示、`data-testid="admin-tag-definition-list"`。

## 8. 設計判断（why this way）

| 判断 | 理由 |
|------|------|
| `/admin/tag-master` を canonical に再利用 | 新 route 新設より churn・テスト移行コスト最小。nav href 不変で active 判定既存ロジック流用 |
| catalog は redirect（route 削除しない） | 既存ブックマーク / 外部リンク / nav 履歴の 404 回避。redirect は薄く安全 |
| 作成を別 `TagDefinitionCreateForm` に分離 | 編集フォームの楽観 expectedCode ロジックと作成の責務を混在させない（SRP・FB-SDK-07-2 surface 明確化） |
| `reduce` を純関数に隔離 | クラッシュ class 根絶 + 単体テスト容易化。panel から防御ロジックを排除 |
| タグキュー非統合 | AI 提案レビューは別ドメイン（状態機械・enqueue/resolve）。混ぜると責務境界崩壊 |

## 9. 因果ループ（システム観点）

- **バランスループ（解決）**: 作成 UI 追加 → タグ定義が増える → 一覧・件数が機能 → 「どこで作るか不明」混乱が減少。
- **強化ループ（リスク）**: 統合で旧パネル削除 → 旧 import / テスト残存 → CI 赤 → 手戻り。→ Phase 9 で grep 証跡化により遮断。
