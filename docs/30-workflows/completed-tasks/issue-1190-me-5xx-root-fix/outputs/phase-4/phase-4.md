# Phase 4: I/O 契約

## メタ情報
正本: `outputs/phase-4/phase-4.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-1/phase-1.md`（経路マップ P1-P8・AC-1〜10）/ `../phase-2/phase-2.md`（§3 ApiError 実契約・§4 T01・§5 T02・§7 テスト戦略）/ `../phase-3/phase-3.md`（R2: TC-2 fail パターンの 1 テーブル確定指示）

## 目的
T01/T02 が生み出すエラー shape（problem+json・`UBM-5001`）・logError payload（errorHandler 経由 / 直接 `logError` の 2 形）・fail パターン D1 Proxy の契約・テスト期待値表（TC-1〜TC-4 の Given/When/Then）を I/O 契約として固定する。本 Phase の表が実装・テストのグラウンドトゥルースであり、Phase 5/6 の task-0N はこれを参照する。

---

## 1. T02 エラー shape: problem+json（`UBM-5001`）契約

`session-guard.ts` / `routes/me/index.ts` の catch が throw する `ApiError`（`code: "UBM-5001"`・`log` 配下に `cause`/`context`）を、既設 `errorHandler`（`apps/api/src/middleware/error-handler.ts:41-84`）が `isApiError` 分岐でそのまま整形する。client に返るのは `toClientJSON()`（`packages/shared/src/errors.ts:110-120`）の 7 フィールドのみで、**`log`（cause / context / stack）は構造的に一切含まれない**（AC-4/AC-5 の前提）。

### 1.1 response body（`application/problem+json`）

| フィールド | 型 | 値（`UBM-5001`・detail/title 省略時） | 由来 |
|------------|----|----------------------------------------|------|
| `type` | string | `"urn:ubm:error:UBM-5001"` | `errors.ts:104`（`urn:ubm:error:<code>`） |
| `title` | string | `"Database Error"` | `UBM_ERROR_CODES["UBM-5001"].title`（`errors.ts:33`） |
| `status` | number | `500` | meta status（`status` オプション省略・`errors.ts:101`） |
| `detail` | string | `"データベース操作に失敗しました。"` | meta defaultDetail（`detail` 省略。member 固有情報なしで安全） |
| `instance` | string | `urn:uuid:<ランダム UUID>`（`/^urn:uuid:/` マッチで検証） | `generateUuidUrn()`（`errors.ts:73-79,105`） |
| `code` | string | `"UBM-5001"` | コンストラクタ引数 |
| `traceId` | string | `instance` と同値（`traceId` 省略時・`errors.ts:106`） | — |

### 1.2 response header

| header | 値 | 由来 |
|--------|----|------|
| `Content-Type` | `application/problem+json` | `error-handler.ts:34` |
| `x-request-id` | リクエストの `x-request-id` header（無ければ `crypto.randomUUID()`） | `error-handler.ts:45` |
| `x-trace-id` | body の `traceId` と同値 | `error-handler.ts:36` |

### 1.3 `debug` フィールドの扱い

`error-handler.ts:22-30` は `c.env.ENVIRONMENT === "development"` のときだけ `debug: { originalMessage, stackPreview? }` を body に同梱する。**契約テストの env は `ENVIRONMENT` を渡さない**（既存 `buildApp` の env は `{ DB, RESPONDER_URL }` のみ・spec:59）ため、TC-1/TC-2 の期待 body に `debug` キーは**現れない**（`expect(body).not.toHaveProperty("debug")` で固定してよい）。

### 1.4 禁止事項（不変条件 #11 / AC-5）

response body 全文に `m_001`（memberId）・`user1@example.com`（session email）が**含まれない**こと。`detail` は meta 既定文固定であり、`cause.message`（`"simulated D1 failure"` 等）も body には出ない。

---

## 2. logError payload 仕様（2 形）

### 2.1 形 A: T02（errorHandler 経由・P1/P2/P3）

