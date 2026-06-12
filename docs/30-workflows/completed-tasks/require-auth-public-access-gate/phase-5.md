# Phase 5: 実装（Green 化）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 5 / 13 |
| 名称 | 実装 |
| 種別 | 実行仕様（プロダクションコード変更） |
| 前提 | Phase 4 の 6 spec が Red（FAIL）で確定済み |
| TDD 段階 | **Green**。Phase 4 の全 TC（TC-1-1〜TC-6-3）を GREEN にする |
| 同期制約 | **C2 の API ゲート（require-public-access 適用）と web fetch の cookie 転送は同一 wave で実装する**。片側だけ先行すると認証済みユーザーが 401 になる（Phase 3 §4 リスク） |
| 不変条件 | D1 直接アクセスは `apps/api` に閉じる（#5）。`apps/web` env は `apps/web/src/lib/env.ts` アクセサ経由・`process.env` 直接禁止（task-02）。OKLch トークン正本（HEX 直書き禁止・`verify-design-tokens` gate）。既存 primitive 再利用・新規 primitive / 新規 D1 migration 禁止（AC-12） |

## 目的

Phase 2 の target topology に沿って 8 ファイル（新規 2・編集 6）を実装し、Phase 4 の全 TC を GREEN 化する。
未認証では UI・API いずれからも情報が取得できない多層防御を成立させ、サーバー間消費者（sitemap / OG）のリグレッションを内部認証で吸収する。

## 実行タスク

### 5.1 変更対象ファイル一覧（新規 / 修正）[Feedback RT-03]

| # | ファイル | 種別 | concern | 責務 | 関連 TC |
|---|---------|------|---------|------|--------|
| C1-1 | `apps/web/src/components/auth/LoginRequiredNotice.tsx` | **新規** | C1 | 「ログインが必要です」案内画面（Server Component） | TC-1-1〜1-6 |
| C1-2 | `apps/web/app/(public)/layout.tsx` | **修正** | C1 | `getSession()` ゲートで未認証時に notice を返し children を render しない | TC-2-1〜2-8 |
| C2-1 | `apps/api/src/middleware/require-public-access.ts` | **新規** | C2 | 「会員セッション OR 内部認証」ガード middleware | TC-3-1〜3-10 |
| C2-2 | `apps/api/src/routes/public/index.ts` | **修正** | C2 | `createPublicRouter()` 冒頭に `requirePublicAccess()` を適用 | TC-4-1〜4-6 |
| C2-3 | `apps/web/src/lib/fetch/public.ts`（+ 必要なら `apps/web/src/lib/api/public.ts`） | **修正** | C2 | RSC 実行時に session cookie を API へ転送 | TC-4-6 / regression（Phase 6） |
| C2-4 | `apps/web/app/sitemap.ts` | **修正** | C2 | `/public/members` fetch に `X-Internal-Auth` 付与 | TC-6-1〜6-3 |
| C2-5 | `apps/og/src/member-source.ts` | **修正** | C2 | service binding fetch に `X-Internal-Auth` 付与・`OgEnv` 型に `INTERNAL_AUTH_SECRET` 追加 | TC-5-1〜5-3 |

> specs 4 ファイル（`00-overview.md` / `02-auth.md` / `06-member-auth.md` / `01-api-schema.md`）の更新は AC-11 として **Phase 12 Step 2** で実施する。本 Phase ではコード変更のみ。

### 5.2 各ファイルの実装方針

#### C1-1: `LoginRequiredNotice.tsx`（新規）

```tsx
export type LoginRequiredNoticeProps = {
  /** ログイン後に戻る pathname。未指定時は "/"。 */
  readonly redirectTo?: string;
};
export function LoginRequiredNotice(props: LoginRequiredNoticeProps): JSX.Element;
```

- **入出力**: 入力 `redirectTo?`（既定 `"/"`）。出力 = 案内画面 JSX。
- **副作用**: なし（純粋描画・Server Component・client directive 不要）。
- **実装内容**:
  - 既存 primitive（`Card` 系 / `Button` 系）を再利用してレイアウトを構成。新規 primitive を作らない。
  - 見出し「ログインが必要です」、説明文（会員限定である旨）、CTA「ログインする」を含める。
  - CTA は `next/link` の `Link` で `href={`/login?redirect=${encodeURIComponent(props.redirectTo ?? "/")}`}` を生成。
  - `data-testid="login-required-notice"` をルート要素、`data-testid="login-required-notice-cta"` を CTA に付与。
  - 色は OKLch トークン（`apps/web/src/styles/tokens.css`）経由のクラスのみ使用。HEX / `bg-[#xxx]` 禁止。
