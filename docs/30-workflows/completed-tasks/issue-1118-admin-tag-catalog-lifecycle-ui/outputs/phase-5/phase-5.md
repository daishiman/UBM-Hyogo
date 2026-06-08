# Phase 5: 実装

`[実装区分: 実装仕様書]` / status: `completed`

Phase 4 のテストを Green に転じ、Phase 2 の設計 SSOT を apps/web へ反映した。**D1 直アクセスなし（#5）・mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10）・色は OKLch token のみ（AC-9）**。

## 5.0 実装済み差分（automation-30）

- 新規: `apps/web/app/(admin)/admin/tags/catalog/page.tsx`
- 新規: `apps/web/src/components/admin/{TagCatalogPanel.tsx,TagCatalogRow.tsx,tagCatalogLifecycle.ts}`
- 新規 tests: `apps/web/src/components/admin/__tests__/{TagCatalogPanel.component.spec.tsx,TagCatalogRow.component.spec.tsx,tagCatalogLifecycle.spec.ts}`
- 編集: `apps/web/src/components/shell/{shell-config.ts,icons.tsx}` と shell regression specs
- 編集: `apps/web/src/styles/globals.css`
- local evidence: focused Vitest component/pure/nav suite PASS、`@ubm-hyogo/web` typecheck PASS

## 5.1 変更ファイル一覧（[Feedback RT-03] 必須）

### 新規作成（4 ファイル）

| # | パス | 種別 | 責務 |
|---|------|------|------|
| N-1 | `apps/web/src/components/admin/tagCatalogLifecycle.ts` | pure module | 型・descriptor・availableOps・statusLabel・parseTagLifecycleError |
| N-2 | `apps/web/src/components/admin/TagCatalogRow.tsx` | Client（presentational） | 1 行 + 3 操作ボタン出し分け + inline error。state なし |
| N-3 | `apps/web/src/components/admin/TagCatalogPanel.tsx` | Client | list/filter/state machine/409・404/ConfirmDialog 制御。mutation 配線 |
| N-4 | `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | Server Component | 初期 list の `safeServerFetch` + 成功/失敗分岐 |

### 修正（2 ファイル）

| # | パス | 変更内容 |
|---|------|----------|
| E-1 | `apps/web/src/styles/globals.css` | `.admin-tag-catalog-*` class を **additive** 追加（OKLch token のみ） |
| E-2 | `apps/web/src/components/shell/shell-config.ts` | admin nav の `tag-queue` 項目の直後に `/admin/tags/catalog`（「タグカタログ」）を additive 追加 |

> **nav 実パスは確定済み**: 調査の結果、admin sidebar nav は `apps/web/src/components/shell/shell-config.ts`（L74-92 の admin group 配列）に定義される。Phase 2 §2.2 注記の「実装時 rg で確定」は本ファイルに確定。実装冒頭で `rg -n "tag-queue|/admin/tags" apps/web/src/components/shell/shell-config.ts` で現物の挿入位置を再確認する。

### テスト（Phase 4 で作成済み・本 Phase で Green 化）

`apps/web/src/components/admin/__tests__/{tagCatalogLifecycle.spec.ts, TagCatalogPanel.component.spec.tsx, TagCatalogRow.component.spec.tsx}`

## 5.2 N-1 `tagCatalogLifecycle.ts`（pure・先に実装）

state machine の語彙を全てここに固定する。副作用なし・import は型のみ。

実装方針（関数本体）:

```typescript
// 型は Phase 2 §2.3 の定義をそのまま export する（TagCatalogItem / TagCatalogListView /
// TagLifecycleOp / TagLifecycleDescriptor / TagLifecycleError 等）。

const DESCRIPTORS: Record<TagLifecycleOp, TagLifecycleDescriptor> = {
  reactivate: {
    op: "reactivate", method: "POST",
    endpoint: (id) => `/admin/tags/${id}/reactivate`,
    buttonLabel: "棚に戻す（再有効化）", intent: "neutral", requiresConfirm: false,
  },
  logical_delete: {
    op: "logical_delete", method: "DELETE",
    endpoint: (id) => `/admin/tags/${id}`,
    buttonLabel: "棚にしまう（停止）", intent: "caution", requiresConfirm: false,
  },
  physical_delete: {
    op: "physical_delete", method: "DELETE",
    endpoint: (id) => `/admin/tags/${id}/physical`,
    buttonLabel: "完全に削除（元に戻せない）", intent: "destructive", requiresConfirm: true,
    confirmTitle: "タグを完全に削除しますか？",
    confirmDescription: "この操作は元に戻せません。マスタから物理削除されます。",
  },
};

