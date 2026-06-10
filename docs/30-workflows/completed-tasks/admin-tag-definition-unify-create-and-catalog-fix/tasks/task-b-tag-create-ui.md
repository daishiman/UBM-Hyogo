# [実装区分: 実装仕様書] — Task B: 新規タグ作成 UI + 配線

> 正本: [`../_shared-context.md`](../_shared-context.md) / [`../phase-2-design.md`](../phase-2-design.md)（§4）。
> 本書は **Lane B**（`createTag()` web api fn ＋作成フォーム）の実装仕様。
> コード実装は本サイクルで local 完了。commit・PR・push は行わない。

---

## 1. 目的 / AC 対応

既存 `POST /api/admin/tags`（proxy 経由・transport 配線済み）のみを消費する **新規タグ作成 UI** を提供し、管理者がタグを増やせない根本欠落（_shared-context §3.3）を解消する。新 endpoint・API 変更は一切行わない。

| AC | 対応 |
|----|------|
| **AC-3** | 作成導線で `code` / `label`(表示名) / `category` を入力して作成 |
| **AC-4** | 既存 `POST /api/admin/tags` のみ消費（新 endpoint 0）。成功時 `onCreated(item)` で親へ通知（一覧 prepend + 選択は Lane C） |
| **AC-5** | `tag_code_conflict`（409）時にフォーム内 `role="alert"` で重複メッセージ表示。一覧を壊さない |
| **AC-6** | `code` は `^[a-z0-9][a-z0-9_]{0,63}$` をクライアント側で送信前検証。`label`/`category` 必須 |

> 本 Lane は A と独立に着手可。C が作成フォームを統合パネルに組み込む。

---

## 2. 変更対象ファイル一覧

| パス | 種別 | 内容 |
|------|------|------|
| `apps/web/src/features/admin/api/tags.ts` | 編集 | `createTag()` を **`updateTag()` と並置**して export（FB-SDK-07-4 命名一貫）。実体は既存 `members.ts` の `createTag` を再利用しつつ、戻り値を `active` 含む `TagDefinitionItem` 形へ adapt |
| `apps/web/src/components/admin/TagDefinitionCreateForm.tsx` | **新規** | FormField 経由の作成フォーム（client）。`useAdminMutation` + クライアント検証 + 409 表示 |
| `apps/web/src/features/admin/api/__tests__/tags.create.spec.ts` | **新規** | `createTag()`（201/409/401/400/非JSON）の web api fn テスト |
| `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx` | **新規** | 作成フォームを統合パネル経由で検証（検証・409 handling・作成反映） |

---

## 3. 既存資産の重複回避（実コード裏取り）

`apps/web/src/features/admin/api/members.ts:244` に **既に `createTag()` が存在**（issue-1068・spec `members.tagCreate.spec.ts` で green）:

```ts
// members.ts:244（既存）
export async function createTag(input: { code; label; category }): Promise<AdminTagRef>
//   201 → AdminTagRef（active を **落とす** 4 項目）
//   !ok → TagCreateError(status, parseTagErrorCode(bodyText), bodyText)
//   AdminTagCreateErrorCode = "tag_code_conflict" | "invalid_body" | "invalid_json"
//   ※ 401 を AuthRequiredError へ分岐していない（現状は TagCreateError(code:null) に落ちる）
```

統合パネル（Lane C）は `active` を含む `TagDefinitionItem` を正本にするため、**`tags.ts` 側に `createTag` を置き直し、戻り値を `active: true` 込みの `TagDefinitionItem` にする**。重複定義を避けるため、内部 fetch ロジックは `members.ts` の既存実装を再利用する。

### 方針（二択のうち採用＝再エクスポート + adapt）

`tags.ts` で既存 `createTag`（members）を import し、`active` を補完した `TagDefinitionItem` を返す薄い wrapper を `createTag` として公開する。`TagCreateError` / `AdminTagCreateInput` / `parseTagErrorCode` も `tags.ts` から再 export し、フォーム側 import 経路を `features/admin/api/tags` に一本化する（`updateTag` と同居・SRP）。

