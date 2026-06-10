# Phase 2: 設計（設計書）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 2 / 13 |
| 名称 | 設計 |
| 種別 | 設計書 |
| concern 数 | 2（C1: Web UI gate / C2: API gate + server-to-server）→ concern ごとにセクション分割 |
| lane 数 | 2（3 以下） |

## 目的

C1 / C2 の target topology・関数/型シグネチャ・データフロー・state 所有権・doc 更新方針を確定し、
Phase 4（テスト作成）が迷わず TDD Red を書ける粒度にする。

## 実行タスク

1. C1 / C2 の target topology を表で確定する（第 1 節）。
2. C1 のコンポーネント / layout ゲートのシグネチャと state 所有権を定義する（第 2 節）。
3. C2 のガード middleware シグネチャ・router 適用・サーバー間内部認証・cookie 転送を定義する（第 3 節）。
4. ドキュメント（specs 4 ファイル）更新方針を表で確定する（第 4 節）。

## 参照資料

| 参照資料 | パス | 内容 |
|---------|------|------|
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 認証フロー・`/login` 状態 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | 公開境界・フィールド可視性 |
| セキュリティ | `.claude/skills/aiworkflow-requirements/references/security-*.md` | 認証境界・fail-closed |
| API/IPC | `.claude/skills/aiworkflow-requirements/references/api-*.md` | API 契約整合 |

## 1. Target Topology

| concern | 層 | 変更/新規ファイル | 種別 | 責務 |
|---------|----|------------------|------|------|
| C1 | web 表現/認証境界 | `apps/web/src/components/auth/LoginRequiredNotice.tsx` | 新規 | 「ログインが必要です」案内画面（タイトル・説明・ログインボタン） |
| C1 | web layout | `apps/web/app/(public)/layout.tsx` | 編集 | `getSession()` で session 検証し、未認証なら `LoginRequiredNotice` を描画して children を render しない |
| C2 | api middleware | `apps/api/src/middleware/require-public-access.ts` | 新規 | 「会員セッション OR 内部認証」を検証し、いずれも無ければ 401 |
| C2 | api router | `apps/api/src/routes/public/index.ts` | 編集 | `createPublicRouter()` 冒頭に `requirePublicAccess` を適用 |
| C2 | web public fetch | `apps/web/src/lib/api/public.ts` / `apps/web/src/lib/fetch/public.ts` | 編集 | RSC 実行時に session cookie を API へ転送 |
| C2 | web sitemap | `apps/web/app/sitemap.ts` | 編集 | `/public/members` 取得時に `X-Internal-Auth` を付与 |
| C2 | og worker | `apps/og/src/member-source.ts` | 編集 | service binding fetch に `X-Internal-Auth` を付与（`INTERNAL_AUTH_SECRET` を env から取得） |
| 全体 | specs | `00-overview.md` / `02-auth.md` / `06-member-auth.md` / `01-api-schema.md` | 編集 | アクセス制御記述を「全ルート認証必須」へ更新 |

## 2. C1: Web UI 認証ゲート 設計

### 2.1 コンポーネントシグネチャ

```tsx
// apps/web/src/components/auth/LoginRequiredNotice.tsx
// 既存 primitive（Card / Button 系）を再利用。新規 primitive を生やさない。HEX 直書き禁止（OKLch トークン）。
export type LoginRequiredNoticeProps = {
  /** ログイン後に戻る pathname。未指定時は "/"。/login?redirect=<value> を生成する。 */
  readonly redirectTo?: string;
};

export function LoginRequiredNotice(props: LoginRequiredNoticeProps): JSX.Element;
```

- 表示要素: 見出し「ログインが必要です」、説明文（会員限定である旨）、`<a>`/Link「ログインする」→ `/login?redirect=<encodeURIComponent(redirectTo)>`。
- `data-testid="login-required-notice"`、ボタンに `data-testid="login-required-notice-cta"` を付与（テスト・回帰の機械可読 anchor）。
- Server Component で良い（インタラクションは Link 遷移のみ）。client 不要。

