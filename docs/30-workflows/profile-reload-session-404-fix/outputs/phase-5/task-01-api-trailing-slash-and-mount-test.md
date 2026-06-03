# task-01: `apps/api` の全 route 共通 trailing-slash 正規化 middleware 追加 + フルアプリ・マウント統合テスト

[実装区分: 実装仕様書]

> 判定根拠: CONST_004 に従う。本タスクは `apps/api/src/middleware/trailing-slash.ts`（新規）・`apps/api/src/index.ts`（編集）・テスト 2 ファイル（新規）を追加してルート解決層の 404 を根治するもので、コード変更を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
|------|------|
| ワークフロー | `profile-reload-session-404-fix` |
| 親 Phase | Phase 5（実装） |
| ブランチ | `docs/profile-reload-session-404-fix-spec`（実装サイクルで feature ブランチへ） |
| 起点 | `origin/dev` (bd0393a29) |
| visualEvidence | NON_VISUAL（HTTP status / Location ヘッダで判定） |
| 想定 PR base | `dev` |
| 並列性 | T02 / T03 と相互非依存（並列実装可） |

## 背景

`apps/api` は Hono 4.12.18 で `app.route("/me", createMeRoute(...))` + サブアプリ `app.get("/", ...)` の構成を取る。この組合せでは `GET /me` → 200 だが `GET /me/`（末尾スラッシュ）→ 404（`app.notFound(notFoundHandler)`）になる。`/me` 成功系には 404 分岐が存在せず（`sessionGuard` は 401/410 のみ、ハンドラは 200）、末尾スラッシュ起因の 404 がそのまま露出する。加えて既存 contract テスト（`apps/api/src/routes/me/index.contract.spec.ts`）は `createMeRoute` のサブアプリへ `app.request("/")` で直接当てており、フルアプリ・マウント経由の解決を検証していないため、この種の回帰を検知できない。詳細は `outputs/phase-1/phase-1.md` §1.2 参照。

## 目的

全 route 共通の trailing-slash 正規化 middleware を新規追加し、末尾スラッシュ付き要求を 308 で末尾スラッシュ無し URL へリダイレクトすることで、`/me/` を含む全 route の末尾スラッシュ起因 404 を根治する。あわせてフルアプリ（`apps/api/src/index.ts` の `app`）をマウント経由で叩く統合テストを追加し、`GET /me`（認証なし）が 404 ではなく 401 を返すこと・`GET /me/` が 308 になることを保証して再発を検知する。`/me` ハンドラのロジック・レスポンス shape・D1 schema は一切変更しない。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
|------|---------|------|
| `apps/api/src/middleware/trailing-slash.ts` | 新規 | `trailingSlashRedirect()` middleware を export。pathname が `/` 以外で末尾 `/` のとき 308 redirect |
| `apps/api/src/index.ts` | 編集 | `import { trailingSlashRedirect } from "./middleware/trailing-slash";` を追加し、`app.use("*", corsFromEnv());` の直後・`app.notFound(...)` より前に `app.use("*", trailingSlashRedirect());` を登録 |
| `apps/api/src/middleware/__tests__/trailing-slash.spec.ts` | 新規 | middleware 単体 unit テスト |
| `apps/api/src/__tests__/me-route-mount.integration.spec.ts` | 新規 | フルアプリ `app` を import し mount 経由で `/me` / `/me/` を検証 |

それ以外のファイルは無編集。

## 2. 主要な関数・型・モジュールのシグネチャまたは構造（CONST_005 必須）

```ts
// apps/api/src/middleware/trailing-slash.ts
import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

/**
 * 全 route 共通の trailing-slash 正規化 middleware。
 * pathname が "/" 以外で末尾 "/" のとき、末尾スラッシュ無し URL (+ search) へ 308 redirect する。
 * - 非 OPTIONS のときのみ発火（OPTIONS は corsFromEnv が先に 204 を返すため到達しない前提だが二重で除外）。
 * - pathname === "/" は対象外（ルートを redirect ループさせない）。
 * - 308 (Permanent Redirect) はメソッド・body を保持する。
 */
export const trailingSlashRedirect =
  (): MiddlewareHandler<{ Bindings: Env }> =>
  async (c, next) => {
    if (c.req.method !== "OPTIONS") {
      const url = new URL(c.req.url);
      if (url.pathname !== "/" && url.pathname.endsWith("/")) {
        const normalizedPath = url.pathname.replace(/\/+$/, "");
        return c.redirect(`${normalizedPath}${url.search}`, 308);
      }
    }
    return next();
  };
```

`apps/api/src/index.ts` の登録（既存 `app.use("*", corsFromEnv());`〔現 191 行〕の直後に 1 行追加）:

```ts
app.use("*", securityHeaders());
app.use("*", corsFromEnv());
app.use("*", trailingSlashRedirect()); // 追加: route mount より前

app.notFound(notFoundHandler);
```

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
|------|------|
| 入力 | Hono `Context`（`c.req.url` / `c.req.method`）と `next` |
| 出力（発火時） | `c.redirect("<末尾スラッシュ除去後 pathname><search>", 308)` を return（`next()` は呼ばない） |
| 出力（非発火時） | `next()`（後続 middleware / handler のレスポンスをそのまま通す。レスポンス非改変） |
| 副作用 | なし。D1・R2・外部 fetch を一切触らない。状態を持たない純粋な path 判定 |
| 登録順依存 | `corsFromEnv()` の後・全 `app.route(...)` mount より前。これにより OPTIONS は corsFromEnv で先に 204 を返し、正規化は GET/POST 等の末尾スラッシュ付き要求のみに作用する |

## 4. 編集差分（unified diff）

```diff
--- /dev/null
+++ b/apps/api/src/middleware/trailing-slash.ts
@@
+import type { MiddlewareHandler } from "hono";
+
+import type { Env } from "../env";
+
+/**
+ * 全 route 共通の trailing-slash 正規化 middleware。
+ * pathname が "/" 以外で末尾 "/" のとき、末尾スラッシュ無し URL (+ search) へ 308 redirect する。
+ * - 非 OPTIONS のときのみ発火（OPTIONS は corsFromEnv が先に 204 を返す）。
+ * - pathname === "/" は対象外（ルートを redirect ループさせない）。
+ * - 308 (Permanent Redirect) はメソッド・body を保持する。
+ */
+export const trailingSlashRedirect =
+  (): MiddlewareHandler<{ Bindings: Env }> =>
+  async (c, next) => {
+    if (c.req.method !== "OPTIONS") {
+      const url = new URL(c.req.url);
+      if (url.pathname !== "/" && url.pathname.endsWith("/")) {
+        const normalizedPath = url.pathname.replace(/\/+$/, "");
+        return c.redirect(`${normalizedPath}${url.search}`, 308);
+      }
+    }
+    return next();
+  };
```

```diff
--- a/apps/api/src/index.ts
+++ b/apps/api/src/index.ts
@@ -60,6 +60,7 @@ import { errorHandler, notFoundHandler } from "./middleware/error-handler";
 import { corsFromEnv, securityHeaders } from "./middleware/security-headers";
+import { trailingSlashRedirect } from "./middleware/trailing-slash";
 import { createPublicRouter } from "./routes/public";
@@ -189,6 +190,7 @@ const app = new Hono<{ Bindings: Env }>();
 
 app.use("*", securityHeaders());
 app.use("*", corsFromEnv());
+app.use("*", trailingSlashRedirect());
 
 app.notFound(notFoundHandler);
 app.onError(errorHandler);
```

> 上記 diff の行番号は現行 `apps/api/src/index.ts`（import 群 60 行付近 / `const app = new Hono` 188 行付近）に対応。`import` は `corsFromEnv` import の直後、登録は `corsFromEnv()` 行の直後に置く。

## 5. テスト方針（CONST_005 必須）

新規 test は `*.spec.ts`（不変条件 #8）。両ファイルとも `// @vitest-environment node` を先頭付近に置く（既存 contract spec と同様、Worker ランタイム型を使うため）。

### 5.1 `apps/api/src/middleware/__tests__/trailing-slash.spec.ts`（unit）

`trailingSlashRedirect()` を小さな Hono アプリにマウントし `app.request(...)` で検証する。

| TC-ID | ケース名 | 入力 | 期待 |
|-------|---------|------|------|
| TC-T01-U1 | 末尾スラッシュ付き path は 308 で除去後 path へ redirect | `app.request("/me/", { method: "GET" })` | `status=308` / `Location` の pathname 部が `/me` |
| TC-T01-U2 | search を保持して redirect する | `app.request("/me/?limit=5")` | `status=308` / `Location` に `?limit=5` を含み pathname が `/me` |
| TC-T01-U3 | 末尾スラッシュ無し path は素通し（後続 handler に到達） | `app.request("/me")`（後続に 200 ダミー handler） | `status=200`（redirect しない） |
| TC-T01-U4 | ルート `/` は対象外（redirect しない） | `app.request("/")`（後続 200） | `status=200` |
| TC-T01-U5 | 多重末尾スラッシュも単一 path へ正規化 | `app.request("/me//")` | `status=308` / `Location` pathname が `/me` |
| TC-T01-U6 | OPTIONS は発火しない（後続に委譲） | `app.request("/me/", { method: "OPTIONS" })`（後続 204） | `status=204`（308 ではない） |

