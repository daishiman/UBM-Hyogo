[実装区分: 実装仕様書]

# Phase 8: DRY 化 — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 8 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Plan A（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + 4 route handler の `await getAuth()` 経由呼び出し + `oauth-client.ts` 動的 import 化）に伴って繰り返し出現する「`const { ... } = await getAuth();` パターン」が DRY 化対象になりうるかを評価し、helper 抽象を導入するか、4 箇所の素朴な反復を許容するかを文書として確定する。本 Phase ではコード変更を行わず、DRY 化方針と dead code 検出計画の文書化のみを実施する。

## 反復パターンの棚卸し

Plan A 適用後、以下 4 ファイルで「lazy factory 取得 → next-auth API 実行」の 1〜2 行ペアが反復する。

| # | ファイル | 反復パターン（概念形） | 取得対象 |
| --- | --- | --- | --- |
| R-1 | `apps/web/app/api/auth/[...nextauth]/route.ts` | `const { handlers } = await getAuth(); return handlers.GET(req);` / `handlers.POST(req)` | `handlers` |
| R-2 | `apps/web/app/api/auth/callback/email/route.ts` | `const { signIn } = await getAuth(); await signIn("email", { email, redirect: false });` | `signIn` |
| R-3 | `apps/web/app/api/admin/[...path]/route.ts` | `const { auth } = await getAuth(); const session = await auth();` | `auth` |
| R-4 | `apps/web/app/api/me/[...path]/route.ts` | `const { auth } = await getAuth(); const session = await auth();` | `auth` |

> 反復回数: 4 ファイル × 1〜2 callsite = **実コードで 4〜6 行**。route handler ごとに 1 callsite（GET/POST 別分割は R-1 のみ 2 callsite）。

## DRY 化選択肢の評価

| 案 | 概要 | 利点 | 欠点 | 採否 |
| --- | --- | --- | --- | --- |
| A. helper 関数 `withAuth(handler)` を新設 | `withAuth(async ({ auth, signIn, handlers, req }) => Response)` で wrap し callsite から `await getAuth()` を消す | 反復が 1 行で済む | (1) 抽象化のためだけに 1 ファイル新設 (2) 4 箇所程度では「3 similar lines is better than premature abstraction」原則に反する (3) handler の signature が間接化され Next 16 の route convention 検査を読みづらくする (4) route ごとの req 型 (`NextRequest` / `Request` / 動的 segment) を helper に閉じ込めると generics 複雑化 | **不採用** |
| B. `getAuth()` を各 route handler から直接呼ぶ（素朴な反復） | route handler 内で `const { ... } = await getAuth();` を 1 行書く | (1) 抽象ゼロで Plan A の意図（lazy 化）が読み取れる (2) Next 16 route convention に従う素のコード (3) 改修時の grep 起点が安定する | route handler 4 箇所に同じ 1 行が出る | **採用** |
| C. top-level で `let cached: AuthExports | null = null;` を持ち handler 内で `cached ??= await getAuth();` | 取得結果を手動キャッシュ | `getAuth()` 自体が内部キャッシュを持てば不要。手動キャッシュは race condition の温床 | **不採用**（キャッシュは `getAuth()` 内部の責務） |
| D. `auth.ts` 側で 4 つの専用 wrapper (`getHandlers()` / `getSignIn()` / `getAuthFn()`) を export | callsite から分割代入を消せる | export 数が増え、test mock 対象も増える。分割代入 1 行を消すだけの利益は小さい | **不採用** |

### 結論

**A / C / D を不採用、B を採用する。**

根拠:

1. CLAUDE.md / Clean Code 原則「3 similar lines is better than premature abstraction」: 4 callsite はこの閾値ぎりぎりであり、helper 化の保守コストが利益を上回る
2. Plan A の本質は「next-auth を build 時 prerender 経路から隔離する」ことであり、callsite の構文糖衣化はこの本質と直交する
3. helper を入れると `auth.ts` への依存が `getAuth` + `withAuth` の 2 経路になり、Phase 9 grep（top-level next-auth import 0 件確認）の対象が増える
4. `getAuth()` 内部に module-level promise cache を持たせれば、callsite 反復は単なる 1 行であり可読性は高い

## `getAuth()` 内部キャッシュ方針（Plan A 補足）

以下を `apps/web/src/lib/auth.ts` の `getAuth()` 実装に課す（Phase 5 実装ランブックで実装）:

| 項目 | 方針 |
| --- | --- |
| キャッシュ層 | module-level の `let cached: Promise<AuthExports> | null = null;`（Promise 自体を cache） |
| 初回呼び出し | `cached ??= (async () => { const NextAuth = (await import("next-auth")).default; ...; return { handlers, auth, signIn, signOut }; })();` |
| 並行呼び出し | Promise を cache するため複数 await が同じ Promise を await し、`NextAuth()` 二重実行を回避 |
| 失敗時 | reject された Promise が cache に残ると次回も同じ失敗を返す。Phase 6 で「cached をクリアして再試行する手段は持たない」と明記済（fail-fast） |

これにより callsite 側で手動 memoize を書く必要がなくなり、選択肢 C を排除できる。

## dead code 検出計画

Plan A 適用後、以下の旧経路が dead code として残存していないことを Phase 9 grep で検出する。

| ID | 旧経路（Plan A 前） | 検出方法 | 期待値 |
| --- | --- | --- | --- |
| DC-1 | `apps/web/app/api/auth/[...nextauth]/route.ts` の `export { GET, POST } from "../../../../src/lib/auth";` 直接再 export | `rg -n 'export \{ GET, POST \} from' apps/web/app/api/auth/` | 0 件 |
| DC-2 | `apps/web/src/lib/auth.ts` の top-level `import NextAuth from "next-auth"` | `rg -n '^import NextAuth from "next-auth"' apps/web/src/lib/auth.ts` | 0 件 |
| DC-3 | `apps/web/src/lib/auth.ts` の top-level `import GoogleProvider from "next-auth/providers/google"` | `rg -n '^import .* from "next-auth/providers/' apps/web/src/lib/auth.ts` | 0 件（value import のみ） |
| DC-4 | `apps/web/src/lib/auth.ts` の top-level `import CredentialsProvider from "next-auth/providers/credentials"` | 同上に含まれる | 0 件 |
| DC-5 | `apps/web/src/lib/auth.ts` の top-level value import `import { JWT } from "next-auth/jwt"` | `rg -n '^import \{[^}]*\} from "next-auth/jwt"' apps/web/src/lib/auth.ts`（`import type` は除外） | 0 件 |
| DC-6 | `apps/web/src/lib/auth/oauth-client.ts` の top-level `import { signIn } from "next-auth/react"` | `rg -n '^import \{ signIn \} from "next-auth/react"' apps/web/src/lib/auth/oauth-client.ts` | 0 件 |
| DC-7 | 旧 `handlers` / `auth` / `signIn` の named export（lazy factory 移行で消えるべきもの） | `rg -n '^export (const|async function) (handlers|GET|POST)' apps/web/src/lib/auth.ts` | 0 件（`getAuth` のみ export）|
| DC-8 | route handler 内に残存した未使用 `import { something } from "next-auth"`（Plan A 移行漏れ） | `rg -n 'from "next-auth' apps/web/app/api/` を type-only / dynamic import を除外して確認 | 0 件 |

## top-level type import の整理方針

Plan A の核心は「value import が prerender 経路に next-auth module-init を引き起こす」ことであり、TypeScript の `import type` / `import { type X }` は build 時に値として残らないため許容する。

| 種別 | 例 | 許容 / 禁止 | 理由 |
| --- | --- | --- | --- |
| value import | `import NextAuth from "next-auth"` | **禁止** | module-init 副作用が prerender 経路に流入し真因再発 |
| value import | `import { signIn } from "next-auth/react"` | **禁止** | 同上 |
| type-only import | `import type { Session, NextAuthConfig } from "next-auth"` | **許容** | TypeScript erase で build 成果物に残らない |
| type-only import | `import type { JWT } from "next-auth/jwt"` | **許容** | 同上 |
| inline type import | `import { type Adapter } from "next-auth/adapters"` | **許容** | 同上（ただし mixed value/type は禁止）|
| dynamic import | `const { signIn } = (await import("next-auth/react"));` | **許容** | 関数内で呼ばれる限り prerender 経路に出ない |

### 強制方針

- `apps/web/src/lib/auth.ts` および `apps/web/src/lib/auth/oauth-client.ts` は **`import type` 以外の `from "next-auth*"` を持たない**
- 4 route handler は `from "next-auth*"` を一切持たない（`getAuth()` 経由のみ）
- middleware (`apps/web/middleware.ts`) は不変（next-auth import 元から持たない）

## 変更対象ファイル一覧

