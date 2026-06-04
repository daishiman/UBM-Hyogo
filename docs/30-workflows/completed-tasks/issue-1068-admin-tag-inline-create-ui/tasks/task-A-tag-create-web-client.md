# task-A: tag 作成 web API client（createTag / parseTagErrorCode）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

`apps/web/src/features/admin/api/members.ts` に tag master 作成の raw helper（`createTag`）と error code 型 / parser（`parseTagErrorCode`）を追加する。`apps/api` は変更しない（既存 `POST /admin/tags` を利用するのみ）。inline-create UI（task-B）の error code 検出基盤であり、AC-1 / AC-3 / AC-4 の基盤。**依存なし**（task-B/C より先に着手可能）。

> **実コード照合済み（2026-06-03、`origin/dev` = `17a18e1c2`）**: `POST /api/admin/tags` body `{ code, label, category }` → 201 `{ tagId, code, label, category, active }`。エラーは `{ ok:false, error:"<code>" }`（`tags.ts` の `fail(c, code)`）。code は 400 `invalid_json` / 400 `invalid_body` / 409 `tag_code_conflict`。出典 `apps/api/src/routes/admin/tags.ts:21-27,131-155`。

## 変更対象ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/api/members.ts` | 編集 | `AdminTagCreateErrorCode` 型 / `parseTagErrorCode` / `createTag` を追加 |
| `apps/web/src/features/admin/api/__tests__/members.tagCreate.spec.ts` | 新規 | `createTag` / `parseTagErrorCode` の unit spec（C-A-T1〜C-A-T3） |

## 追加する型 / 関数（signature）

```ts
// 既知の create error code（POST /admin/tags の fail() が返す code）
export type AdminTagCreateErrorCode =
  | "tag_code_conflict"
  | "invalid_body"
  | "invalid_json";

/**
 * FetchAuthedError.bodyText（{ ok:false, error:"<code>" } の JSON 文字列）から
 * 既知 create error code を取り出す。不正 JSON / 未知 code は null。
 */
export function parseTagErrorCode(bodyText: string): AdminTagCreateErrorCode | null;

/**
 * POST /api/admin/tags の raw helper。
 * 201 で AdminTagRef を返す。!res.ok 時は parseTagErrorCode で検出した code を
 * 載せた Error を throw する（テスト・非 hook 再利用向け）。
 * 実 mutation 発火は MemberTagInlineCreate（task-B）が useAdminMutation 経由で行うが、
 * error code 検出には parseTagErrorCode を共用する。
 */
export async function createTag(input: {
  code: string;
  label: string;
  category: string;
}): Promise<AdminTagRef>;
```

## 実装方針（仕様）

### `parseTagErrorCode(bodyText)`

1. `JSON.parse(bodyText)` を try/catch。parse 失敗（不正 JSON）→ `null`。
2. parse 結果の `.error` を取り出し、`AdminTagCreateErrorCode` の 3 値（`tag_code_conflict` / `invalid_body` / `invalid_json`）のいずれかなら返す。
3. それ以外（`.error` 欠落 / 未知 code / 非オブジェクト）→ `null`。

### `createTag(input)`

1. `fetch("/api/admin/tags", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(input), credentials:"same-origin" })`。既存 `assignMemberTag` の呼び出し様式（`credentials:"same-origin"` 等）に揃える。
2. `res.ok`（201）→ `(await res.json()) as AdminTagRef`。レスポンスは `{ tagId, code, label, category, active }` だが、戻り値型は既存 `AdminTagRef`（`{ tagId, code, label, category }`）に絞る（`active` は drawer の付与判定で不要）。
3. `!res.ok` → `await res.text()` で bodyText を取得し `parseTagErrorCode(bodyText)` を呼ぶ。検出 code を載せた `Error`（例: `error.code = code`）を throw する。code が null（不明）の場合も throw（HTTP status を含むメッセージ）。