- **エラーハンドリング**: なし（props 純粋関数）。

#### C1-2: `(public)/layout.tsx`（修正）

- **実装内容**（Phase 2 §2.2 疑似コード準拠）:
  ```tsx
  const pathname = (await headers()).get("x-pathname") ?? "/";
  let session: Awaited<ReturnType<typeof getSession>> | null = null;
  try {
    session = await getSession();          // apps/web/src/lib/session.ts
  } catch {
    session = null;                        // fail-closed: throw は未認証扱い
  }
  if (!session) {
    return <LoginRequiredNotice redirectTo={pathname} />;
  }
  return (/* 既存 SidebarShellServer + children 構造をそのまま */);
  ```
- **入出力**: 入力 = `{ children }` + `x-pathname` ヘッダ。出力 = 未認証なら notice、認証済みなら既存 shell + children。
- **副作用**: `getSession()`（Auth.js JWT 検証）。D1 直接アクセスなし。
- **エラーハンドリング（fail-closed）**: `getSession()` の throw は `catch` で `session=null` に倒し notice を返す（AC-9）。未認証時は `SidebarShellServer` を描画せず（nav 経由の情報漏れ防止）、children も返さない（page の RSC データ取得を遮断・AC-5）。
- **重要**: 既存の shell 構築コード・import（`SidebarShellServer` / `SidebarMobileTrigger` 等）は認証済み分岐側に温存し、リグレッションを出さない（AC-4・TC-2-4/2-8）。

#### C2-1: `require-public-access.ts`（新規）

```ts
import type { MiddlewareHandler } from "hono";

export interface RequirePublicAccessEnv {
  readonly AUTH_SECRET?: string;
  readonly INTERNAL_AUTH_SECRET?: string;
}

export const requirePublicAccess = (): MiddlewareHandler<{
  Bindings: RequirePublicAccessEnv;
}> => async (c, next) => { /* ... */ };
```

- **入出力**: 入力 = Hono context（headers / cookies / env）。出力 = `next()` 到達 または `c.json({ error: ... }, 401)`。
- **判定ロジック（順序）**:
  1. **会員セッション検証**: `Authorization: Bearer <jwt>` を最優先、無ければ Cookie（`__Secure-authjs.session-token` / `authjs.session-token` / next-auth v4 互換名）から JWT を抽出。`require-admin.ts` の `SESSION_COOKIE_NAMES` / `parseCookie` / `verifySessionJwt`（`@ubm-hyogo/shared`）と同一基盤で検証する。**`isAdmin` 判定は行わない**（有効 session であれば可）。検証成功 → `next()`。
  2. **内部認証検証**: 1 が成立しない場合、`X-Internal-Auth` ヘッダ値と `c.env.INTERNAL_AUTH_SECRET` を **定数時間比較（timing-safe）** する。`INTERNAL_AUTH_SECRET` 未設定（falsy）なら内部経路は不成立（M-2）。一致 → `next()`。
  3. いずれも不成立 → `c.json({ error: "unauthorized" }, 401)`（既存 `require-admin` / `internal-auth` の 401 形に揃える）。
- **timing-safe 比較**: 長さ一致を前提とした XOR 累積比較（`crypto.subtle` 系または既存 util）で early-return しない。先頭一致・長さ差による短絡を避ける。
- **副作用**: なし（D1 を一切触らない・#5。lookup は session 発行時に解決済み）。
- **エラーハンドリング（fail-closed）**: JWT 検証 throw / `AUTH_SECRET` 未設定 / `INTERNAL_AUTH_SECRET` 未設定で内部ヘッダのみ → いずれも 401（公開しない・AC-9）。M-1 の共通ヘルパー抽出は Phase 8 で行い、本 Phase は `require-admin.ts` のロジックを参照実装する。

#### C2-2: `public/index.ts`（修正）

- **実装内容**: `createPublicRouter()` 内、各サブルート登録の **前** に `app.use("*", requirePublicAccess())` を 1 行追加する。
  ```ts
  const app = new Hono<{ Bindings: PublicEnv }>();
  app.use("*", requirePublicAccess());   // ← 追加
  statsRoute(app);
  membersRoute(app);
  /* memberProfileRoute / formPreviewRoute ... */
  return app;
  ```
- **副作用**: 全 `/public/*` endpoint がゲート下に入る。`PublicEnv` に `AUTH_SECRET` / `INTERNAL_AUTH_SECRET` が含まれることを型で確認（不足なら `PublicEnv` 型に追加）。
- **エラーハンドリング**: middleware 側に委譲。