throw された `ApiError` を `errorHandler` が `logError(payload)` で出力する（`error-handler.ts:55-81`）。`emit`（`packages/shared/src/logging.ts:75-87`）が `sanitize` 後に **JSON 1 行を `console.error(line)`** で出す。テストは spy 捕捉文字列を `JSON.parse` して構造化アサートする（Phase 3 R3 対策）。

| キー | 値（TC-1 の例） | 由来 |
|------|------------------|------|
| `level` / `timestamp` | `"error"` / ISO 文字列 | `emit` が付与 |
| `code` | `"UBM-5001"` | `apiError.code` |
| `status` | `500` | `apiError.status` |
| `message` | `"データベース操作に失敗しました。"` | `apiError.message`（= detail） |
| `traceId` / `instance` / `requestId` | body の `traceId` / `instance` / header の `x-request-id` と同値 | `error-handler.ts:67-73` |
| `method` | `"GET"` | `c.req.method` |
| `path` | `"/me"`（TC-1）/ `"/me/profile"`（TC-2）— §3.1 ハーネスを `/me` mount にするため production と同値 | `new URL(c.req.url).pathname` |
| `log.stack` | catch で引き継いだ `err.stack`（`stackPreview` 5 行に sanitize） | `apiError.log.stack`（条件付き spread） |
| `log.cause` | `{ name: "Error", message: "simulated D1 failure" }`（Error は name/message へ縮約） | `error-handler.ts:61-65` |
| `context` | `{ scope: "me-session-guard" }`（TC-1）/ `{ scope: "me-profile-builder" }`（TC-2） | `apiError.log.context` を payload トップレベル `context` へ転記（`error-handler.ts:79`） |

> **scope の出力位置**: `ApiError` 生成時は `log.context` 配下に入れるが、ログ行では **トップレベル `context.scope`** に現れる（errorHandler の転記仕様）。テストのアサート対象は `parsed.context.scope`。

### 2.2 形 B: T01（route 内で直接 `logError`・P4 fail-soft）

`logError` の引数は `StructuredLogInput`（`logging.ts:20`）であり、**`context` / `log` はトップレベル**にある（`ApiError` の `log` 配下とはフィールド配置が異なる。Phase 2 §4 注記どおり）。

```ts
logError({
  code: "UBM-5001",
  status: 500,                                    // 「fail-soft しなければ 500 だった」の記録。response は 200
  message: "pendingRequests fail-soft",
  path: "/me/profile",                            // production path のリテラル固定（ハーネス mount に依存しない）
  context: { scope: "me-pending-requests" },
  log: { cause: err },
});
```

出力ログ行（JSON.parse 後）の期待:

| キー | 値 |
|------|----|
| `level` | `"error"` |
| `code` / `status` | `"UBM-5001"` / `500` |
| `message` | `"pendingRequests fail-soft"` |
| `path` | `"/me/profile"` |
| `context.scope` | `"me-pending-requests"` |
| `log.cause` | `{ name: "Error", message: "simulated D1 failure", stackPreview: <5行> }`（`sanitize` が Error instance を自動変換・`logging.ts:56-64`） |

禁止: 形 A/B とも、ログ行全文に `m_001` / `user1@example.com` を含めない（`not.toContain` で検証。`sanitize` は memberId/email を redact **しない**ため「最初から入れない」が唯一の保証 — Phase 2 §6）。

---

## 3. fail パターン D1 Proxy の契約（Phase 2 §7.2 (b) の確定形）

### 3.1 onError 付きハーネス（spec 内ローカル）

既存 spec の `buildApp` は sub-app 直叩きで onError が無い。5xx の problem+json shape 検証用に production マウント（`apps/api/src/index.ts:195,224-229`）を最小再現する:

```ts
import { Hono } from "hono";
import { errorHandler } from "../../middleware/error-handler";   // session-guard.spec.ts からは "./error-handler"

const buildAppWithErrorHandler = (db: D1Database, sessionEmail: string | null = "user1@example.com") => {
  const meApp = createMeRoute({
    resolveSession: async () =>
      sessionEmail ? { email: sessionEmail, memberId: "m_001" } : null,
  });
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/me", meApp);                        // production と同じ "/me" mount（ログ path 整合）
  return { app, env: { DB: db, RESPONDER_URL: "https://example.com/form" } };
};
```

