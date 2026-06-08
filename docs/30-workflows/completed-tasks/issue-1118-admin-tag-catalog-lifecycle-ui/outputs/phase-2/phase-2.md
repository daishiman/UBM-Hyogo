# Phase 2: 設計

`[実装区分: 実装仕様書]` / status: `implemented_local_evidence_captured`

## 2.0 automation-30 実装同期 SSOT（2026-06-06）

本 Phase の計画は実コードに反映済み。実装上の正本は次の通り:

- lifecycle 操作名は実装コードでは `reactivate | deactivate | physical-delete`。仕様上の `logical_delete` は実装の `deactivate` と同義。
- mutation endpoint は admin proxy 経由の `/api/admin/tags/...` を使用する。
- `parseTagLifecycleError` は `FetchAuthedError.bodyText` を読み、`error === "tag_has_references"` のときだけ `referenceCount` を行 inline 文言へ変換する。body 非 JSON の 409 は `http_409` の generic error とし、汎用 parser として誤分類しない。
- `/admin/tags/catalog` では `ShellNavItemId = "tag-catalog"` を追加し、`/admin/tags` nav active と衝突しないよう `isNavItemActive("/admin/tags", "/admin/tags/catalog") === false` を regression test で固定した。

本 Phase は後続の全 Phase（4-13）と SubAgent が参照する**契約の正本（SSOT）**である。route・component 境界・関数シグネチャ・state machine・3 操作の区別ルール・409 adapter をここで固定する。

## 2.1 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 関心事 | 再利用するか | 再利用先（実在確認済み） |
|--------|--------------|--------------------------|
| page header / breadcrumb | 再利用 | `AdminPageHeader`（`src/features/admin/components/_layout/AdminPageHeader.tsx`） |
| section error 表示 | 再利用 | `AdminSectionErrorClient`（`src/features/admin/components/_shared/AdminSectionErrorClient.tsx`） |
| server-side 初期 fetch | 再利用 | `safeServerFetch<T>`（`src/lib/admin/safe-server-fetch.ts`） |
| mutation（POST/DELETE） | 再利用 | `useAdminMutation`（`src/features/admin/hooks/useAdminMutation.ts`） |
| 不可逆確認ダイアログ | 再利用 | `ConfirmDialog`（`src/components/ui/ConfirmDialog.tsx`・`isDestructive` prop あり） |
| status badge CSS | 既存規約踏襲 | `.admin-tag-status-badge[data-status]`（globals.css L1124）に倣い `.admin-tag-catalog-*` を additive 追加 |

新規 primitive は生やさない。新規作成は page / panel / row / pure helper の 4 ファイルのみ。

## 2.2 ファイルトポロジ（新規作成 4 / 編集 2）

| パス | 種別 | 責務 | 状態所有 |
|------|------|------|----------|
| `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | 新規 | Server Component。`safeServerFetch<TagCatalogListView>("/admin/tags")` で初期 list。`AdminPageHeader` + 成功時 `TagCatalogPanel` / 失敗時 `AdminSectionErrorClient` | なし（server） |
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | 新規 | Client Component。list state・検索/filter（active/inactive/all）・行操作の orchestration・409 referenceCount/404 の panel-level state・`ConfirmDialog`（physical delete）の open 制御 | UI state owner |
| `apps/web/src/components/admin/TagCatalogRow.tsx` | 新規 | 1 tag 行の presentational + 3 lifecycle 操作ボタン（active/inactive で出し分け）。操作要求は親へ callback で委譲（mutation は持たない） | presentational |
| `apps/web/src/components/admin/tagCatalogLifecycle.ts` | 新規 | pure module。operation descriptor（label/style/method/endpoint）・409 body parse・active/inactive status label。副作用なし | なし（pure） |
| `apps/web/src/styles/globals.css` | 編集 | `.admin-tag-catalog-*` class を additive 追加（OKLch token のみ） | — |
| `apps/web/src/components/shell/shell-config.ts` | 編集 | admin nav 配列（L82 `{ id: "tag-queue", href: "/admin/tags", label: "タグキュー", ... }` の直後）に `/admin/tags/catalog`（「タグカタログ」）導線を additive 追加 | — |

> nav 定義ファイルの実パスは `apps/web/src/components/shell/shell-config.ts`（admin group 配列・L82 に `tag-queue` エントリ実在）に確定済み。`/admin/tags/catalog` へ到達できる導線追加が要件（AC-0 の到達性）。

## 2.3 型定義（TypeScript）

```typescript
// tagCatalogLifecycle.ts — pure module（副作用なし）

