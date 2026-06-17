# task-01: apps/api `notFoundHandler` 構造化診断ログ

`[実装区分: 実装仕様書]`

> 判定根拠（CONST_004）: 本タスクは `apps/api/src/middleware/error-handler.ts` の `notFoundHandler` を編集し、route 未マッチ時の構造化診断ログを追加する**コード変更**を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-me-404-authenticated-admin-recovery` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T01 |
| ブランチ | `fix/profile-me-404-authenticated-admin-recovery`（起点 `origin/dev`） |
| visualEvidence | NON_VISUAL（focused vitest green + ログ payload 固定で判定） |
| 並列性 | **直列・最初に実施**（T02 smoke gate / T03 web ログの data-cause を本ログと突合するため、観測軸を最初に固定） |
| 紐づく AC / F / S | AC-2（notFound 構造化ログ）/ AC-6・AC-9（応答 body/status 不変・secret 非転記）/ F-7（UBM-1404 route 未マッチ）/ S1（route 未マッチを一意化） |

## 概要 / 対象タスク（T01）

staging `/profile` の `MEMBER_SESSION_404` は、有効認証下の `GET /me` が HTTP 404 になることでのみ生成される（F-2）。api `/me` ルートは有効認証下で 404 を返さない（F-6）ため、観測 404 は **`notFoundHandler`（route 未マッチ / `UBM-1404`）** が最有力発生源（F-7・S1）。現状 `notFoundHandler` は `ApiError(code:"UBM-1404")` を生成し `errorHandler` へ委譲するのみで、「どの method/path が route 未マッチだったか」「認証 cookie は届いていたか」をログから一意に切り分けできない。本タスクはその診断 `context` を追加し、staging ログだけで data-cause（S1 / S2 / S3）を切り分け可能にする（D-B 根治）。**応答 body・status 404・headers は一切変更しない。**

## 1. 変更対象ファイル一覧（パス・変更種別）

| パス | 変更種別 | 要点 |
| --- | --- | --- |
| `apps/api/src/middleware/error-handler.ts` | 編集 | `notFoundHandler` で `ApiError` の `context` に診断フィールドを付与 |
| `apps/api/src/middleware/error-handler.spec.ts` | 新規 | notFound 時の `logError` payload（`context.reason`/`method`/`path`/`hasAuthorization`/`hasSessionCookie`）を assert |

> `apps/api/src/index.ts:194`（`app.notFound(notFoundHandler)` 配線）・`apps/api/src/routes/me/**`・応答 body 形状は非接触。

## 2. 主要な関数・型・構造（実コードに即した差分方針）

現状（`error-handler.ts:86-98`）:

```ts
export function notFoundHandler(c: AnyContext): Response {
  let path: string;
  try {
    path = new URL(c.req.url).pathname;
  } catch {
    path = c.req.url;
  }
  const err = new ApiError({
    code: "UBM-1404",
    detail: `Route ${c.req.method} ${path} は存在しません。`,
  });
  return errorHandler(err, c);
}
```

改修方針（`ApiError` の `context` に診断フィールドを載せ、`errorHandler` の既存経路 :79 `if (apiError.log.context !== undefined) payload.context = apiError.log.context;` でログへ伝播）:

```ts
export function notFoundHandler(c: AnyContext): Response {
  let path: string;
  try {
    path = new URL(c.req.url).pathname;
  } catch {
    path = c.req.url;
  }
  // 診断: route 未マッチ時の data-cause 切り分け。secret は boolean 化のみ（値・JWT 生文字列は出さない）。
  const hasAuthorization = c.req.header("authorization") !== undefined;
  const sessionCookie = c.req.header("cookie") ?? "";
  const hasSessionCookie = sessionCookie.includes("__Secure-authjs.session-token");
  const err = new ApiError({
    code: "UBM-1404",
    detail: `Route ${c.req.method} ${path} は存在しません。`,
    context: {
      reason: "route_not_matched",
      method: c.req.method,
      path,
      hasAuthorization,
      hasSessionCookie,
    },
  });
  return errorHandler(err, c);
}
```

> `ApiError` の constructor が `context` を受理し `apiError.log.context` に格納することを実装着手時に確認する（`@ubm-hyogo/shared/errors` の `ApiError` 定義。受理しない場合は `ApiError` 生成後に `err.log.context = {...}` を代入する最小経路へ切り替える。いずれも `errorHandler` :79 経路に乗せる）。

`logError`（`@ubm-hyogo/shared/logging`）は `SENSITIVE_KEY_SUBSTRINGS`（`authorization`/`cookie`/`token`/`secret` 等）を含む context キーを `[REDACTED]` 化する（`logging.spec.ts:89-94`）。本タスクは **boolean フィールド名に `authorization`/`cookie` を含めず**（`hasAuthorization`/`hasSessionCookie`）redaction 誤発火を避けつつ、値を boolean 化して二重に secret 非漏洩を担保する。

## 3. 入力・出力・副作用の定義

| 区分 | 内容 |
| --- | --- |
| 入力 | Hono `Context`（route 未マッチ request）。`c.req.method` / `c.req.url` / `c.req.header("authorization"\|"cookie")` |
| 出力（応答・不変） | `application/problem+json` の `UBM-1404` ApiError JSON・status `404`・headers `x-request-id`/`x-trace-id`（**変更なし**） |
| 副作用（ログ・追加） | `logError` の payload に `context = { reason:"route_not_matched", method, path, hasAuthorization:boolean, hasSessionCookie:boolean }` が載る |
| 不変 | `/me` の path/shape/status 体系、`apps/api` 既存 endpoint surface、D1 schema、`/profile` UI 文言・分岐（AC-6） |

## 4. テスト方針（新規 `error-handler.spec.ts`・`*.spec.ts` のみ）

| TC-ID | ケース | 期待値 |
| --- | --- | --- |
| NF-1 | 未マッチ route（例 `GET /me`）で `notFoundHandler` を呼ぶ。`logError` を spy | payload.`context.reason === "route_not_matched"` / `context.method === "GET"` / `context.path === "/me"` |
| NF-2 | request に `cookie: __Secure-authjs.session-token=<dummy>` を付与 | `context.hasSessionCookie === true`。**cookie 生値が payload のどこにも現れない**（JSON.stringify して grep） |
| NF-3 | request に `authorization: Bearer <dummy>` を付与 | `context.hasAuthorization === true`。Bearer 値が payload に現れない |
| NF-4（回帰 guard） | 応答を assert | `response.status === 404`・body に `UBM-1404` を含む・`Content-Type: application/problem+json`。実装後も GREEN |
| NF-5（回帰 guard） | cookie/authorization なしの request | `context.hasSessionCookie === false` / `context.hasAuthorization === false` |

テスト実装の注意:
- `logError` は `vi.mock("@ubm-hyogo/shared/logging", ...)` または `vi.spyOn` で捕捉し、呼び出し引数（payload）を assert する。
- Hono `Context` は `app.request(...)` で実 route 未マッチを発生させる、または `notFoundHandler` を直接呼ぶ minimal context mock を用いる（既存 `apps/api/src/middleware/*.spec.ts` の context 構築パターンを踏襲）。
- 新規 test は `*.spec.ts` のみ（`*.test.ts` 禁止・不変条件 #8）。

## 5. ローカル実行・検証コマンド

```bash
# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# focused vitest（api package 内から --root=../.. 形式）
cd apps/api
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/api/src/middleware/error-handler.spec.ts
cd ../..

# 応答不変の grep gate（/me route 差分が無いこと）
git diff origin/dev...HEAD -- apps/api/src/routes/me   # 空であること
```

## 6. 完了条件（DoD）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T01-1 | `notFoundHandler` の `logError` payload に `context.reason="route_not_matched"` + `method` + `path` + `hasAuthorization`(bool) + `hasSessionCookie`(bool) が載る | NF-1〜NF-3 |
| DoD-T01-2 | 応答 body（`UBM-1404`）・status `404`・headers が不変 | NF-4 |
| DoD-T01-3 | cookie/JWT/Bearer の**生値がログ payload に一切出ない**（boolean のみ） | NF-2/NF-3 の grep assert |
| DoD-T01-4 | `error-handler.spec.ts`（NF-1〜NF-5）が全 PASS | §5 vitest |
| DoD-T01-5 | `pnpm typecheck` / `pnpm lint` exit 0 | §5 |
| DoD-T01-6 | `git diff origin/dev...HEAD -- apps/api/src/routes/me` が空（AC-6） | §5 grep |

## 7. 不変条件

- `/me` の path・shape・status 体系、`apps/api` 既存 endpoint surface を変更しない（AC-6）。
- 応答 body（`UBM-1404`）・status 404・headers を変更しない。
- secret/cookie/JWT/Bearer/memberId をログ・コード・ドキュメントに転記しない（boolean 化のみ・AC-9）。
- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5・本タスクは middleware のみ）。
- 新規 test は `*.spec.ts` のみ（不変条件 #8）。
- commit/PR/push/deploy は user-gated（CONST_002）。

## 8. ロールバック手順

```bash
git checkout origin/dev -- apps/api/src/middleware/error-handler.ts
git rm apps/api/src/middleware/error-handler.spec.ts   # 新規ファイルのため削除で戻す
```
notFoundHandler を元の `ApiError(code, detail)` 生成のみへ戻す。T02/T03/T04 とはコード非依存のため単独 revert 可能（ただし data-cause 切り分けの観測軸は失われる）。
