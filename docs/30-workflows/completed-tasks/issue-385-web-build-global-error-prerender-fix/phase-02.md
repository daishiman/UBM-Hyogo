[実装区分: 実装仕様書]

# Phase 2: 設計 — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 2 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で再確定した真因（next-auth top-level import が Next 16 + React 19 build 時 prerender で `@auth/core` の `React.createContext` を発火させ Dispatcher を破壊する）に対して、**lazy factory `getAuth()` パターン** による恒久 workaround を設計する。失敗 first-choice 7 件を評価マトリクスに記録し、不採用理由を index.md と一致させる。実コード差分は Phase 5 に委ね、本 Phase では関数シグネチャ / 内部 dynamic import 戦略 / cache 戦略 / 型 export 戦略 / 4 route handler の書き換えパターン（before/after の概念図のみ）を仕様化する。

## 採用方針評価マトリクス

| # | 候補 | 修正範囲 | dependency 副作用 | 恒久性 | AC-8 整合 | 評価 |
| --- | --- | --- | --- | --- | --- | --- |
| (Plan A) | `auth.ts` lazy factory `getAuth()` 化 + 4 routes の `await getAuth()` 経由化 + `oauth-client.ts` の dynamic import | `apps/web/src/lib/auth.ts` / `oauth-client.ts` / 4 route handler / 関連 test | ゼロ（全 dep 据置） | 高（next-auth を build 時 prerender 経路から完全隔離） | OK | **first choice** |
| (旧 d) | `app/global-error.tsx` の `"use client"` 撤廃 + RSC 化 | `apps/web/app/global-error.tsx` 1 ファイル | ゼロ | — | — | **不採用**: Next 16 仕様で `global-error.tsx` は `"use client"` 必須。type/convention error で build 拒否、再現解消もせず |
| (a) | `next` 16.2.5+ patch upgrade | `package.json` patch | 小 | 不能 | NG | **不採用**: 16.2.5 不存在。canary でも未修正 |
| (b) | `react` / `react-dom` 19.2.4 ダウングレード | `package.json` 2 行 | 中（19.2.5 修正喪失） | 不能 | NG | **不採用**: 19.2.4 でも再現。19.x major bump は依存破壊 |
| (c) | `next.config.ts` `serverExternalPackages: ["next-auth", "@auth/core"]` | 1 ファイル | 小 | 中 | OK | **不採用**: useContext 自体は解消するが next-auth/lib が `next/server` を `.js` 拡張子なし ESM import するため `ERR_MODULE_NOT_FOUND` を新たに招く |
| (e) | `next-auth` `5.0.0-beta.25` → `beta.30` minor bump | `package.json` 1 行 | 中（auth 経路に副作用） | 不能 | NG | **不採用**: module-init 構造（`@auth/core` `React.createContext` 発火）は同じため再発 |
| (f) | `app/global-error.tsx` 削除（Next 内蔵 default 採用） | 1 ファイル削除 | ゼロ | 不能 | OK | **不採用**: auth.ts 経由で next-auth が build 時 evaluation されるため、内蔵 default でも同条件で再現 |
| (g) | Next.js 上流修正待ち | ゼロ | — | — | — | **不採用**: 修正版時期未定。staging/production deploy ブロック継続不可 |
| (h) | `pnpm patch next-auth@5.0.0-beta.25` で extension 追加 + serverExternalPackages 併用 | patch tarball + config | 大 | 中 | OK | **不採用**: next-auth bump 時に毎回 patch 再生成が必要。lazy factory より保守性が劣る |

### Plan A 採用根拠

- 真因が「`auth.ts` の top-level next-auth import → build 時 prerender 経路で `@auth/core` / `next-auth/react` の `React.createContext(undefined)` 発火 → React Dispatcher 破壊」であるため、**top-level import を取り除けば prerender 経路から next-auth を完全隔離できる**
- lazy factory `getAuth()` 化により build 時 module-init で next-auth が evaluation されない。route handler 実行時にのみ `await import("next-auth")` で読み込まれ、Dispatcher 破壊が発生しない
- dependency 副作用ゼロ（`next` / `react` / `react-dom` / `next-auth` 全て据置）
- export shape を維持すれば middleware / 既存テストへの波及を最小化できる
- next-auth upstream 修正に依存しない恒久 workaround

## lazy factory アーキテクチャ詳細

### `getAuth()` の signature と内部 dynamic import 戦略