/** GET /admin/tags の list item（apps/api rowBody と 1:1） */
export interface TagCatalogItem {
  readonly tagId: string;
  readonly code: string;
  readonly label: string;
  readonly category: string;
  readonly active: boolean;
}

/** GET /admin/tags response（page.tsx の safeServerFetch<T> の T） */
export interface TagCatalogListView {
  readonly total: number;
  readonly items: readonly TagCatalogItem[];
}

/** 3 lifecycle 操作の種別 */
export type TagLifecycleOp = "reactivate" | "logical_delete" | "physical_delete";

/** 操作ごとの宣言的記述子（視覚的・文言的区別の SSOT・AC-4） */
export interface TagLifecycleDescriptor {
  readonly op: TagLifecycleOp;
  readonly method: "POST" | "DELETE";
  /** endpoint テンプレート（:tagId は呼び出し側で置換） */
  readonly endpoint: (tagId: string) => string;
  readonly buttonLabel: string;      // 例 "棚に戻す" / "棚にしまう" / "完全に削除"
  readonly intent: "neutral" | "caution" | "destructive"; // data-intent に反映
  readonly requiresConfirm: boolean; // physical_delete のみ true
  readonly confirmTitle?: string;
  readonly confirmDescription?: string; // "元に戻せません" を明示（physical のみ）
}

/** 409 tag_has_references の body（useAdminMutation の error.bodyText を parse） */
export interface TagReferenceBlock {
  readonly kind: "tag_has_references inline error";
  readonly referenceCount: number;
}
export interface TagNotFound { readonly kind: "not_found"; }
export type TagLifecycleError = TagReferenceBlock | TagNotFound | { readonly kind: "other"; readonly message: string };

/** 操作記述子を返す（active 状態で出し分けは呼び出し側） */
export function lifecycleDescriptor(op: TagLifecycleOp): TagLifecycleDescriptor;

/** active 状態でその行に出す操作の一覧（AC-4 出し分けルールの SSOT） */
export function availableOps(active: boolean): readonly TagLifecycleOp[];
//   active===true  -> ["logical_delete", "physical_delete"]
//   active===false -> ["reactivate", "physical_delete"]

/** active -> "有効" / inactive -> "停止中" の status label（badge 文言） */
export function statusLabel(active: boolean): string;

/** useAdminMutation の error（FetchAuthedError: status + bodyText）を UI state へ変換 */
export function parseTagLifecycleError(error: Error): { code: string; message: string; referenceCount?: number };
//   FetchAuthedError + body.error==="tag_has_references" -> "N人に使用中のため削除不可"
//   FetchAuthedError + body.error==="tag_not_found"      -> "対象タグが見つかりません。画面を更新してください。"
//   body 非 JSON / unknown 409                          -> generic error（誤って referenceCount 扱いしない）
```

### descriptor の確定値（3 操作の視覚的・文言的区別・AC-4 SSOT）

| op | method | endpoint | buttonLabel | intent | requiresConfirm | 出現条件 |
|----|--------|----------|-------------|--------|-----------------|----------|
| `reactivate` | POST | `/admin/tags/{tagId}/reactivate` | 「棚に戻す（再有効化）」 | `neutral` | false | active=false の行のみ |
| `logical_delete` | DELETE | `/admin/tags/{tagId}` | 「棚にしまう（停止）」 | `caution` | false | active=true の行のみ |
| `physical_delete` | DELETE | `/admin/tags/{tagId}/physical` | 「完全に削除（元に戻せない）」 | `destructive` | true | 全行（主に停止中の棚卸し） |

- 文言区別: 「棚に戻す」「棚にしまう」「完全に削除」で 3 語を明確に分離。
- 視覚区別: `data-intent="neutral|caution|destructive"` を button に付与し、CSS で色を分ける（destructive のみ danger token）。physical のみ ConfirmDialog（`isDestructive`）。

## 2.4 状態機械（TagCatalogPanel）

ロック変数の解放経路（正常/エラー/キャンセル）を明示（[Feedback STATE-DETAIL-01]）。

```
状態: idle
  -> reactivate ボタン: submitting(reactivate) へ
  -> logical_delete ボタン: submitting(logical) へ（軽い confirm 経由可）
  -> physical_delete ボタン: confirm_pending(physical) へ（ConfirmDialog open）

