# Phase 2: 設計

## 移行戦略

Next.js 公式が提供する codemod を起点に、最小差分の手動補正を加える方式。

```bash
# apps/web ディレクトリで実行
npx @next/codemod@canary middleware-to-proxy .
```

codemod 出力結果（期待）:
- `apps/web/middleware.ts` → `apps/web/proxy.ts` にリネーム
- `export async function middleware(req)` → `export async function proxy(req)`
- `export default middleware` → `export default proxy`

## 変更後ファイル構造

```
apps/web/
├── proxy.ts                     # (新規, rename 元 middleware.ts)
├── __tests__/
│   └── proxy.spec.ts            # (新規)
└── app/
    └── (admin)/
        └── layout.tsx           # (編集: コメント文言のみ)
```

## proxy.ts 関数シグネチャ

```ts
// apps/web/proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { decodeAuthSessionJwt } from "@ubm-hyogo/shared";

const SESSION_COOKIE_NAMES = [...] as const;

const buildAdminLoginRedirect = (req: NextRequest): NextResponse => { ... };
const buildProfileLoginRedirect = (req: NextRequest): NextResponse => { ... };
const authSecret = (req: NextRequest): string => { ... };
const sessionToken = (req: NextRequest): string | undefined => { ... };

const guardedProxy = async (req: NextRequest) => { ... };

export async function proxy(req: NextRequest) {
  return guardedProxy(req);
}

export default proxy;

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
```

## 振る舞いの不変表

| path | 認証状態 | 結果 |
|---|---|---|
| `/admin/*` | 未ログイン | 307 → `/login?gate=admin_required` |
| `/admin/*` | 認証済 / `isAdmin=false` | 403 plain text |
| `/admin/*` | 認証済 / `isAdmin=true` | next() |
| `/profile/*` | 未ログイン | 307 → `/login?redirect=<元path+search>` |
| `/profile/*` | 認証済 | next() |
| その他 | -- | next()（ただし matcher で除外されるので実質到達しない） |

## 副作用 / 互換性

- Cloudflare Workers (`@opennextjs/cloudflare`) は `proxy.ts` 規約をサポート済（Next.js 16 互換）
- Edge Runtime 既定動作変更なし
- `apps/web/app/(admin)/layout.tsx:3` のコメント `middleware.ts は配置しない` を `proxy.ts は配置しない（root proxy.ts で完結）` に更新

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 2 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

最小差分の rename 設計で、Next.js 16 proxy convention と既存 gate 振る舞いを両立する。

## 実行タスク

- codemod 起点の移行戦略を定義する。
- `proxy.ts` の export / matcher / helper 維持方針を定義する。
- 307 redirect を正本期待値として振る舞い表に固定する。

## 参照資料

- Next.js local docs `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- `apps/web/middleware.ts`
- `apps/web/app/(admin)/layout.tsx`

## 成果物

- 本 Phase 2 設計。
- `apps/web/proxy.ts` の期待構造。

## 完了条件

- 実装対象ファイルと非対象ファイルが明確である。
- behavior matrix が Phase 4 / 6 の test matrix と一致する。

## 統合テスト連携

Phase 4 / 6 の proxy spec が、本設計の behavior matrix を直接検証する。