> Phase 2 §7.2 (a) のスケッチは `app.route("/", meApp)` だったが、本契約で **`/me` mount に確定**する（リクエストを `GET /me` / `GET /me/profile` と書け、形 A の `path` が production と同値になるため）。phase-2 の TC 表記「`GET /me`（ハーネス経由）」とも一致する。

### 3.2 failing D1 Proxy（SQL パターン選択式）

```ts
const failingDb = (real: D1Database, pattern: RegExp): D1Database =>
  new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === "prepare") {
        return (sql: string) => {
          if (pattern.test(sql)) throw new Error("simulated D1 failure");
          return target.prepare(sql);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
```

契約: `prepare` 時に pattern 一致 SQL のみ同期 throw（async 呼び出し元では rejected promise になる）。非一致 SQL は実 DB（InMemoryD1）へ素通し。`env.db as unknown as D1Database` を包んで `DB` binding として渡す。

### 3.3 fail パターンの経路選択表（実 SQL 検証済み・2026-06-12 Read）

| TC | fail パターン | 一致する実 SQL（検証済み） | 踏む経路 | 非該当の確認 |
|----|---------------|---------------------------|----------|--------------|
| TC-1 | `/member_identities\|member_status/` | `identities.ts:125`（`FROM member_identities`）・`status.ts:61`（`FROM member_status`） | P1（sessionGuard の `Promise.all` が最初の D1 接触） | — |
| TC-2 | **`/response_fields/`（1 テーブルに確定・Phase 3 R2 解消）** | `responseFields.ts:23`（`SELECT * FROM response_fields WHERE response_id = ?1`） | P3（`buildMemberProfile` 内 `listFieldsByResponseId`・`builder.ts:339`） | sessionGuard は `member_identities`/`member_status`/`admin_users` のみ読むため通過。`resolveEditResponseUrl`（`member_responses`）には到達前に P3 が throw |
| TC-3 | `/admin_member_notes/` | `adminNotes.ts:202`（`findLatestPendingByMemberAndType`） | P4（GET /me/profile 経路で `admin_member_notes` を読むのは `getPendingRequestsForMember` のみ） | builder・sessionGuard は同テーブル非参照 → 200 維持を阻害しない |
| （Phase 6 追加用） | `/admin_users/` | `adminUsers.ts:40`（`findByEmail`） | P2（`findAdminByEmail`） | identity/status は通過 |

> TC-2 補足: `buildMemberProfile` は `member_identities`（`findMemberById`）→ `member_status` → `member_responses` → `Promise.all`（`response_sections`/`response_fields`/`member_field_overrides`/`member_field_visibility`/`member_tags`/attendance）の順に読む。`/response_fields/` は builder 専用クエリで fail し、sessionGuard を確実に通過させる。

---

## 4. テスト期待値表（TC-1〜TC-4・Given/When/Then）

前提（全 TC 共通 Given）: `setupD1()` + `seedMember`（既存 fixture: `m_001` / `r_001` / consented）+ fake `resolveSession`（`{ email: "user1@example.com", memberId: "m_001" }`）。ログ捕捉は `vi.spyOn(console, "error")`（`beforeEach` で設置・`afterEach`/`mockRestore` で解除）。

