# Phase 6: テスト追加

## 新規ファイル

### `apps/web/__tests__/proxy.spec.ts`

```ts
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { signSessionJwt, asMemberId } from "@ubm-hyogo/shared";
import { proxy, config as proxyConfig } from "../proxy";

const TEST_SECRET = "test-secret-for-proxy-spec";

const makeCookie = async (isAdmin: boolean) => {
  const token = await signSessionJwt(TEST_SECRET, {
    memberId: asMemberId(isAdmin ? "member_admin" : "member_regular"),
    email: isAdmin ? "admin@example.com" : "member@example.com",
    name: isAdmin ? "Admin User" : "Regular User",
    isAdmin,
  });
  return `authjs.session-token=${token}`;
};

const makeRequest = (path: string, opts?: { cookie?: string }) => {
  const url = new URL(`http://localhost:3000${path}`);
  const headers = new Headers();
  headers.set("x-ubm-auth-secret", TEST_SECRET);
  if (opts?.cookie) headers.append("cookie", opts.cookie);
  return new NextRequest(url, { headers });
};

describe("proxy", () => {
  it("matcher 設定が /admin/:path* と /profile/:path* に限定されている", () => {
    expect(proxyConfig.matcher).toEqual(["/admin/:path*", "/profile/:path*"]);
  });

  it("未ログインで /admin にアクセスすると /login?gate=admin_required へ redirect する", async () => {
    const res = await proxy(makeRequest("/admin/dashboard"));
    expect(res.status).toBe(307); // NextResponse.redirect デフォルト
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("gate=admin_required");
  });

  it("未ログインで /profile にアクセスすると /login?redirect=%2Fprofile へ redirect する", async () => {
    const res = await proxy(makeRequest("/profile"));
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("redirect=%2Fprofile");
  });

  it("未ログインで /profile/edit?tab=tags にアクセスすると元 path+search を redirect param に保持する", async () => {
    const res = await proxy(makeRequest("/profile/edit?tab=tags"));
    const loc = res.headers.get("location") ?? "";
    expect(loc).toMatch(/redirect=%2Fprofile%2Fedit%3Ftab%3Dtags/);
  });

  it("認証済 non-admin で /admin にアクセスすると 403 Forbidden を返す", async () => {
    const res = await proxy(makeRequest("/admin", { cookie: await makeCookie(false) }));
    expect(res.status).toBe(403);
    await expect(res.text()).resolves.toBe("Forbidden");
  });

  it("認証済 admin で /admin にアクセスすると NextResponse.next() 相当を返す", async () => {
    const res = await proxy(makeRequest("/admin", { cookie: await makeCookie(true) }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("認証済で /profile にアクセスすると NextResponse.next() 相当を返す", async () => {
    const res = await proxy(makeRequest("/profile", { cookie: await makeCookie(false) }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
```

## 既存テストへの影響

- middleware に対する unit test は現存しないため既存テスト変更は不要
- e2e (`tests/integration` 配下) に admin/profile 関連シナリオがあれば挙動変化なしを確認（実装時に `grep` で確認）

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- proxy.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test
```

## DoD

- `proxy.spec.ts` の AC-1〜AC-7 全ケースが green
- `it.todo` / `test.todo` は残さない（task-specification-creator quality gate 準拠）

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 6 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

auth gate parity を focused Vitest で証明し、manual smoke だけに依存しない状態にする。

## 実行タスク

- `apps/web/__tests__/proxy.spec.ts` を追加する。
- `signSessionJwt` で valid cookie を生成する。
- AC-1〜AC-7 をすべて実 case として green にする。

## 参照資料

- Phase 4 テスト計画。
- `packages/shared/src/auth.ts`
- `apps/web/playwright/fixtures/auth.ts`

## 成果物

- `apps/web/__tests__/proxy.spec.ts`
- focused test run evidence

## 完了条件

- AC-1〜AC-7 が pass する。
- `it.todo` / `test.todo` が残っていない。

## 統合テスト連携

Phase 9 の full web test と Phase 11 の manual smoke に接続する。