export function lifecycleDescriptor(op: TagLifecycleOp): TagLifecycleDescriptor {
  return DESCRIPTORS[op];
}

export function availableOps(active: boolean): readonly TagLifecycleOp[] {
  // 呼び出しごとに新規配列を返す（L-12 の mutate 不能要件）。
  return active ? ["logical_delete", "physical_delete"] : ["reactivate", "physical_delete"];
}

export function statusLabel(active: boolean): string {
  return active ? "有効" : "停止中";
}

export function parseTagLifecycleError(error: Error): { code: string; message: string; referenceCount?: number } {
  const body = safeJson(bodyText); // try/catch JSON.parse → {} on fail
  if (error instanceof FetchAuthedError && body.error === "tag_has_references") {
    const n = typeof body.referenceCount === "number" ? body.referenceCount : 0;
    return { code: "tag_has_references", message: `${n}人に使用中のため削除不可`, referenceCount: n };
  }
  if (error instanceof FetchAuthedError && body.error === "tag_not_found") {
    return { code: "tag_not_found", message: "対象タグが見つかりません。画面を更新してください。" };
  }
  return { code: "unknown", message: "タグ操作に失敗しました。" };
}
```

- `safeJson` は `try { JSON.parse(bodyText) } catch { return {} }`。body が壊れた 409 は `http_409` / generic error とし、`tag_has_references` へ誤分類しない。
- 文言は本ファイルが SSOT。Phase 4 の L-1..L-11 に一致させる。

## 5.3 N-2 `TagCatalogRow.tsx`（presentational・state なし）

prop 駆動。mutation を持たず `onOp(op, item)` で親へ委譲する。

props:

```typescript
interface TagCatalogRowProps {
  readonly item: TagCatalogItem;
  readonly pending: boolean;                       // 操作中（panel の pendingTagId === item.tagId）
  readonly error: TagLifecycleError | null;        // 行ごとの 409/404 結果
  readonly onOp: (op: TagLifecycleOp, item: TagCatalogItem) => void;
}
```

実装手順:
1. `availableOps(item.active)` で表示する操作配列を取得。
2. 各 op について `lifecycleDescriptor(op)` で `buttonLabel` / `intent` / を引く。`<button type="button" data-intent={d.intent} disabled={pending} aria-label={`タグ「${item.label}」を${d.buttonLabel}`} onClick={() => onOp(op, item)}>{d.buttonLabel}</button>`。
3. status badge: `<span className="admin-tag-catalog-badge" data-status={item.active ? "active" : "inactive"}>{statusLabel(item.active)}</span>`。
4. inline error: physical delete 409 `tag_has_references` のとき `role="alert"` で「N人に使用中のため削除不可」を表示する。`tag_not_found` は「対象タグが見つかりません。画面を更新してください。」、その他は generic message。
5. 行要素は `<tr>`（table 設計）または grid `<div role="row">`。Phase 4 R-5 の wrap 形に合わせる（table 推奨）。`label` / `code` / `category` を列で表示。

> **row は mutation も router も import しない**（純 presentational・テスト容易性・SRP）。

## 5.4 N-3 `TagCatalogPanel.tsx`（Client・state machine の中核）

state（Phase 2 §2.4 の owner）:

```typescript
const [items, setItems] = useState(initial.items);            // server fetch 由来。filter は派生
const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
const [pendingTagId, setPendingTagId] = useState<string | null>(null);
const [rowErrors, setRowErrors] = useState<Map<string, TagLifecycleError>>(new Map());
const [confirmTarget, setConfirmTarget] = useState<TagCatalogItem | null>(null); // physical confirm 対象
const router = useRouter();
```

mutation 配線（[useAdminMutation overload の使い分け]）:

| op | method | overload | retry | 根拠 |
|----|--------|----------|-------|------|
| `reactivate` | POST | 非冪等 overload（`UseAdminMutationOptions`） | なし | POST。サーバ側で冪等だが UI retry 不要（Phase 2 §2.5） |
| `logical_delete` | DELETE | idempotent overload（`UseAdminMutationIdempotentOptions`） | 任意（既定オフ） | DELETE は冪等 |
| `physical_delete` | DELETE | idempotent overload | 任意（既定オフ） | DELETE は冪等 |

- 3 つの hook を panel 直下で宣言する（`useAdminMutation` は hook なので条件分岐内では呼べない。endpoint は `endpointOverride` で行ごとに差し替えるため、固定 endpoint + method の hook を op ごとに 1 つずつ用意し、`trigger(payload, descriptor.endpoint(tagId))` で行別 URL を渡す）。

  ```typescript
  const reactivateM = useAdminMutation("/admin/tags", "POST",   { refreshOnSuccess: false });
  const logicalM    = useAdminMutation("/admin/tags", "DELETE", { refreshOnSuccess: false });
  const physicalM   = useAdminMutation("/admin/tags", "DELETE", { refreshOnSuccess: false });
  ```
  `refreshOnSuccess:false` にして **panel が成功/失敗を判定してから明示的に `router.refresh()`** を呼ぶ（404 は refresh するが 409 は refresh しない、を panel が制御するため）。

### 操作ハンドラ（state machine 実装）

```typescript
async function handleOp(op: TagLifecycleOp, target: TagCatalogItem) {
  if (pendingTagId) return;                          // 二重操作 guard（P-9 / R-8）
  const d = lifecycleDescriptor(op);
  if (d.requiresConfirm) { setConfirmTarget(target); return; } // physical → ConfirmDialog open（AC-2）
  await runMutation(op, target);
}