| ファイル | 本 Phase での変更 | 備考 |
| --- | --- | --- |
| `apps/web/src/lib/auth.ts` | なし | Phase 5 実装ランブックで lazy factory 化 + 内部キャッシュ |
| `apps/web/src/lib/auth/oauth-client.ts` | なし | Phase 5 で dynamic import 化 |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | なし | Phase 5 で `getAuth()` 直接呼び出し（helper を作らない） |
| `apps/web/app/api/auth/callback/email/route.ts` | なし | 同上 |
| `apps/web/app/api/admin/[...path]/route.ts` | なし | 同上 |
| `apps/web/app/api/me/[...path]/route.ts` | なし | 同上 |
| 仕様書 | `outputs/phase-08/main.md` のみ追加 | DRY 化判定の文書化 |

## 関数 / コンポーネントシグネチャ（Phase 2 で確定済の再掲）

| 対象 | シグネチャ | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- | --- |
| `getAuth` (`src/lib/auth.ts`) | `() => Promise<{ handlers: { GET: Handler; POST: Handler }; auth: () => Promise<Session | null>; signIn: SignInFn; signOut: SignOutFn }>` | なし | next-auth instance の関数群（Promise 経由） | 初回のみ next-auth module 動的 import を実行 |
| route handler (4 箇所) | Next 16 App Router 規約準拠の `async function GET/POST(req: NextRequest, ctx)` | NextRequest / dynamic segment | Response | `await getAuth()` 経由で next-auth API を呼ぶ |
| `oauth-client.ts` の sign-in 起動関数 | `async (provider, options) => Promise<void>` | provider id / options | void | `await import("next-auth/react")` を関数内で実行 |

## DRY 化が崩れる兆候の検知

| 兆候 | 検知方法 | 対応 |
| --- | --- | --- |
| route handler に `import * from "next-auth"` が混入 | `rg -n 'from "next-auth' apps/web/app/api/` で type-only / dynamic import 以外を検出 | Plan A 違反 / 真因再発のため即時 revert |
| `auth.ts` に `import NextAuth from "next-auth"` 等 value import が再混入 | DC-2〜DC-5 grep | 即時 revert |
| `oauth-client.ts` の top-level `signIn` import 復活 | DC-6 grep | 即時 revert |
| 旧 `export { GET, POST } from "src/lib/auth"` が残存 | DC-1 grep | 削除し `getAuth()` 経由に統一 |
| handler 数が増えて helper 化の閾値（5 callsite 以上）を超える | Phase 12 implementation-guide.md にガイドを残す | 5 callsite 超過時に再評価。本タスクでは導入しない |

## ローカル実行コマンド

本 Phase は文書化のみのため実行コマンドはなし。Phase 9 で以下を実走する想定として予告する。

```bash
# DC-1: 旧 named re-export の残存確認
rg -n 'export \{ GET, POST \} from' apps/web/app/api/

# DC-2〜DC-5: auth.ts の top-level value import 残存確認
rg -n '^import [^t]' apps/web/src/lib/auth.ts | rg 'from "next-auth'

# DC-6: oauth-client.ts の top-level signIn import 残存確認
rg -n '^import \{ signIn \} from "next-auth/react"' apps/web/src/lib/auth/oauth-client.ts

# DC-7: lazy factory 以外の value export 残存確認
rg -n '^export (const|async function|function) (handlers|GET|POST|signIn|signOut)\b' apps/web/src/lib/auth.ts

# DC-8: route handler の next-auth value import 残存確認
rg -n '^import [^t][^ ]*[^ ] from "next-auth' apps/web/app/api/
```

## 実行タスク

1. Plan A 適用後の反復パターン R-1〜R-4 を棚卸しする。完了条件: 4 ファイル × callsite 数が表で揃う。
2. DRY 化選択肢 A〜D を評価し採否を確定する。完了条件: 各案に利点・欠点・採否が付き、結論として B（素朴な反復）が採用される。
3. `getAuth()` 内部キャッシュ方針を確定する。完了条件: module-level Promise cache の設計が明記される。
4. dead code 検出計画 DC-1〜DC-8 を確定する。完了条件: 8 件の grep と期待値が表で揃う。
5. top-level type import 整理方針を確定する。完了条件: value / type-only / dynamic の許容マトリクスが完成し、強制方針が明記される。
6. DRY 化崩れの兆候検知方法を 5 件以上記述する。完了条件: 兆候・検知方法・対応が表で揃う。

## 参照資料

