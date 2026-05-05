[実装区分: 実装仕様書]

# Phase 8 合意 — DRY 化評価

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 8 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | pending（DRY 判定確定・実装/grep は Phase 5 / Phase 9) |

## 合意 summary

Plan A に伴う反復パターン「`const { ... } = await getAuth();`」は **4 ファイル × 4〜6 callsite** に過ぎない。helper 抽象 (`withAuth(handler)` 等) は **不採用** とし、route handler 内で素朴に 1 行記述する **案 B を採用**。`getAuth()` 自体は module-level Promise cache を持たせることで callsite 側の手動 memoize を不要にする。

## Phase deliverables

### 反復パターン棚卸し

| # | ファイル | パターン | 取得対象 |
| --- | --- | --- | --- |
| R-1 | `app/api/auth/[...nextauth]/route.ts` | `const { handlers } = await getAuth();` | handlers (× GET/POST 2 callsite) |
| R-2 | `app/api/auth/callback/email/route.ts` | `const { signIn } = await getAuth();` | signIn |
| R-3 | `app/api/admin/[...path]/route.ts` | `const { auth } = await getAuth();` | auth |
| R-4 | `app/api/me/[...path]/route.ts` | 同上 | auth |

合計 4〜6 callsite。

### 採用判定

| 案 | 採否 | 理由 |
| --- | --- | --- |
| A. helper `withAuth(handler)` 新設 | 不採用 | "3 similar lines is better than premature abstraction" 原則 / Next 16 route convention 検査を読みづらくする / req 型 generics 複雑化 |
| **B. route handler から `getAuth()` 直接呼出（素朴な反復）** | **採用** | 抽象ゼロで Plan A 意図が読み取れる / Next 16 convention 準拠 / grep 起点が安定 |
| C. handler 側で `cached ??= await getAuth();` 手動 cache | 不採用 | `getAuth()` 内部 cache の責務、race condition の温床 |
| D. `auth.ts` 側で 4 専用 wrapper export | 不採用 | export 数増、test mock 対象増、利益小 |

### `getAuth()` 内部キャッシュ方針

- module-level `let cached: Promise<AuthHandle> | null = null;`
- `cached ??= (async () => { const NextAuth = (await import("next-auth")).default; ...; return { handlers, auth, signIn, signOut }; })();`
- Promise を cache するため並行呼び出しでも `NextAuth()` 二重実行を回避
- 失敗時は reject Promise が cache に残る（fail-fast、次回も同じ失敗）

### dead code 検出計画（DC-1〜DC-8）

| ID | 旧経路（Plan A 前） | 検出方法 | 期待値 |
| --- | --- | --- | --- |
| DC-1 | `[...nextauth]/route.ts` の `export { GET, POST } from ...` | `rg 'export \{ GET, POST \} from'` | 0 件 |
| DC-2 | `auth.ts` の `import NextAuth from "next-auth"` | `rg '^import NextAuth from "next-auth"'` | 0 件 |
| DC-3 | `auth.ts` の `import GoogleProvider ...` | `rg '^import .* from "next-auth/providers/'` | 0 件 |
| DC-4 | `auth.ts` の `import CredentialsProvider ...` | 同上 | 0 件 |
| DC-5 | `auth.ts` の value import `import { JWT } from "next-auth/jwt"` | type-only 除外 rg | 0 件 |
| DC-6 | `oauth-client.ts` の `import { signIn } from "next-auth/react"` | 行頭 rg | 0 件 |
| DC-7 | 旧 named export (`handlers` / `GET` / `POST` 等) | `rg '^export (const|async function) (handlers|GET|POST)' apps/web/src/lib/auth.ts` | 0 件 |
| DC-8 | （詳細は phase-08.md 本体参照） | — | — |

### type import 整理方針

- value import 禁止（top-level）
- `import type { NextAuthConfig, JWT }` 等は許容（runtime 副作用ゼロ）
- 関数内 `await import("...")` は dynamic import として明示許容

## 状態

- **pending**: DRY 判定確定。実際の dead code 検出 grep / コード反映は Phase 5 / Phase 9 で実施

## 次 Phase への引き渡し

Phase 9（品質保証）へ次を渡す:

- 案 B 採用（helper 抽象なし）
- `getAuth()` 内部 Promise cache 方針
- DC-1〜DC-8 grep（Phase 9 G-4 build gate 失敗時の漏れ箇所特定にも利用）
- type import 境界（value 禁止 / type 許容 / dynamic 許容）