```ts
// apps/web/src/lib/auth.ts （概念。実コードは Phase 5）

// 型は type-only import で安全に top-level 保持可能（type は erased される）
import type { NextAuthConfig, NextAuthResult, Session } from "next-auth";

// pure 関数 / 値オブジェクト / env reader は据え置き
export interface AuthEnv { /* 既存 */ }
export function buildAuthConfig(env: AuthEnv): NextAuthConfig { /* 既存 */ }
export async function fetchSessionResolve(/* args */) { /* 既存 */ }

// lazy factory 本体: build 時には evaluation されない
export async function getAuth(env?: AuthEnv): Promise<NextAuthResult> {
  // 動的 import: build 時 prerender 経路では呼ばれない
  const { default: NextAuth } = await import("next-auth");
  // providers も同様に動的 import
  const { default: Google } = await import("next-auth/providers/google");
  const { default: Credentials } = await import("next-auth/providers/credentials");
  const config = buildAuthConfig(env ?? readAuthEnv());
  return NextAuth({ ...config, providers: [Google(...), Credentials(...)] });
}
```

### cache 戦略

| 観点 | 方針 |
| --- | --- |
| route handler 内 caching | route handler は serverless instance が再利用される間 module スコープが生存。`getAuth()` 結果を module-level Promise でメモ化することで request ごとの再 import を避ける |
| メモ化方法 | `let cached: Promise<NextAuthResult> | null = null;` を auth.ts module 内に持ち、`getAuth()` は `cached ??= (async () => { ... })()` パターンで返す |
| env 切替 | env が同一 instance 内で変動しないため単一 cache で十分。test では cache を `__resetGetAuthForTest()` でクリア可能にする |
| build 時の評価回避 | cache 変数の初期値は `null`。`await import()` は `getAuth()` 呼び出し時のみ実行されるため、build 時 prerender worker は next-auth に到達しない |

### 型 export 戦略

| export | 種別 | 戦略 |
| --- | --- | --- |
| `Session` / `NextAuthConfig` / `NextAuthResult` / `JWT` 等 | type-only | `import type` で top-level 保持可能（erase されるため runtime 影響なし） |
| `handlers` / `auth` / `signIn` / `signOut` | runtime value | 直接 export を撤廃。`getAuth()` 経由でのみ取得可能とする |
| `buildAuthConfig` / `fetchSessionResolve` / `AuthEnv` | pure runtime | 据え置き（next-auth に依存しない） |
| `GET` / `POST` 直接 export | runtime | 撤廃。route handler 側で `await getAuth()` 経由で組み立てる |

### 4 route handler の書き換えパターン（概念図）

#### `apps/web/app/api/auth/[...nextauth]/route.ts`

```text
Before:
  import { handlers } from "@/lib/auth";
  export const { GET, POST } = handlers;

After (概念):
  import { getAuth } from "@/lib/auth";
  export async function GET(req: Request)  { const { handlers } = await getAuth(); return handlers.GET(req); }
  export async function POST(req: Request) { const { handlers } = await getAuth(); return handlers.POST(req); }
```

#### `apps/web/app/api/auth/callback/email/route.ts`

```text
Before:
  import { signIn } from "@/lib/auth";
  ... await signIn("email", { ... }) ...

After (概念):
  import { getAuth } from "@/lib/auth";
  ... const { signIn } = await getAuth(); await signIn("email", { ... }) ...
```

#### `apps/web/app/api/admin/[...path]/route.ts`

```text
Before:
  import { auth } from "@/lib/auth";
  const session = await auth();

After (概念):
  import { getAuth } from "@/lib/auth";
  const { auth } = await getAuth();
  const session = await auth();
```

#### `apps/web/app/api/me/[...path]/route.ts`

`admin` と同形式。`auth` 取得経路を `await getAuth()` 経由に統一。

### `apps/web/src/lib/auth/oauth-client.ts`

```text
Before:
  import { signIn } from "next-auth/react";
  export async function startOAuth(...) { return signIn(...); }

After (概念):
  export async function startOAuth(...) {
    const { signIn } = await import("next-auth/react");
    return signIn(...);
  }
```

PoC 動作確認済（Phase 1 真因確認の試行履歴）。

### middleware が変更不要な根拠

| 観点 | 確認内容 |
| --- | --- |
| `apps/web/middleware.ts` の next-auth 直接 import の有無 | なし（`decodeAuthSessionJwt` のみ使用） |
| middleware が build 時 prerender 経路に乗るか | middleware は edge runtime で route handler 同様 lazy。build 時 prerender とは独立 |
| Plan A の影響 | middleware 経路は `auth.ts` の export shape を直接消費しないため、lazy factory 化の影響範囲外 |
| 結論 | **変更不要** |