```ts
// tags.ts 追加（既存 updateTag と並置）
import {
  createTag as createTagRaw,
  TagCreateError,
  parseTagErrorCode,
  type AdminTagCreateErrorCode,
} from "./members";
import type { TagDefinitionItem } from "../../../components/admin/tagCatalogLifecycle";

export { TagCreateError, parseTagErrorCode };
export type { AdminTagCreateErrorCode };

export type AdminTagCreateInput = {
  readonly code: string;
  readonly label: string;
  readonly category: string;
};

/**
 * POST /api/admin/tags（既存 proxy）。201 で active を含む TagDefinitionItem を返す。
 * 内部 fetch / error 分類は members.ts の createTag を再利用（重複実装しない）。
 * 作成直後は常に active: true（API rowBody は active を返すが、members 版が落とすため補完）。
 */
export async function createTag(
  input: AdminTagCreateInput,
): Promise<TagDefinitionItem> {
  const ref = await createTagRaw(input);            // AdminTagRef（active 無）
  return { ...ref, active: true };                   // TagDefinitionItem へ昇格
}
```

> **401 fail-closed（不変条件 #11 整合）**: 本サイクルで `members.ts` の `createTag` に `res.status === 401` → `AuthRequiredError` 分岐を追加し、`tags.ts` の `createTag` も同じ fail-closed 契約に揃えた。`members.tagCreate.spec.ts` と `tags.create.spec.ts` の 401 ケースで回帰固定済み。

> phase-2-design §4 の `AdminTagCreateErrorCode` には `"invalid_json"` が含まれる。既存 members 版 `AdminTagCreateErrorCode = "tag_code_conflict" | "invalid_body" | "invalid_json"` と一致。新規 enum を増やさない。

---

## 4. `TagDefinitionCreateForm.tsx` 構造（新規）

```tsx
"use client";
import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { useAdminMutation } from "../../features/admin/hooks/useAdminMutation";
import {
  createTag,
  TagCreateError,
  type AdminTagCreateInput,
} from "../../features/admin/api/tags";
import type { TagDefinitionItem } from "./tagCatalogLifecycle";

const CODE_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/;   // API CODE_RE と一致（AC-6）

export interface TagDefinitionCreateFormProps {
  readonly onCreated: (item: TagDefinitionItem) => void;
  readonly onCancel?: () => void;
}

export function TagDefinitionCreateForm({ onCreated, onCancel }: TagDefinitionCreateFormProps) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useAdminMutation<TagDefinitionItem>("/api/admin/tags", "POST", {
    mutationFn: (payload) => createTag(payload as AdminTagCreateInput),
    onSuccess: (item) => {
      setFormError(null);
      onCreated(item);           // 親（Lane C）が prepend + select
      setCode(""); setLabel(""); setCategory("");   // reset（成功経路）
    },
    onError: (error) => {
      if (error instanceof TagCreateError && error.code === "tag_code_conflict") {
        setFormError("同じコードのタグが既にあります。別のコードを指定してください。");
        return;
      }
      setFormError(error.message);   // AuthRequiredError は上位 boundary で処理
    },
    successMessage: "タグを作成しました",
  });

  const validate = (): string | null => {
    if (!CODE_PATTERN.test(code.trim())) return "コードは英小文字・数字・_ の64文字以内で入力してください。";
    if (label.trim().length === 0) return "表示名を入力してください。";
    if (category.trim().length === 0) return "カテゴリを入力してください。";
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const v = validate();
    if (v) { setFormError(v); return; }   // 送信前に弾く＝fetch 未発火（AC-6）
    setFormError(null);
    try {
      await mutation.trigger({ code: code.trim(), label: label.trim(), category: category.trim() });
    } catch {
      // useAdminMutation の onError が処理済み。event handler の unhandled rejection 抑止。
    }
  };
  // ... FormField × 3（code/label/category）+ formError role="alert" + 作成/キャンセル Button
}
```

### 4.1 入力・出力・副作用・エラーハンドリング

| 項目 | 内容 |
|------|------|
| 入力 | `code` / `label` / `category`（内部 state） |
| 出力 | `onCreated(TagDefinitionItem)`（成功時のみ） |
| 副作用 | `POST /api/admin/tags`（mutation）。成功で state reset |
| クライアント検証 | `CODE_PATTERN` 違反 / label・category 空 → 送信前に弾き fetch 未発火 |
| 409 | `TagCreateError.code === "tag_code_conflict"` → `role="alert"` メッセージ。`onCreated` 未呼出・一覧不変（AC-5） |
| 401 | `AuthRequiredError`（tags.ts createTag が分岐）→ 上位 error boundary（握り潰さない） |
| ロック解放 | mutation の成功/失敗/キャンセル全経路で `finally` 相当（`useAdminMutation` 内部で `isLoading` 解放）。フォーム側は try/catch で event handler rejection のみ抑止 |