| 項目 | TC-1 | TC-2 | TC-3 | TC-4 |
|------|------|------|------|------|
| 配置 | `session-guard.spec.ts`（新規） | `index.contract.spec.ts` 追記 | `index.contract.spec.ts` 追記 | 既存 describe 群（変更なし） |
| Given（注入） | §3.1 ハーネス + `failingDb(db, /member_identities\|member_status/)` | §3.1 ハーネス + `failingDb(db, /response_fields/)` | 既存 `buildApp`（onError 不要・200 経路）+ `failingDb(db, /admin_member_notes/)` | 注入なし（実 DB のみ） |
| When | `GET /me` | `GET /me/profile` | `GET /me/profile` | 既存リクエスト全件 |
| Then: status | `500` | `500` | **`200`** | 既存期待値（200/401/410/202/409/422/403/429）不変 |
| Then: header | `content-type: application/problem+json`・`x-request-id` 存在・`x-trace-id` === body `traceId` | 同左 | （通常 JSON。problem+json でない） | 不変 |
| Then: body | §1.1 の 7 フィールド。`code:"UBM-5001"`・`title:"Database Error"`・`status:500`・`detail:"データベース操作に失敗しました。"`・`debug` キー無し | 同左 | `MeProfileResponseZ.parse` 成功・`pendingRequests` が `{}`（`toEqual({})`）・`profile.memberId:"m_001"`・`editResponseUrl:"https://docs.google.com/forms/edit/r_001"`・`fallbackResponderUrl:"https://example.com/form"` | 不変 |
| Then: ログ（JSON.parse） | 形 A: `code:"UBM-5001"`・`status:500`・`context.scope:"me-session-guard"`・`path:"/me"`・`log.cause:{name:"Error",message:"simulated D1 failure"}` | 形 A: `context.scope:"me-profile-builder"`・`path:"/me/profile"`（他は TC-1 同様） | 形 B: `code:"UBM-5001"`・`status:500`・`message:"pendingRequests fail-soft"`・`path:"/me/profile"`・`context.scope:"me-pending-requests"`・`console.error` 呼び出しは**ちょうど 1 回** | `console.error` 不発（既存正常系で 5xx ログ無し） |
| Then: leak（AC-5） | body 全文・ログ行全文に `m_001`/`user1@example.com` 非含有 | 同左 | ログ行全文に `m_001`/`user1@example.com` 非含有（body は正常 response のため memberId を正規に含む） | — |

> TC-3 の補足: fail-soft の検証は「errorHandler に依存せず 200 を返す」ことの証明のため、onError **なし**の既存 `buildApp` を意図的に使う（onError 付きハーネスでも結果は同じだが、依存しないことを示す方が強い）。
>
> TC-1 の補足: `session-guard.spec.ts` は createMeRoute を経由した統合形（上記ハーネス）を基本とし、middleware 単体ハーネス（素の Hono + `sessionGuard` + ダミー handler + onError）を併用してもよい。期待値は同一。

## 統合テスト連携
本 Phase で固定した problem+json shape・logError payload（2 形）・fail パターン 3+1 値・TC-1〜TC-4 期待値が、Phase 5 の task-01〜03 と Phase 6 の拡充ケースのグラウンドトゥルース。Phase 9 は focused vitest + typecheck/lint + 非接触 gate で締める。staging 実機の `UBM-5001` ログ確認（`wrangler tail` を `scripts/cf.sh` 経由）は Phase 11 手動手順（user-gated）。

## 参照資料
- `../../_shared-context.md`（SSOT §3 タスク分解・§4 AC・§9 用語）
- `../phase-1/phase-1.md` / `../phase-2/phase-2.md` / `../phase-3/phase-3.md`
- 実コード: `packages/shared/src/errors.ts` / `packages/shared/src/logging.ts`、`apps/api/src/middleware/error-handler.ts` / `session-guard.ts`、`apps/api/src/routes/me/index.ts` / `services.ts` / `index.contract.spec.ts`、`apps/api/src/repository/responseFields.ts` / `adminNotes.ts` / `adminUsers.ts`

## 成果物
- `outputs/phase-4/phase-4.md`

## 完了条件
- [x] problem+json（`UBM-5001`）の body/header 契約を固定した（`debug` 非出現条件含む）。
- [x] logError payload を 2 形（errorHandler 経由 / 直接 logError）で固定した。
- [x] failing D1 Proxy の契約と fail パターン経路選択表を実 SQL 検証付きで固定した（TC-2 は `/response_fields/` の 1 テーブルへ確定・R2 解消）。
- [x] TC-1〜TC-4 の Given/When/Then・期待 status・期待 body・期待ログを表で固定した。
