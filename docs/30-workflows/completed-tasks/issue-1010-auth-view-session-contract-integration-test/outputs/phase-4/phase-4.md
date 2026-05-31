# Phase 4: テスト作成（TDD RED）

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL**

## 1. 目的

本サイクルで作成する新規 spec ファイルの**完全な雛形**を提示する。本 Phase 時点では production コードを
一切変更せず、RED（spec ファイル不在 → import 解決失敗または contract assertion 失敗で赤）を確定させる設計を記録する。

## 2. 作成するテストファイル

| 項目 | 値 |
| --- | --- |
| パス | `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` |
| 変更種別 | 新規作成（production コード変更なし） |
| 命名規約適合 | 不変条件 #8（新規 test は `*.spec.{ts,tsx}` のみ）に適合。`authViewSessionContract.integration.spec.ts` は末尾が `.spec.ts` で終わるため `block-test-suffix` / `verify-test-suffix` の reject 対象外。`.test.ts` は使わない。 |
| 配置先 | 既存 `__tests__/`（`getAuthView.spec.ts` / `resolveAuthView.spec.ts` と同階層） |
| test 環境 | Vitest（`apps/web` の vitest config、node 環境で可。jsdom 不要） |

## 3. spec ファイル完全雛形

> 実装者は以下をそのまま新規ファイルとして作成する。`vi.mock` は spec 先頭（import 巻き上げ前提）に置く。

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Cloudflare context の境界 stub（auth.spec.ts 踏襲）---
// production の session 構築ロジック自体は mock しない。getCloudflareContext のみ stub する。
const cloudflareContext = () => ({
  env: {},
  cf: {},
  ctx: {},
});
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => cloudflareContext(),
}));

import { buildAuthConfig } from "@/lib/auth";
import { resolveAuthView } from "../resolveAuthView";
import type { SessionLike } from "../types";

// --- buildAuthConfig が要求する provider factories の stub ---
// 未指定だと build 時に throw するため、auth.spec.ts と同形の stub を渡す。
const factories = {
  GoogleProvider: () => ({ id: "google" }),
  CredentialsProvider: () => ({ id: "magic-link" }),
};

// 実 session callback を 1 度だけ build して取り回すヘルパ。
const getSessionCallback = () => {
  const cfg = buildAuthConfig(
    {} as never,
    vi.fn() as unknown as typeof fetch,
    factories as never,
  );
  return cfg.callbacks!.session!;
};

// token fixture を実 callback に流し、produced.user を取り出すヘルパ。
const produceSessionUser = async (token: Record<string, unknown>) => {
  const sessionCallback = getSessionCallback();
  const produced = await sessionCallback({
    session: { user: { email: "u@e" } },
    token,
  } as never);
  return (produced as { user?: unknown }).user as SessionLike["user"];
};

