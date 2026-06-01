# Phase 4: テスト作成（TDD RED） — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## 1. テストパターンと命名規則の整合確認

- 新規 test = `apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts`（不変条件#8: `*.spec.ts` のみ。`*.test.ts` 禁止）。
- 既存 `server-fetch.binding.spec.ts` と同じ `__tests__/` 配下・`vitest` `describe`/`it` スタイルに合わせる。
- テスト対象は `server-fetch.ts` から export される `AdminFetchError` / `isAdminFetchError`（external import。private cast 不要）。

## 2. 新規テスト仕様 `admin-fetch-error.spec.ts`

```ts
import { describe, expect, it } from "vitest";
import { AdminFetchError, isAdminFetchError } from "../server-fetch";

describe("AdminFetchError", () => {
  it("TC-AFE-01: status / path フィールドを構造化提供する", () => {
    const e = new AdminFetchError({ path: "/admin/audit?limit=50", status: 404 });
    expect(e.status).toBe(404);
    expect(e.path).toBe("/admin/audit?limit=50");
  });

  it("TC-AFE-02: Error を継承する（instanceof Error も true）", () => {
    const e = new AdminFetchError({ path: "/admin/x", status: 500 });
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AdminFetchError);
    expect(e.name).toBe("AdminFetchError");
  });

  it("TC-AFE-03: message が body なしのとき byte-identical（admin api ${path} failed: ${status}）", () => {
    const e = new AdminFetchError({ path: "/admin/dashboard", status: 404 });
    expect(e.message).toBe("admin api /admin/dashboard failed: 404");
  });

  it("TC-AFE-04: message が body ありのとき ' body=' suffix を 256 文字で付与する（既存 binding.spec 互換）", () => {
    const e = new AdminFetchError({
      path: "/admin/dashboard",
      status: 404,
      responseBody: "error code: 1042",
    });
    expect(e.message).toBe("admin api /admin/dashboard failed: 404 body=error code: 1042");
  });

  it("TC-AFE-05: message suffix は raw body を 256 文字で切る", () => {
    const body = "x".repeat(300);
    const e = new AdminFetchError({ path: "/admin/dashboard", status: 500, responseBody: body });
    expect(e.message).toBe(`admin api /admin/dashboard failed: 500 body=${"x".repeat(256)}`);
  });

  it("TC-AFE-06: responseBodySnippet は <=500 文字に切る（message の 256 とは独立）", () => {
    const body = "y".repeat(700);
    const e = new AdminFetchError({ path: "/admin/x", status: 500, responseBody: body });
    expect(e.responseBodySnippet).toBe("y".repeat(500));
    expect(e.responseBodySnippet?.length).toBe(500);
    // message 側は 256 のまま（独立スライス）
    expect(e.message.endsWith("y".repeat(256))).toBe(true);
  });

  it("TC-AFE-07: responseBody 未指定 / null は snippet=null・suffix なし", () => {
    const e1 = new AdminFetchError({ path: "/admin/x", status: 404 });
    expect(e1.responseBodySnippet).toBeNull();
    expect(e1.message).toBe("admin api /admin/x failed: 404");
    const e2 = new AdminFetchError({ path: "/admin/x", status: 404, responseBody: null });
    expect(e2.responseBodySnippet).toBeNull();
  });

  it("TC-AFE-08: responseBody が空文字のとき snippet='' だが message suffix は出さない", () => {
    const e = new AdminFetchError({ path: "/admin/x", status: 404, responseBody: "" });
    expect(e.message).toBe("admin api /admin/x failed: 404");
    // "" は falsy のため suffix 抑止。snippet も "" (空) のまま保持
    expect(e.responseBodySnippet).toBe("");
  });
});

describe("isAdminFetchError", () => {
  it("TC-AFE-09: AdminFetchError インスタンスに true", () => {
    expect(isAdminFetchError(new AdminFetchError({ path: "/admin/x", status: 404 }))).toBe(true);
  });

  it("TC-AFE-10: name=AdminFetchError の plain Error に true（Workers cross-module fallback）", () => {
    const fake = new Error("admin api /admin/x failed: 404");
    fake.name = "AdminFetchError";
    expect(isAdminFetchError(fake)).toBe(true);
  });

  it("TC-AFE-11: 通常 Error / 非 Error に false", () => {
    expect(isAdminFetchError(new Error("boom"))).toBe(false);
    expect(isAdminFetchError("string")).toBe(false);
    expect(isAdminFetchError(null)).toBe(false);
  });
});
```

## 3. safe-fetch.ts 構造化 status 優先の追加検証（既存 spec へ追記）

`apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` に追加:

```ts
it("TC-SF-STATUS: 構造化 status フィールドを正規表現より優先する", async () => {
  // message からは status を読めないが status フィールドを持つ Error
  const err = Object.assign(new Error("opaque message"), { status: 404, name: "AdminFetchError" });
  const r = await safeServerFetch(() => Promise.reject(err), { codePrefix: "ADMIN_FETCH" });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.code).toBe("ADMIN_FETCH_404");
});
```

## 4. RED 期待結果（実装前）

| TC | 期待（実装前） | 理由 |
| --- | --- | --- |
| TC-AFE-01〜11 | **import error / 全 fail** | `AdminFetchError` / `isAdminFetchError` が未 export |
| TC-SF-STATUS | **fail** | `statusFromError` 未実装。`status` フィールド優先ロジックなし |
| 既存 binding/safe-server-fetch/404-vs-401/env | **green のまま** | 実装後も message byte-identical なので不変であることを RED 時点で確認 |

## 5. 境界値の実文字数確認（FB-W0-RV-001）
- `"x".repeat(256)` // length: 256（message suffix 上限）
- `"y".repeat(500)` // length: 500（responseBodySnippet 上限）
- `"x".repeat(300)` // length: 300（256 で切られることを確認する入力）
- `"y".repeat(700)` // length: 700（500 で切られることを確認する入力）

## 6. ガード節の falsy 網羅（FB-UT-W3-HTTP）
`responseBody` の falsy パターンを TC で網羅: `undefined`（TC-07）/ `null`（TC-07）/ `""`（TC-08）。`""` は suffix 抑止だが snippet は `""` 保持（`null` と区別）であることを明示検証。

## 完了条件（Phase 4）
- [x] 新規 spec の全 TC（TC-AFE-01〜11 + TC-SF-STATUS）を定義
- [x] RED 期待結果を明記
- [x] message byte-identical TC（既存 binding.spec の assertion を逐語反映）
- [x] 境界値の実文字数をコメントで固定
- [x] falsy 網羅（undefined/null/""）