async function runMutation(op: TagLifecycleOp, target: TagCatalogItem) {
  const d = lifecycleDescriptor(op);
  const m = op === "reactivate" ? reactivateM : op === "logical_delete" ? logicalM : physicalM;
  setPendingTagId(target.tagId);
  setRowErrors((prev) => { const n = new Map(prev); n.delete(target.tagId); return n; }); // 旧 error クリア
  try {
    await m.trigger({}, d.endpoint(target.tagId));   // endpointOverride で行別 URL
    setConfirmTarget(null);
    router.refresh();                                // success → 一覧再取得
  } catch (e) {
    const err = e instanceof FetchAuthedError
      ? parseTagLifecycleError(e.status, e.bodyText)
      : await fallbackParse(e, op, target);          // §5.4.1 fallback
    setRowErrors((prev) => new Map(prev).set(target.tagId, err));
    setConfirmTarget(null);
    if (err.kind === "not_found") router.refresh();  // 404 は list 最新化（AC-7）
    // 409 tag_has_references inline error は refresh しない（行 inline 表示のみ・AC-3）
  } finally {
    setPendingTagId(null);                           // 正常/エラー/全経路で lock 解放
  }
}
```

### 5.4.1 409 body 取得の fallback（[Phase 2 §2.5]）

`useAdminMutation.trigger` は `!res.ok` で `FetchAuthedError(status, bodyText)` を throw する（`apps/web/src/lib/fetch/errors.ts` で確認済み・`status` / `bodyText` は public field）。よって **fallback は基本不要**で、`e instanceof FetchAuthedError` が真なら `parseTagLifecycleError(e.status, e.bodyText)` で 409 body から `referenceCount` を読める。

万一 `e` が `FetchAuthedError` でない（network error 等）場合のみ `fallbackParse` で `{ kind:"other", message:"通信に失敗しました" }` を返す。**panel 自前 fetch による 409 body 再読込は不要**（FetchAuthedError.bodyText に既に入っているため）。この判断を実装コメントに明記する。

### filter

- `filter` state（`all`/`active`/`inactive`）で `items` を派生表示（`visibleItems = items.filter(...)`）。filter ボタンは internal state 切替のみで router.push 不要（list は既に手元にある）。AC-8 の責務外なら URL 同期は将来課題にしない範囲で internal state に閉じる。

### ConfirmDialog（physical のみ・AC-2）

```tsx
<ConfirmDialog
  open={confirmTarget !== null}
  title={lifecycleDescriptor("physical_delete").confirmTitle!}
  description={lifecycleDescriptor("physical_delete").confirmDescription}  // 「元に戻せない」
  confirmLabel="完全に削除する"
  isDestructive
  submitting={pendingTagId !== null}
  onConfirm={() => confirmTarget && runMutation("physical_delete", confirmTarget)}
  onCancel={() => setConfirmTarget(null)}   // cancel → idle 復帰・mutation 呼ばない（AC-2）