#### C2-3: `fetch/public.ts`（+ 必要に応じ `api/public.ts`）（修正）

- **実装内容**: RSC から `/public/*` を取得する際、`next/headers` の `cookies()` を読んで API fetch の `Cookie` ヘッダへ転送する。既存 `apps/web/src/lib/fetch/authed.ts`（`/profile` 用 cookie 転送）のパターンを再利用する。
  - service binding 経路（`API_SERVICE.fetch`）・HTTP fetch 経路の両方に `Cookie` ヘッダを付与する。
  - cookie 値の取得は `next/headers` の `cookies()` 経由（RSC 限定）。
- **入出力**: 入力 = path / 既存引数 + RSC cookie。出力 = 既存どおり（fetch 結果）。
- **副作用**: `cookies()` 読み取り（RSC コンテキスト依存）。
- **エラーハンドリング**: cookie 不在（未認証）でも throw せず、Cookie ヘッダ無しで送る（その場合 API が 401 を返す。ただし C1 ゲートにより未認証では本関数自体が呼ばれない＝ TC-2-7）。
- **同期制約**: 本変更と C2-2（API ゲート）は同一 wave。先に C2-2 だけ landed すると認証済み RSC が cookie 未転送で 401 になる。

#### C2-4: `sitemap.ts`（修正）

- **実装内容**: `/public/members` への fetch に `headers: { "X-Internal-Auth": secret }` を付与する。`secret` は `apps/web/src/lib/env.ts` の `getAuthEnv()` または `getAdminFetchEnv()` から `INTERNAL_AUTH_SECRET ?? ""` で取得する（`process.env` 直接参照禁止・task-02）。
  ```ts
  const { INTERNAL_AUTH_SECRET } = getAuthEnv();   // または getAdminFetchEnv()
  fetch(url, { headers: { "X-Internal-Auth": INTERNAL_AUTH_SECRET ?? "" } });
  ```
- **入出力**: 出力 = sitemap entries（既存どおり・200 維持・AC-7）。
- **副作用**: env アクセサ読み取り。
- **エラーハンドリング**: secret 未設定なら `""` を送る（throw しない・TC-6-2）。

> `getAuthEnv()` / `getAdminFetchEnv()` に `INTERNAL_AUTH_SECRET` が未含有の場合、対応する env zod schema に optional フィールドを追加する（実値投入は `[vars]` ではなく Cloudflare Secrets 系。本 Phase は schema 受け口の追加のみ）。

#### C2-5: `member-source.ts`（修正）

- **実装内容**:
  - `OgEnv` 型に `readonly INTERNAL_AUTH_SECRET?: string;` を追加。
  - `API_SERVICE.fetch(new Request(url, { headers: { "X-Internal-Auth": env.INTERNAL_AUTH_SECRET ?? "" } }))` の形で header を付与。HTTP fallback 経路の `fetch(url, init)` 側にも同 header を付与する。
- **入出力**: 出力 = `MemberSummary | null`（既存どおり）。
- **副作用**: service binding / HTTP fetch（既存）。
- **エラーハンドリング**: secret 未設定なら `""`（TC-5-3・throw しない）。

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| 設計シグネチャ | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-2.md` §2-3 | 各実装の関数/型シグネチャ正本 |
| 既存 admin gate | `apps/api/src/middleware/require-admin.ts` | JWT 抽出（Bearer/Cookie）・`verifySessionJwt`・401 形 |
| 既存内部認証 | `apps/api/src/middleware/internal-auth.ts` | `x-internal-auth` ヘッダ名・比較・401 形 |
| 既存 authed fetch | `apps/web/src/lib/fetch/authed.ts` | C2-3 の cookie 転送パターン |
| env アクセサ | `apps/web/src/lib/env.ts`（`getAuthEnv`/`getAdminFetchEnv`/`getPublicFetchEnv`） | C2-3/C2-4 の env 参照（task-02 不変条件） |
| 既存 public fetch 経路 | `apps/web/src/lib/fetch/public.ts` / `transport-select.ts` | C2-3 の service binding / HTTP 分岐 |
| 既存 OG source | `apps/og/src/member-source.ts` | C2-5 の `OgEnv` / `API_SERVICE` 形 |
| design tokens | `apps/web/src/styles/tokens.css` | C1-1 の OKLch クラス |

## 実行手順

1. C1-1（`LoginRequiredNotice.tsx`）を新規実装し、F1（TC-1-1〜1-6）を GREEN にする。
2. C1-2（`(public)/layout.tsx`）を修正し、F2（TC-2-1〜2-8）を GREEN にする。
3. **C2-1（middleware）→ C2-2（router）→ C2-3（web fetch cookie 転送）を同一 wave で実装**し、F3・F4 を GREEN にする（同期制約厳守）。
4. C2-4（sitemap）・C2-5（og）を実装し、F5・F6 を GREEN にする。
5. typecheck を実行（型エラー 0 を確認）:
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/web typecheck
   mise exec -- pnpm --filter @ubm-hyogo/api typecheck
   mise exec -- pnpm --filter @ubm-hyogo/og typecheck
   ```