> `createTag` は raw helper（fetch 直叩き）。task-B の実 mutation は `useAdminMutation("/api/admin/tags", "POST", ...)` 経由で発火し、その `onError` で `FetchAuthedError.bodyText` を `parseTagErrorCode` に渡して分岐する。`parseTagErrorCode` を両経路で共用する点が本タスクの責務。

## 入出力 / 副作用

- 入力: `createTag` = `{ code, label, category }` / `parseTagErrorCode` = `bodyText: string`
- 出力: `createTag` = `Promise<AdminTagRef>`（201）/ `parseTagErrorCode` = `AdminTagCreateErrorCode | null`
- 副作用: `createTag` は `POST /api/admin/tags`（tag master への write）。`parseTagErrorCode` は純関数（副作用なし）。
- **`apps/api` 変更なし**。

## テスト方針（C-A-T1〜C-A-T3）

`members.tagCreate.spec.ts`（`fetch` を `vi.fn()` で stub。`vi.stubGlobal("window",...)` 禁止）:

| ID | ケース | expected |
| --- | --- | --- |
| C-A-T1 | `createTag` 201 | `fetch` stub が 201 + `{ tagId:"t1", code:"vip", label:"VIP", category:"membership", active:1 }` → `createTag` が `{ tagId:"t1", code:"vip", label:"VIP", category:"membership" }`（`AdminTagRef`）を返す。`fetch` が `/api/admin/tags` へ POST + body `{code,label,category}` で呼ばれることを assert |
| C-A-T2 | `createTag` 409 | `fetch` stub が 409 + `'{"ok":false,"error":"tag_code_conflict"}'` → `createTag` が `tag_code_conflict` を載せた `Error` を throw（`.code === "tag_code_conflict"`） |
| C-A-T3 | `parseTagErrorCode` | `'{"ok":false,"error":"invalid_body"}'` → `"invalid_body"` / `'{"ok":false,"error":"tag_code_conflict"}'` → `"tag_code_conflict"` / `'{"ok":false,"error":"unknown_x"}'` → `null` / `"{not json"`（不正 JSON）→ `null` / `'{"ok":false}'`（error 欠落）→ `null` |

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- members
# 代替経路（filter が動かない環境）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  src/features/admin/api/__tests__/members.tagCreate.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

> filter 名は `apps/web/package.json` の `name`（`@ubm-hyogo/web`）で確認して合わせる。

## AC との対応

- AC-1（drawer から新規 tag 作成）: `createTag` / 実 mutation が叩く `POST /admin/tags` の web client 基盤。
- AC-3（`tag_code_conflict` 回収）: `parseTagErrorCode` が 409 を `tag_code_conflict` として検出し、task-B の conflict state への分岐を可能にする。
- AC-4（validation error 表示）: server 400（`invalid_body` / `invalid_json`）を `parseTagErrorCode` で識別し、task-B の包括フォールバック error に繋ぐ。

## DoD（task-A）

- `AdminTagCreateErrorCode` / `parseTagErrorCode` / `createTag` が `members.ts` に export 追加されている
- C-A-T1〜C-A-T3 全 PASS
- `pnpm --filter @ubm-hyogo/web typecheck` / `lint` green
- 既存 `members.ts` の helper（`fetchMemberTags` / `assignMemberTag` / `unassignMemberTag` / `fetchTagMaster` / `bulkApplyMemberTags`）に regression 0
- `apps/api` 変更 0

## 完了条件

- 追加する型 / 関数の signature が確定している
- `parseTagErrorCode` の正常 / 不正 JSON / 未知 code の挙動が定義されている
- `createTag` の 201 / !res.ok 分岐（parseTagErrorCode で code 付き throw）が定義されている
- C-A-T1〜C-A-T3 が expected 付きで列挙され、`*.spec.ts` 命名を遵守している
- AC-1 / AC-3 / AC-4 との対応が明示され、依存なしで着手可能であることが記載されている