### `next.config.ts` / `package.json` が変更不要な根拠

| 対象 | 根拠 |
| --- | --- |
| `next.config.ts` | `serverExternalPackages` 採用は ESM 解決で `ERR_MODULE_NOT_FOUND` を新たに招くため不採用（評価マトリクス c）。Plan A は config 変更を要しない |
| `package.json` | `next` / `react` / `react-dom` / `next-auth` のバージョンに起因する真因ではないことを Phase 1 で確認済（試行 1〜5）。Plan A は依存変更を要しない |

## 関数 / コンポーネントシグネチャ

| 対象 | シグネチャ | 副作用 | エラーハンドリング |
| --- | --- | --- | --- |
| `getAuth(env?: AuthEnv)` (`lib/auth.ts`) | `(env?: AuthEnv) => Promise<NextAuthResult>` | 初回呼び出し時のみ next-auth dynamic import。以降は cache から返却 | `await import` 失敗時は upstream の例外をそのまま伝搬。route handler は Next の標準例外経路で 500 応答 |
| `buildAuthConfig(env)` (`lib/auth.ts`) | `(env: AuthEnv) => NextAuthConfig` | なし（純粋） | 既存と同等 |
| `fetchSessionResolve(...)` (`lib/auth.ts`) | 既存と同シグネチャ | 既存と同等 | 既存と同等 |
| `startOAuth(...)` (`lib/auth/oauth-client.ts`) | 既存と同シグネチャ | 関数内 `await import("next-auth/react")` | 既存と同等 |
| `GET(req)` / `POST(req)` (`api/auth/[...nextauth]/route.ts`) | `(req: Request) => Promise<Response>` | `await getAuth()` で handlers 取得 | 既存と同等 |
| `route handlers` (admin / me / callback/email) | 既存と同シグネチャ | `await getAuth()` で auth / signIn 取得 | 既存と同等 |

## 依存パッケージのバージョン変更

| パッケージ | 現行 | Plan A 後 |
| --- | --- | --- |
| next | 16.2.4 | 16.2.4（無変更） |
| react | 19.2.5 | 19.2.5（無変更） |
| react-dom | 19.2.5 | 19.2.5（無変更） |
| @opennextjs/cloudflare | 1.19.4 | 1.19.4（無変更） |
| next-auth | 5.0.0-beta.25 | 5.0.0-beta.25（無変更） |
| @auth/core | 既存 | 既存（無変更） |

AC-8（dependency バージョン据置）と整合。

## 副作用とリスク

| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| `await getAuth()` の await 漏れ | route handler 内で `handlers.GET` が `undefined.GET` 呼び出しになる | typecheck で `Promise<NextAuthResult>` の `.GET` 直接アクセスを検出。Phase 5 のチェックリストに「await を全箇所に明記」を追加 |
| route handler 1 リクエスト目の latency 増加 | 初回 dynamic import コスト | module-level Promise メモ化で 2 回目以降ゼロコスト。Cloudflare Workers の cold start とほぼ同オーダー |
| 既存テストの mock 不整合 | `vi.mock("@/lib/auth", ...)` で `handlers` 直接 mock していた箇所が `getAuth()` 経由 mock に変更必要 | Phase 4 テスト戦略で mock 形式統一、Phase 5 で test ファイル併行修正 |
| `oauth-client.ts` の dynamic import が tree-shake されない | bundle サイズ微増 | 元々 client bundle に signIn が含まれており、dynamic import 化でも同等。差分は無視可能 |
| Cloudflare Workers の `await import()` 互換 | edge runtime でも dynamic import は標準サポート | OpenNext 1.19.4 は dynamic import を transparent に通す。Phase 11 で `build:cloudflare` 実測 |
| 将来 next-auth が ESM 構造変更 | dynamic import path 変更要 | refs に next-auth changelog 追跡を追加。型 import で早期検出 |

## 実行タスク

1. 採用方針 Plan A と理由を確定する。完了条件: 評価マトリクスと採用根拠が固定される。
2. 失敗 first-choice 7 件（旧 d / a / b / c / e / f / g）+ 派生不採用 1 件（h）を評価マトリクスに記録し、各不採用理由を index.md と一致させる。完了条件: 全 8 件の不採用根拠が表に明記される。
3. lazy factory アーキテクチャ詳細（getAuth signature / dynamic import 戦略 / cache 戦略 / 型 export 戦略）を確定する。完了条件: 4 観点それぞれに方針が記載される。
4. 4 route handler の書き換えパターン（before/after 概念図）を確定する。完了条件: 4 routes すべてに書き換え図が記載される。
5. middleware / next.config / package.json が変更不要な根拠を表で揃える。完了条件: 各対象に根拠が紐付く。
6. 副作用とリスクを表で整理する。完了条件: 6 件以上のリスクと緩和策が記載される。