confirm_pending(physical)
  -> ConfirmDialog onCancel: idle へ（mutation 呼ばない・AC-2）
  -> ConfirmDialog onConfirm: submitting(physical) へ

submitting(op)  // useAdminMutation.trigger 実行中
  -> 成功(200/204): success -> 一覧 refresh（router.refresh） -> idle
  -> 409 tag_has_references: 当該行に「N人に使用中のため削除不可」表示（AC-3）。idle 操作可
  -> 404 tag_not_found: not_found(tagId) -> 「既に削除済みです」表示（AC-7）。一覧 refresh
  -> その他 error: error -> useAdminMutation の toast（既存）+ 行 inline メッセージ
```

- 冪等（AC-6）: reactivate が既に active な tag に対して 200 + 現 row を返すケースは success として扱い、エラーバナーを出さない。`useAdminMutation` の POST overload で `treat404AsSuccess` は使わない（404 は明示表示する）。
- ロック解放: `useAdminMutation` の `isLoading`/`finally` が submitting を解放。panel 側の per-row `pendingTagId` ref は成功・エラー・キャンセルの全経路で null に戻す。

### per-row vs panel state 引き渡し（[Feedback W1-02b-2] state ownership）

| state | 所有 | 引き渡し |
|-------|------|----------|
| list items（初期） | page.tsx（server fetch）→ panel に `initial` prop | panel が `items` を保持 |
| 検索/filter（active/inactive/all） | panel（internal `useState` または URL params） | row へは表示済み items を渡す |
| pendingTagId / 操作中 | panel（`useState`） | row へ `disabled`/`pending` を prop で渡す |
| confirm dialog open + 対象 tag | panel（`useState`） | `ConfirmDialog` に props で制御（presentational） |
| 行ごとの 409/404 結果 | panel（`Map<tagId, TagLifecycleError>` 等） | row へ該当 error を prop で渡す |

row は internal state を持たず、操作は `onOp(op, item)` callback で親へ委譲する（テスト容易性・SRP）。

## 2.5 mutation 配線（useAdminMutation overload）

- `physical_delete` / `logical_delete` は DELETE → **idempotent overload**（retry 許可）。
- `reactivate` は POST → **非冪等 overload**（retry 禁止・サーバ側で冪等なので UI retry 不要）。
- 409 referenceCount の取得: `useAdminMutation.trigger` は `!res.ok` で `FetchAuthedError(status, bodyText)` を throw する。panel は `catch` でこの error を受け、`parseTagLifecycleError(error)` で `tag_has_references` / `tag_not_found` / generic error を分類して行 state に格納する。
  - 注意: `useAdminMutation` は既定で error を toast する。409/404 を「サーバーエラー」汎用 toast で潰さないため、physical delete の mutation option では `successMessage` を設定しつつ、panel 側で error.status を見て 409/404 のときは inline 表示を主とする（toast は補助）。実装時に `FetchAuthedError` の `status`/`bodyText` 公開有無を確認し、必要なら panel が自前 `fetch` で 409 body を読む fallback を取る（どちらでも contract は同じ）。

## 2.6 アクセシビリティ / レスポンシブ（AC-8）

- ConfirmDialog は既存実装が `role="dialog"` `aria-modal` `aria-labelledby/describedby` を持つ（再利用）。
- 409 referenceCount メッセージは `role="status"`（または FormField error 相当の `role="alert"`）で読み上げ可能にする。
- 行操作ボタンは aria-label に tag label を含める（「タグ『懇親会』を完全に削除」等）。
- desktop: 一覧 table/grid + 行末に操作。mobile: 行を縦積みにし操作ボタンが重ならない（既存 admin パネルの responsive 規約に倣う）。

## 2.7 design token（AC-9）

- 既存 `--status-success-bg` / `--status-neutral-bg` / `--status-danger-bg` / `--ubm-color-danger` 等を使用。
- `.admin-tag-catalog-badge[data-status="active"]` → success token、`[data-status="inactive"]` → neutral token。
- `.admin-tag-catalog-op[data-intent="destructive"]` → danger token。HEX・`bg-[#xxx]` 直書き禁止。

## 2.8 完了条件（Phase 2）

- route / 4 新規ファイル境界 / 型・関数シグネチャ / descriptor 確定値 / state machine / 409 adapter / token 方針が固定された。
- 後続 Phase・SubAgent はこの SSOT を逸脱しない。