describe("authViewSessionContract (integration)", () => {
  // TC-AVSC-01: member token → produced(memberId,isAdmin:false) → member view
  it("TC-AVSC-01: member token resolves to member AuthView", async () => {
    const user = await produceSessionUser({
      memberId: "m_1",
      isAdmin: false,
      email: "u@e",
      name: "U",
    });
    expect(user?.memberId).toBe("m_1");
    expect(user?.isAdmin).toBe(false);

    const view = resolveAuthView({ user } as SessionLike);
    expect(view).toEqual({ kind: "member", profileHref: "/profile" });
  });

  // TC-AVSC-02: admin token → admin view
  it("TC-AVSC-02: admin token resolves to admin AuthView", async () => {
    const user = await produceSessionUser({ memberId: "m_1", isAdmin: true });
    expect(user?.memberId).toBe("m_1");
    expect(user?.isAdmin).toBe(true);

    const view = resolveAuthView({ user } as SessionLike);
    expect(view).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
  });

  // TC-AVSC-03: empty token → produced(memberId:"",isAdmin:false) → guest（fail-closed）
  it("TC-AVSC-03: empty token resolves to guest AuthView (fail-closed)", async () => {
    const user = await produceSessionUser({});
    expect(user?.memberId).toBe("");
    expect(user?.isAdmin).toBe(false);

    const view = resolveAuthView({ user } as SessionLike);
    expect(view).toEqual({ kind: "guest" });
  });

  // TC-AVSC-04: getAuthView() end-to-end（getAuth/auth() mock 経由）
  it("TC-AVSC-04: getAuthView() end-to-end yields member AuthView", async () => {
    const user = await produceSessionUser({
      memberId: "m_1",
      isAdmin: false,
      email: "u@e",
      name: "U",
    });

    // getAuthView は @/lib/auth の getAuth を import する。
    // auth() が「実 callback が返した shape」を返すよう動的に mock する。
    vi.doMock("@/lib/auth", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/lib/auth")>();
      return {
        ...actual,
        getAuth: async () => ({
          auth: async () => ({ user }),
        }),
      };
    });

    const { getAuthView } = await import("../getAuthView");
    const view = await getAuthView();
    expect(view).toEqual({ kind: "member", profileHref: "/profile" });

    vi.doUnmock("@/lib/auth");
  });

  // TC-AVSC-05: produced.user shape regression guard
  it("TC-AVSC-05: produced.user exposes memberId/isAdmin keys (drift guard)", async () => {
    const user = await produceSessionUser({ memberId: "m_1", isAdmin: true });
    expect(user).toHaveProperty("memberId");
    expect(user).toHaveProperty("isAdmin");
  });
});
```

> 実装者は実際の `buildAuthConfig` / `callbacks.session` の型署名に合わせて `as never` キャストの位置を
> 微調整してよい。**契約の本質（token→produced.user→resolveAuthView→AuthView の連鎖と assert 値）は変更しない**。

## 4. 各 TC の arrange / act / assert

| TC | it() 名 | arrange | act | assert |
| --- | --- | --- | --- | --- |
| TC-AVSC-01 | `member token resolves to member AuthView` | token `{memberId:"m_1",isAdmin:false,email,name}` | `produceSessionUser` → `resolveAuthView` | `user.memberId==="m_1"` / `user.isAdmin===false` / view `{kind:"member",profileHref:"/profile"}` |
| TC-AVSC-02 | `admin token resolves to admin AuthView` | token `{memberId:"m_1",isAdmin:true}` | 同上 | `user.isAdmin===true` / view `{kind:"admin",profileHref:"/profile",adminHref:"/admin"}` |
| TC-AVSC-03 | `empty token resolves to guest AuthView (fail-closed)` | token `{}` | 同上 | `user.memberId===""` / `user.isAdmin===false` / view `{kind:"guest"}` |
| TC-AVSC-04 | `getAuthView() end-to-end yields member AuthView` | produced.user（member）を `getAuth`/`auth()` mock に注入 | `getAuthView()` | view `{kind:"member",profileHref:"/profile"}` |
| TC-AVSC-05 | `produced.user exposes memberId/isAdmin keys (drift guard)` | admin token | `produceSessionUser` | `user` が `memberId` / `isAdmin` プロパティを持つ |

## 5. RED の確認（spec ファイル不在時点）

| 観点 | RED 内容 |
| --- | --- |
| ファイル不在 | `authViewSessionContract.integration.spec.ts` が存在しない時点では、当該 spec が vitest の収集対象に含まれず「テスト 0 件追加」。実装者がファイルを作成し import を解決した瞬間が GREEN への遷移点。 |
| 雛形作成直後の RED 可能性 | `buildAuthConfig` の factories 未指定 throw / cloudflare mock 漏れ時に build 段階で赤くなる。Phase 5 の GREEN 注意点（§ Phase 5）で潰す。 |
| drift 検知の RED | 将来 `auth.ts` の session callback が `memberId`→別名へ変わると TC-AVSC-01/05 が赤くなる = 契約 drift を検出する設計意図。 |

## 6. mock 方針まとめ

| 対象 | 手法 | 理由 |
| --- | --- | --- |
| `@opennextjs/cloudflare` | `vi.mock`（spec 先頭・静的） | `getCloudflareContext` 解決のため。`auth.spec.ts` 踏襲 |
| `@/lib/auth` の `getAuth`（TC-AVSC-04 のみ） | `vi.doMock` + 動的 `import` | `getAuthView` 経路だけで auth() 出力を注入。他 TC は実 `buildAuthConfig` を使うため静的 mock しない |
| `fetch` | `vi.fn()` stub | D1/外部アクセスなし（不変条件 #5 適合） |

## 完了条件（Phase 4）

- [ ] 新規 spec パス・命名規約（不変条件 #8 適合）を明記した
- [ ] `vi.mock("@opennextjs/cloudflare", ...)` を先頭に置いた完全雛形を提示した
- [ ] stub factories 定義・`getAuth` mock（TC-AVSC-04 用 `vi.doMock`）方法を明記した
- [ ] TC-AVSC-01〜05 の it() 名 / arrange / act / assert を明記した
- [ ] RED 時点（ファイル不在）の失敗内容を記録した