### 2.2 layout ゲート（state 所有権 = web 認証境界）

```tsx
// apps/web/app/(public)/layout.tsx（疑似コード）
const pathname = (await headers()).get("x-pathname") ?? "/";
const session = await getSession();           // apps/web/src/lib/session.ts
if (!session) {
  // fail-closed: 未認証は本来コンテンツも shell も最小化し、notice のみ描画
  return <LoginRequiredNotice redirectTo={pathname} />;
}
// 認証済みは従来どおり SidebarShellServer + children を描画
return (/* 既存 shell 構造 */);
```

- **重要設計根拠（AC-5）**: App Router の layout が `{children}` を返さない場合、`children`（= page element）は React ツリーに render されないため、page の async server component 関数が実行されず、内部の `/public/*` データ取得が走らない。これにより「未認証でも情報が事前 fetch される」漏れを防ぐ。
- `getSession()` が throw した場合も fail-closed（catch して未認証扱い＝ notice 表示）。
- shell（`SidebarShellServer`）は未認証時に描画しない（nav から会員情報が漏れないため）。

### 2.3 state 所有権・遷移

| state | 所有者 | 値 |
|-------|--------|-----|
| 認証状態 | `getSession()`（Auth.js JWT） | `session \| null` |
| redirect 先 | `x-pathname`（middleware 注入・既存） | string |
| 描画分岐 | `(public)/layout.tsx` | `session ? children : notice` |

## 3. C2: API アクセスゲート + サーバー間内部認証 設計

### 3.1 ガード middleware シグネチャ

```ts
// apps/api/src/middleware/require-public-access.ts
import type { MiddlewareHandler } from "hono";

export type RequirePublicAccessEnv = {
  AUTH_SECRET?: string;          // 会員セッション JWT 検証用（既存 require-admin と同基盤）
  INTERNAL_AUTH_SECRET?: string; // サーバー間内部認証
};

/**
 * /public/* のアクセスゲート。以下のいずれかを満たせば next()、いずれも無ければ 401。
 *  1. 有効な会員セッション（Cookie authjs.session-token または Authorization: Bearer <jwt>）
 *  2. 内部サービス認証（X-Internal-Auth: <INTERNAL_AUTH_SECRET>）
 * fail-closed: env 未設定・検証失敗時は 401。
 */
export const requirePublicAccess = (): MiddlewareHandler => { /* ... */ };
```

- 会員セッション検証は **既存 `require-admin.ts` / `session-guard.ts` の JWT 検証ロジックを再利用**（`isAdmin` 判定は不要・有効な session であれば可）。内部実装の共通化は Phase 8 で検討。
- 内部認証は定数時間比較（timing-safe）で `X-Internal-Auth === INTERNAL_AUTH_SECRET` を判定。
- 401 レスポンス形は既存 `require-admin` の 401/403 形（`{ error: ... }`）に揃える。

### 3.2 内部型 → 役割 対応表（FB-SDK-07 / SC-13-2 対策）

| 入口 | 認証手段 | 用途 |
|------|---------|------|
| ブラウザ（認証済み会員） | Cookie session（web RSC が転送） | UI 経由の公開データ閲覧 |
| sitemap 生成（web server） | `X-Internal-Auth` | sitemap.xml 用メンバー URL 列挙 |
| OG 画像ワーカー（apps/og） | `X-Internal-Auth`（service binding） | OG 画像生成用メンバー情報 |
| 外部の未認証アクセス | なし | **401**（情報を返さない） |

### 3.3 router 適用

```ts
// apps/api/src/routes/public/index.ts
export const createPublicRouter = (): Hono<{ Bindings: PublicEnv }> => {
  const app = new Hono<{ Bindings: PublicEnv }>();
  app.use("*", requirePublicAccess());   // ← 追加：全 public endpoint をゲート
  statsRoute(app);
  membersRoute(app);
  memberProfileRoute(/* ... */);
  formPreviewRoute(app);
  return app;
};
```

### 3.4 サーバー間消費者の内部認証付与