## 参照資料

- index.md（task 本仕様 root）
- Phase 1（要件定義 改訂版）
- apps/web/src/lib/auth.ts
- apps/web/src/lib/auth/oauth-client.ts
- apps/web/app/api/auth/[...nextauth]/route.ts
- apps/web/app/api/auth/callback/email/route.ts
- apps/web/app/api/admin/[...path]/route.ts
- apps/web/app/api/me/[...path]/route.ts
- apps/web/middleware.ts
- apps/web/next.config.ts
- apps/web/package.json
- vercel/next.js issue #86178 / #84994 / #85668 / #87719
- nextauthjs/next-auth issue #13302
- @opennextjs/cloudflare 1.19.4 release notes（dynamic import 互換）

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成ではアプリケーションコード変更、deploy、commit / push / PR、dependency 更新を行わない
- 実コード変更は **Phase 5 で実施**、実測 evidence は **Phase 11 で取得**
- commit / push / PR は **user 指示後** に別経路で実施

## 統合テスト連携

- 上流: Phase 1（要件定義 改訂版）
- 下流: Phase 3（設計レビュー）/ Phase 4（テスト戦略：lazy factory mock 形式の統一） / Phase 5（実装手順 & コード差分） / Phase 11（実測 evidence）

## 多角的チェック観点

- 不変条件 #14: build 成果物に新規 KV / D1 / cron / Service Binding を追加しない
- 不変条件 #5: `apps/api` / D1 への変更ゼロ
- 不変条件 #16: build ログから secret 文字列を evidence に転記しない
- 未実装 / 未実測を PASS と扱わない: 設計表のみで build 成功と扱わない
- 公式 docs 通りの "use client" 必須記述に反する旧 first-choice (d) を再試行しない（Phase 1 に失敗履歴記録済）
- ESM 解決問題を新たに招く `serverExternalPackages` を採用しない（評価マトリクス c の不採用理由）

## サブタスク管理

- [ ] 評価マトリクスに Plan A + 失敗 first-choice 8 件を記録した
- [ ] Plan A 採用根拠を確定した
- [ ] lazy factory アーキテクチャ詳細（signature / dynamic import / cache / 型 export）を文書化した
- [ ] 4 route handler の書き換えパターン（before/after 概念図）を記載した
- [ ] middleware / next.config / package.json が変更不要な根拠を表で揃えた
- [ ] 副作用とリスクを表で整理した
- [ ] outputs/phase-02/main.md を作成した

## 成果物

- outputs/phase-02/main.md（採用方針 Plan A / 評価マトリクス（失敗 first-choice 8 件含む）/ lazy factory 設計 / 4 routes 書き換えパターン / 不変項目根拠 / 副作用とリスク）

## 完了条件

- Plan A（lazy factory `getAuth()` パターン）が採用根拠付きで確定している
- 失敗 first-choice 8 件すべてに不採用理由が表で記録され、index.md と一致している
- lazy factory アーキテクチャ詳細（signature / dynamic import 戦略 / cache 戦略 / 型 export 戦略）が確定している
- 4 route handler の書き換えパターン（before/after 概念図）がすべて記載されている
- middleware / next.config / package.json が変更不要な根拠が表で揃っている
- 依存パッケージのバージョン据置が AC-8 と整合している

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 失敗 first-choice の再試行を許容する記述がない
- [ ] 実装、deploy、commit、push、PR、dependency 更新を実行していない
- [ ] secret 値・実行ログ実値を記録していない

## 次 Phase への引き渡し

Phase 3（設計レビュー）へ次を渡す:

- Plan A 中核: `auth.ts` lazy factory `getAuth()` 化（top-level next-auth import 撤廃）+ `oauth-client.ts` の dynamic import + 4 routes の `await getAuth()` 経由化
- 不採用 8 件（旧 d / a / b / c / e / f / g / h）と各不採用理由
- lazy factory アーキテクチャ（signature / cache / 型 export）
- middleware / next.config / package.json が変更不要な根拠
- 副作用とリスク（await 漏れ / 初回 latency / mock 不整合 / bundle 影響 / Workers 互換 / 将来 ESM 変更）
- AC-1〜AC-9 整合、特に AC-6（top-level import 撤廃）/ AC-7（export shape 互換）/ AC-8（dependency 据置）/ AC-9（テスト PASS）