6. 各 targeted run（Phase 4 §実行手順のコマンド）を再実行し、全 TC が GREEN であることを確認する。
7. lint を実行:
   ```bash
   mise exec -- pnpm lint
   ```

## 統合テスト連携

- C1 と C2 を同一 PR の wave で実装することで「UI からも API からもログイン無しでは情報が取得できない」状態を成立させる。
- C2-2（API ゲート）と C2-3（web cookie 転送）の同期実装により、認証済みユーザーの RSC が 401 にならないことを保証（Phase 6 で regression 検証）。

## 多角的チェック観点（AIが判断）

- 同期制約の遵守: C2-2 と C2-3 の wave 分離は禁止（認証済み 401 リスク）。実装順序 3 で同 wave を明示。
- fail-closed の一貫性: C1-2（throw catch）・C2-1（env 未設定 / JWT 失敗 401）の両層で「判定不能 → 公開しない」を保持。
- env 不変条件: C2-4 で `process.env` 直接参照を禁止し env アクセサ経由に固定（task-02 / `127.0.0.1` 焼き込み禁止 grep gate に抵触しない）。
- M-1 の先送り明示: JWT 検証重複は本 Phase で `require-admin.ts` 参照実装に留め、共通ヘルパー抽出は Phase 8。

## サブタスク管理

- [ ] C1-1 `LoginRequiredNotice.tsx` 新規実装（F1 GREEN）
- [ ] C1-2 `(public)/layout.tsx` ゲート修正（F2 GREEN）
- [ ] C2-1 `require-public-access.ts` 新規実装（F3 GREEN）
- [ ] C2-2 `public/index.ts` に `requirePublicAccess()` 適用（F4 GREEN）
- [ ] C2-3 `fetch/public.ts` cookie 転送（C2-2 と同 wave）
- [ ] C2-4 `sitemap.ts` 内部認証付与（F6 GREEN）
- [ ] C2-5 `member-source.ts` 内部認証付与 + `OgEnv` 型拡張（F5 GREEN）
- [ ] typecheck（web / api / og）GREEN
- [ ] lint GREEN

## 成果物

| 成果物 | 配置 |
|--------|------|
| 案内画面 component | `apps/web/src/components/auth/LoginRequiredNotice.tsx`（新規） |
| public layout ゲート | `apps/web/app/(public)/layout.tsx`（修正） |
| API ガード middleware | `apps/api/src/middleware/require-public-access.ts`（新規） |
| public router 適用 | `apps/api/src/routes/public/index.ts`（修正） |
| web cookie 転送 | `apps/web/src/lib/fetch/public.ts`（+ `api/public.ts` 必要時）（修正） |
| sitemap 内部認証 | `apps/web/app/sitemap.ts`（修正） |
| OG 内部認証 | `apps/og/src/member-source.ts`（修正） |
| 本実行仕様 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-5.md` |

## 完了条件（DoD）

- [ ] 5.1 の変更対象ファイル（新規 2・修正 5、`api/public.ts` 必要時含む）が全て実装されている
- [ ] Phase 4 の全 TC（TC-1-1〜TC-6-3）が GREEN
- [ ] typecheck（`@ubm-hyogo/web` / `@ubm-hyogo/api` / `@ubm-hyogo/og`）が緑
- [ ] lint が緑（HEX 直書き 0・`verify-design-tokens` に抵触しない）
- [ ] C2-2（API ゲート）と C2-3（web cookie 転送）が同一 wave で landed している
- [ ] `apps/web` の env 参照が全て env アクセサ経由（`process.env` 直接参照 0）

## タスク100%実行確認【必須】

- [ ] 新規/修正ファイルパス一覧を種別付きの表で記載した [Feedback RT-03]
- [ ] 各ファイルの実装方針・シグネチャ・入出力・副作用・エラーハンドリング（fail-closed）を記述した
- [ ] C2 の API ゲートと web fetch を同一 wave とする同期制約を明記した
- [ ] typecheck / lint の実行コマンドと DoD を記述した

## 次Phase

[phase-6.md](phase-6.md) — テスト拡充（fail path・回帰 guard）