```ts
// apps/web/app/sitemap.ts — fetch に header 追加
fetch(`${env.INTERNAL_API_BASE_URL}/public/members?limit=100&page=${page}`, {
  headers: { "X-Internal-Auth": env.INTERNAL_AUTH_SECRET ?? "" },
});

// apps/og/src/member-source.ts — service binding request に header 追加
env.API_SERVICE.fetch(
  new Request(`https://api.service.local/public/members/${encodeURIComponent(memberId)}`, {
    headers: { "X-Internal-Auth": env.INTERNAL_AUTH_SECRET ?? "" },
  }),
);
```

- `INTERNAL_AUTH_SECRET` は `apps/web` 側では `getAuthEnv()`/`getAdminFetchEnv()` 経由で取得（task-02 不変条件・`process.env` 直接参照禁止）。`apps/og` は env binding を型に追加。
- env が未設定の local では既存挙動を壊さないよう、Phase 2 決定: **local/test では API ゲートを内部認証 OR session で必ず通す**。`INTERNAL_AUTH_SECRET` 未設定環境の扱いは Phase 4 テストで明示（未設定なら内部経路は 401・session 経路は通る）。

### 3.5 web RSC の session cookie 転送

```ts
// apps/web/src/lib/api/public.ts / fetch/public.ts
// RSC から呼ぶ際、next/headers の cookies() を読み、API fetch の Cookie ヘッダへ転送する。
// 既存 fetchAuthed（/profile 用）の cookie 転送パターンを再利用する。
```

- `getPublicFetchEnv()` ベースの fetch を「session cookie 転送付き」に拡張する。実装方針は Phase 5 で確定（既存 `apps/web/src/lib/fetch/` の authed fetch を参照）。

## 4. ドキュメント更新方針（AC-11）

| spec | 更新箇所 | 変更内容 |
|------|---------|---------|
| `00-overview.md` | 3 層アクセス制御・公開フロー | 「公開層は未ログインでも閲覧可」→「全ルートは認証必須（`/login` を除く）。未認証は案内画面」 |
| `02-auth.md` | 認証境界 | 公開ルートも認証必須である旨を追記 |
| `06-member-auth.md` | 可視性テーブル | public（未ログイン可）行を「会員以上のみ」へ是正 |
| `01-api-schema.md` | 公開 API 境界 | `/public/*` は会員セッション or 内部認証必須である旨を追記。フィールド可視性 `public` の意味を「認証済み会員に見せる最小フィールド」へ注記 |

## 統合テスト連携

- C1: layout ゲートの単体テスト（jsdom は `@media` 非適用のため display 系は対象外、session 分岐のみ検証）。
- C2: public router contract spec（401/200）+ middleware 単体 spec + og/sitemap header spec。

## 多角的チェック観点（AIが判断）

- 依存関係: C2 の web fetch 変更は C2 の API ゲートと同期必須（同一 wave）。片側のみだと認証済みユーザーが 401 になる。Phase 5 で同時実装。
- 責務境界: `Facade`（layout）/`Middleware`（api guard）/`Fetch`（web client）の所有権を混在させない。
- トレードオフ: API ゲートを「全 session 必須」にせず「session OR 内部認証」にすることで、サーバー間消費者（sitemap/OG）を壊さない pragmatic 設計。

## サブタスク管理

- [ ] C1 topology / シグネチャ確定
- [ ] C2 middleware / router / 消費者 / fetch 確定
- [ ] doc 更新方針確定

## 成果物

| 成果物 | 配置 |
|--------|------|
| 設計書（本書） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-2.md` |

## 完了条件

- [ ] C1 / C2 の topology が表で固定されている
- [ ] 関数/型シグネチャが記載されている
- [ ] データフロー（cookie 転送・内部認証）が明示されている
- [ ] doc 更新方針が表で固定されている

## タスク100%実行確認【必須】

- [ ] C1・C2・doc 更新の設計を漏れなく記述した

## 次Phase

[phase-3.md](phase-3.md) — 設計レビュー（Phase 4 開始 gate）