> `Location` の検証は `new URL(res.headers.get("location")!, "http://localhost").pathname` / `.search` で行い、相対/絶対表現の差異を吸収する。

### 5.2 `apps/api/src/__tests__/me-route-mount.integration.spec.ts`（フルアプリ・マウント統合）

`apps/api/src/index.ts` の `default export` から `app`（`fetch`）を経由してマウント解決を検証する。`index.ts` は `app` を直接 export していないため、`import worker from "../index";` の `worker.fetch(new Request(...), env, ctx)` を用いるか、`index.ts` に `export { app }` を加えず**新規テスト内で `worker.fetch` を呼ぶ**方式とする（既存 export を壊さない）。認証ヘッダ（cookie / Authorization / `x-ubm-dev-session`）は付けない。`env` は最小 stub（`ALLOWED_ORIGINS` 未設定で可。D1 は `/me` 401 到達前の `sessionGuard` で止まるため不要だが、型を満たす最小 stub を渡す）。

| TC-ID | ケース名 | 入力 | 期待 |
|-------|---------|------|------|
| TC-T01-I1 | `GET /me`（認証なし）は 404 ではなく 401 | `worker.fetch(new Request("https://api.test/me"), env, ctx)` | `status=401`（**404 でないこと**） |
| TC-T01-I2 | `GET /me`（認証なし）の body に memberId が漏れない | 同上 | body テキストに `m_` 等の memberId 断片を含まない（未認証） |
| TC-T01-I3 | `GET /me/`（末尾スラッシュ）は 308 で `/me` へ | `worker.fetch(new Request("https://api.test/me/"), env, ctx)`（redirect 非追従） | `status=308` / `Location` pathname が `/me` |
| TC-T01-I4 | `GET /`（ルート）は 200 を維持（非回帰） | `worker.fetch(new Request("https://api.test/"), env, ctx)` | `status=200` |

> `ctx` は `{ waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext`。fetch helper は redirect を追従しないよう、テストでは `worker.fetch` の戻り Response を直接検査する（Hono `c.redirect` は Response を返すため追従は発生しない）。

## 6. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. ブランチ確認
git branch --show-current

# 2. 依存
mise exec -- pnpm install

# 3. 型 / lint
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint

# 4. 本タスクの追加テスト（ルートから filter 指定で実行）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  src/middleware/__tests__/trailing-slash.spec.ts \
  src/__tests__/me-route-mount.integration.spec.ts

# 5. 既存 /me contract の非回帰
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  src/routes/me/index.contract.spec.ts
```

## 7. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
|----|------|------|
| DoD-T01-1 | `apps/api/src/middleware/trailing-slash.ts` が新規追加され `trailingSlashRedirect` を export | `git diff --name-only` / `import` 解決 |
| DoD-T01-2 | `apps/api/src/index.ts` で `app.use("*", trailingSlashRedirect());` が `corsFromEnv()` の直後・route mount より前に登録されている | `git diff apps/api/src/index.ts` |
| DoD-T01-3 | TC-T01-U1〜U6 が PASS | §6 手順 4 |
| DoD-T01-4 | TC-T01-I1〜I4 が PASS（`/me`→401・`/me/`→308・`/`→200） | §6 手順 4 |
| DoD-T01-5 | 既存 `index.contract.spec.ts` が非回帰で PASS | §6 手順 5 |
| DoD-T01-6 | `typecheck` / `lint` が exit 0 | §6 手順 3 |
| DoD-T01-7 | `/me` ハンドラ・レスポンス shape・D1 schema を変更していない | `git diff apps/api/src/routes/me/index.ts` が空 |

## 8. ロールバック手順

本タスクは新規ファイル 1 + 1 行追加のみで、既存挙動への破壊的変更が無い。問題が出た場合:

```bash
# index.ts の 1 行追加を戻す
git checkout -- apps/api/src/index.ts
# 新規 middleware / test を削除
git rm apps/api/src/middleware/trailing-slash.ts \
       apps/api/src/middleware/__tests__/trailing-slash.spec.ts \
       apps/api/src/__tests__/me-route-mount.integration.spec.ts
```

middleware を外しても `/me`（末尾スラッシュ無し）は従来どおり解決され、`/me/` のみ 404 へ戻る（修正前の状態）。

## 9. 後続タスク・先送り項目

CONST_007 に違反する先送り（`Phase 2 で対応`、`バックログ送り` 等）は **無し**。本タスクのスコープ（trailing-slash 正規化 + マウント統合テスト）は本サイクルで完結する。

## 10. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。実装サイクル後、`.claude/commands/ai/diff-to-pr.md` のフローに従って user-gated で PR を作成する。base は `dev`。T02 / T03 と同一 PR に束ねるか分割するかは実装サイクルの判断とし、いずれも base=`dev`。