- input は **必ず `FormField` 経由**（不変条件 #5）。`apps/web/src/components/admin/` 配下で直接 `<input>` を増やさない。
- mutation は `@/features/admin/hooks/useAdminMutation`（不変条件 #6）。

---

## 5. テスト方針

### `apps/web/src/features/admin/api/__tests__/tags.create.spec.ts`（新規）

`fetch` を `Object.defineProperty(globalThis, "fetch", ...)` または `vi.fn()` 割当でモック（既存 `members.tagCreate.spec.ts` 踏襲）。

| ケース | 入力/モック | 期待 |
|--------|-----------|------|
| C-B-1 201 成功 | 201 + `{tagId,code,label,category,active:true}` | `createTag` が `{...,active:true}` の `TagDefinitionItem` を返す。fetch URL === `/api/admin/tags`・method POST |
| C-B-2 201 active 欠落 | 201 + active なし body | 戻り値 `active === true`（補完） |
| C-B-3 409 `tag_code_conflict` | 409 `{ok:false,error:"tag_code_conflict"}` | `TagCreateError` throw・`error.code === "tag_code_conflict"`・status 409 |
| C-B-4 401 | 401 | `AuthRequiredError` throw（fail-closed） |
| C-B-5 400 `invalid_body` | 400 `{ok:false,error:"invalid_body"}` | `TagCreateError(code:"invalid_body", status:400)` |
| C-B-6 非 JSON body | 500 + 壊れた text | `TagCreateError(code:null)`・`bodyText` 非空（情報欠損なし） |

### `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx`（作成フォーム検証）

`@testing-library/react` で統合パネルを render し、作成導線内の `TagDefinitionCreateForm` を DOM / prop 観測で検証する。単体 spec は重複を避けて作成しない。

| ケース | 操作 | 期待（**external prop / DOM 観測**・VSCPKR-03） |
|--------|------|------|
| C-B-7 重複 409 表示 | createTag が `TagCreateError(tag_code_conflict)` reject | `role="alert"` に「同じコードのタグが既にあります。…」表示。`onCreated` 未呼出 |
| C-B-8 code パターン違反 | code="VIP"（大文字）で submit | `createTag` 未呼出（送信前検証）。検証メッセージ表示 |
| C-B-9 先頭 `_` 違反 | code="_x" で submit | `createTag` 未呼出 |
| C-B-10 65 文字超過 | code = 65 文字 | `createTag` 未呼出 |
| C-B-11 label 空 | label="" で submit | 必須メッセージ・`createTag` 未呼出 |
| C-B-12 成功 → onCreated | 正常 submit で createTag が item を返す | `onCreated` が返り item で呼ばれ、入力が reset される |

> **internal vs external（VSCPKR-03）**: 検証は `onCreated` mock 呼出有無・`role="alert"` DOM・`createTag` mock 呼出有無（external 観測点）で行う。内部 `useState` を直接覗かない。
> **window モック**: 本フォームは `window` 依存なし。API fn テストで fetch を差すときは `Object.defineProperty(globalThis,"fetch",{configurable:true,value:vi.fn()})` を使い、**`vi.stubGlobal("window")` は使わない**（VSCPKR-02）。
> **TDD RED**: 新規ファイル未実装段階では import 解決失敗で RED → 実装後 GREEN。

---

## 6. ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root . \
  apps/web/src/features/admin/api/__tests__/tags.create.spec.ts \
  apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx \
  apps/web/src/features/admin/api/__tests__/members.tagCreate.spec.ts   # 401 追加の回帰確認
mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts
git -C apps/api diff --stat            # 空（AC-13）
```

---

## 7. DoD（Definition of Done）

- [x] `features/admin/api/tags.ts` が `createTag(input): Promise<TagDefinitionItem>` を `updateTag` と並置 export。戻り値に `active: true` 補完。`TagCreateError` / `AdminTagCreateInput` を同ファイルから参照可能。
- [x] `members.ts` の `createTag` が 401 → `AuthRequiredError` 分岐（`members.tagCreate.spec.ts` に 401 ケース追加で回帰固定）。新規 endpoint 追加 0。
- [x] `TagDefinitionCreateForm.tsx` が FormField 経由 3 入力・`useAdminMutation`・`CODE_PATTERN` クライアント検証・409 `role="alert"` 表示・`onCreated` 通知を実装。
- [x] `tags.create.spec.ts`（C-B-1〜6）/ `TagDefinitionPanel.component.spec.tsx`（C-B-7〜12 を統合パネル経由で検証）GREEN。
- [x] `pnpm typecheck` / `pnpm lint` green・`git -C apps/api diff --stat` 空。