/>
```

### render

- `<section role="region" aria-label="タグカタログ">` で wrap。filter ボタン群 + table（`TagCatalogRow` を map）。
- 空表示: `visibleItems.length === 0` のとき「タグがありません」。
- 各行に `pending={pendingTagId === item.tagId}` / `error={rowErrors.get(item.tagId) ?? null}` / `onOp={handleOp}` を渡す。

## 5.5 N-4 `page.tsx`（Server Component）

`apps/web/app/(admin)/admin/tags/page.tsx` を参照テンプレートとする。`safeServerFetch` は `Result`（`{ok:true,data}` / `{ok:false,error}`）を返す。

```tsx
import { safeServerFetch } from "../../../../../src/lib/admin/safe-server-fetch";
import { AdminSectionErrorClient } from "../../../../../src/features/admin/components/_shared";
import { AdminPageHeader } from "../../../../../src/features/admin/components/_layout/AdminPageHeader";
import { TagCatalogPanel } from "../../../../../src/components/admin/TagCatalogPanel";
import type { TagCatalogListView } from "../../../../../src/components/admin/tagCatalogLifecycle";

export const dynamic = "force-dynamic";

export default async function AdminTagCatalogPage() {
  const result = await safeServerFetch<TagCatalogListView>("/admin/tags");
  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="ADMIN / TAGS"
        title="タグカタログ"
        description="タグマスタを棚卸しし、再有効化・停止・完全削除を行います。"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "タグカタログ" }]}
      />
      {result.ok ? (
        <TagCatalogPanel initial={result.data} />
      ) : (
        <AdminSectionErrorClient sectionLabel="タグカタログ" code={result.error.code} message={result.error.message} />
      )}
    </section>
  );
}
```

> 相対パスの深さ（`../`）は `app/(admin)/admin/tags/catalog/page.tsx` の階層に合わせて確定する（既存 `tags/page.tsx` より 1 段深い）。`@/` alias が使えるなら alias を優先（既存ファイルの import 慣習に合わせる）。

## 5.6 E-1 `globals.css`（additive・OKLch token のみ）

既存 `.admin-tag-status-badge[data-status]`（L1124 近傍）の規約に倣い `.admin-tag-catalog-*` を additive 追加する。**HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止**（`verify-design-tokens` gate）。

```css
/* admin tag catalog（issue-1118 additive） */
.admin-tag-catalog-badge[data-status="active"]   { background: var(--status-success-bg); color: var(--status-success-fg); }
.admin-tag-catalog-badge[data-status="inactive"] { background: var(--status-neutral-bg); color: var(--status-neutral-fg); }
.admin-tag-catalog-op[data-intent="neutral"]     { /* neutral token */ }
.admin-tag-catalog-op[data-intent="caution"]     { /* caution/amber token */ }
.admin-tag-catalog-op[data-intent="destructive"] { color: var(--ubm-color-danger); border-color: var(--ubm-color-danger); }
.admin-tag-catalog-error { color: var(--ubm-color-danger); }
```

> 実 token 名は `apps/web/src/styles/tokens.css` の現物に合わせる（`--status-*` / `--ubm-color-danger` の有無を実装時に `rg` で確認。無ければ最も近い既存 OKLch token を採用）。

## 5.7 E-2 `shell-config.ts`（nav 導線・AC-0 到達性）

admin group 配列（L74-92）の `tag-queue` 項目直後に additive 追加:

```typescript
{ id: "tag-catalog", href: "/admin/tags/catalog", label: "タグカタログ", icon: "tag-queue" },
```

> `icon` は既存の `tag-queue` を再利用（新 icon を生やさない）。active 判定（L122-127）は `/admin/tags/catalog` を完全一致系で扱える既存ロジックに乗る（`/admin/tags` と前方一致衝突しないか確認。衝突するなら active 判定 helper の現物挙動に合わせる）。

## 5.8 不変条件チェック（実装完了の自己点検）

| 不変条件 | 充足方法 |
|----------|----------|
| #5 D1 直アクセス禁止 | page は `safeServerFetch`、panel は `useAdminMutation` のみ。D1 binding 参照なし |
| #9 FormField 経由 | 本画面に自由入力 form input はない（filter は button、confirm note も未使用）。新規 `<input>` を増やさない |
| #10 useAdminMutation 経由 | 3 mutation すべて `@/features/admin/hooks/useAdminMutation`。legacy `@/lib/useAdminMutation` を import しない |
| #8 test suffix | Phase 4 のテストは `*.spec.ts` / `*.component.spec.tsx` のみ |
| AC-9 OKLch token | `.admin-tag-catalog-*` は token 参照のみ。HEX 直書きなし |
| API 不変（#1） | endpoint は GET/reactivate/DELETE/DELETE physical の既存 4 つを消費のみ。新 endpoint・schema 変更なし |

## 5.9 検証コマンド（Phase 5 完了判定）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin   # Phase 4 が全 Green
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# design token gate（HEX 混入検知）
rg -n "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/styles/globals.css apps/web/src/components/admin/TagCatalog*.tsx || echo "no hex"
```