- Phase 1（要件定義 / 真因 / 影響範囲）
- Phase 2（採用方針 Plan A / lazy factory アーキテクチャ）
- Phase 3（設計レビュー）
- Phase 5（実装ランブック / コード差分）
- apps/web/src/lib/auth.ts（現行）
- apps/web/src/lib/auth/oauth-client.ts（現行）
- apps/web/app/api/auth/[...nextauth]/route.ts（現行）
- apps/web/app/api/auth/callback/email/route.ts（現行）
- apps/web/app/api/admin/[...path]/route.ts（現行）
- apps/web/app/api/me/[...path]/route.ts（現行）
- CLAUDE.md（"3 similar lines is better than premature abstraction" 原則）
- Next.js 16 App Router route convention docs

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成ではアプリケーションコード変更、deploy、commit / push / PR、dependency 更新を行わない
- helper 抽象（`withAuth`）は本タスクで実装しない（B 採用のため不要）

## 統合テスト連携

- 上流: Phase 2（lazy factory 採用方針）/ Phase 5（実装ランブック）/ Phase 7（AC マトリクス）
- 下流: Phase 9（DC-1〜DC-8 grep を実走 + 4 ゲート実走）/ Phase 10（DRY 化判定の妥当性を最終レビュー）

## 多角的チェック観点

- 不変条件 #5: `apps/web` 内に閉じる（`apps/api` / D1 不変）
- 不変条件 #14: helper 化を避けることで bundle size 増加を回避
- 不変条件 #16: secret 文字列は本 Phase で扱わない
- CONST_004: 本タスクは実装区分=実装仕様書。コード変更は Phase 5 / 6 で行い本 Phase は文書化のみ
- CONST_005: helper 抽象を premature に導入しない判断は単一サイクル内で完結
- CONST_007: 本タスク内で DRY 評価 → dead code 検出計画まで完結（追加サイクル不要）
- 未実装 / 未実測を PASS と扱わない: B 採用は「DRY 化が不要であることの構造的根拠」を示した結果であり、判定回避ではない
- prerender 経路に top-level value import を持ち込まない方針を Phase 12 implementation-guide.md に持ち越す

## DoD（Definition of Done）

- 反復パターン R-1〜R-4 が 4 ファイル × callsite 数で棚卸しされている
- DRY 化選択肢 A〜D が評価され、B（素朴な反復）が採用根拠付きで確定している
- `getAuth()` 内部キャッシュ方針が明記されている
- dead code 検出計画 DC-1〜DC-8 が grep と期待値で揃っている
- top-level type import 整理方針（value 禁止 / type-only 許容 / dynamic 許容）が明記されている
- DRY 化崩れの兆候検知方法 5 件以上が表で揃っている
- 本 Phase でコード変更を行っていない
- `outputs/phase-08/main.md` が作成されている

## サブタスク管理

- [ ] 反復パターン R-1〜R-4 を棚卸しした
- [ ] DRY 化選択肢 A〜D を評価し B 採用を確定した
- [ ] `getAuth()` 内部キャッシュ方針を確定した
- [ ] dead code 検出計画 DC-1〜DC-8 を確定した
- [ ] top-level type import 整理方針を確定した
- [ ] DRY 化崩れの兆候検知方法を記述した
- [ ] outputs/phase-08/main.md を作成した

## 成果物

- outputs/phase-08/main.md（反復パターン棚卸し / DRY 選択肢評価 / `getAuth()` 内部キャッシュ方針 / dead code 検出計画 DC-1〜DC-8 / type import 整理方針 / 兆候検知方法）

## 完了条件

- Plan A 適用後の反復パターンが「helper 抽象を導入せず素朴な 1 行を許容」と構造的根拠付きで確定している
- dead code 検出計画 DC-1〜DC-8 が Phase 9 grep として引き継ぎ可能になっている
- top-level value import 禁止 / type-only 許容の境界が明文化され、Plan A の本質（prerender 隔離）と整合している

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR、dependency 更新を実行していない
- [ ] helper 抽象 (`withAuth`) を実装していない（B 採用のため不要）

## 次 Phase への引き渡し

Phase 9（品質保証）へ次を渡す:

- 反復パターン棚卸し（R-1〜R-4）
- DRY 化判定（B 採用 = 素朴な反復、helper 不要）
- `getAuth()` 内部キャッシュ方針（module-level Promise cache）
- dead code 検出計画 DC-1〜DC-8（Phase 9 grep として実走）
- top-level type import 整理方針（value 禁止 / type-only 許容 / dynamic 許容）
- 「Plan A 経路以外の next-auth import を持たない」という不変ルール
