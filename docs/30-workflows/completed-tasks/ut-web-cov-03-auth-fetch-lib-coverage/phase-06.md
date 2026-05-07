# Phase 6: 異常系検証 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

> 当タスクは当初 `docs-only` として起票されたが、目的達成に Vitest テストファイル新規作成が必須のため、CONST_004（実態優先）に従い `taskType` を `implementation` に補正している。本 Phase は異常系の test 仕様を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 6 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 改訂日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

7 ファイルそれぞれの異常系を網羅し、test における observable behavior と assertion 方法を確定する。Phase 2 の error 列を引き継いで深堀り、Branches ≥80% を達成するための分岐ケースを漏れなく列挙する。

## 実行タスク

1. ファイルごとに異常系を列挙し、input → observable output を表形式で確定。
2. 各異常系の test assertion 方法を明記。
3. retryable / non-retryable の分類を決定（auth.ts の fail-closed 方針に揃える）。
4. error message の redact 規約を確認（fail-closed 時に内部 reason をクライアントに漏らさない）。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/phase-05.md（着手順序）

## 異常系マトリクス

### `apps/web/src/lib/auth.ts` (391L)

| # | 入力条件 | 観測対象 | 期待結果 | assertion |
|---|---|---|---|---|
| AUTH-E01 | INTERNAL_API_BASE_URL 未設定 | fetchSessionResolve 戻り値 | `{ memberId: null, reason: "unregistered" }` 相当（fail-closed） | `expect(result).toMatchObject({ memberId: null })` |
| AUTH-E02 | INTERNAL_AUTH_SECRET 未設定 | fetchSessionResolve | unregistered fail-closed | 同上 |
| AUTH-E03 | API 4xx | fetchSessionResolve | unregistered | `fetchSpy.mockResolvedValue(new Response("", { status: 403 }))` |
| AUTH-E04 | API 5xx | fetchSessionResolve | unregistered | status 500 |
| AUTH-E05 | fetch network error | fetchSessionResolve | unregistered | `fetchSpy.mockRejectedValue(new Error("network"))` |
| AUTH-E06 | baseUrl="invalid"（URL parse 失敗） | fetchSessionResolve / staging log | unregistered + log 出力 | `vi.spyOn(console, "warn")` で assertion |
| AUTH-E07 | signIn callback: account.provider!=="google"&&!=="credentials" | signIn 戻り値 | `false` | `expect(await signIn({ account: { provider: "github" } })).toBe(false)` |
| AUTH-E08 | signIn: email 空 | signIn | redirect string `/login?gate=unregistered` | string match |
| AUTH-E09 | signIn: email_verified=false | signIn | `/login?gate=unregistered` | string match |
| AUTH-E10 | signIn: resolved.memberId=null | signIn | `/login?gate=<reason>` | reason 反映 |
| AUTH-E11 | jwt callback: user undefined | token | 入力 token をそのまま返す | identity |
| AUTH-E12 | CredentialsProvider authorize: verifiedUser 空 | authorize | `null` | `expect(result).toBeNull()` |
| AUTH-E13 | authorize: verifiedUser 非 string | authorize | `null` | 同上 |
| AUTH-E14 | authorize: JSON.parse 失敗 | authorize | `null` | 不正 JSON 投入 |
| AUTH-E15 | authorize: parsed=null | authorize | `null` | `"null"` 投入 |
| AUTH-E16 | authorize: 必須フィールド欠損（memberId なし等） | authorize | `null` | partial object |

### `apps/web/src/lib/auth/magic-link-client.ts` (55L)

| # | 入力条件 | 観測対象 | 期待結果 | assertion |
|---|---|---|---|---|
| MLC-E01 | res.ok=false かつ status!==202 | sendMagicLink | `MagicLinkRequestError` throw | `await expect(...).rejects.toBeInstanceOf(MagicLinkRequestError)` |
| MLC-E02 | text() reject | エラー throw 時の message | empty fallback ("") を含む | `err.message` 検査 |
| MLC-E03 | json() reject (200/202) | sendMagicLink | `{ state: "sent" }` fallback | object equality |
| MLC-E04 | state が enum 外 | sendMagicLink | `{ state: "sent" }` fallback | object equality |
| MLC-E05 | isLoginGateState(unknown) | 戻り値 | enum 一致のみ true | true/false 両方 |

### `apps/web/src/lib/auth/oauth-client.ts` (19L)

| # | 入力 | 観測対象 | 期待結果 | assertion |
|---|---|---|---|---|
| OAC-E01 | redirect undefined | signIn 呼び出し引数 | callbackUrl="/profile" | `expect(signInMock).toHaveBeenCalledWith("google", { callbackUrl: "/profile" })` |
| OAC-E02 | redirect="//evil.com" | callbackUrl | "/profile" にサニタイズ | 同上 |
| OAC-E03 | redirect="https://evil.com" | callbackUrl | "/profile" にサニタイズ | 同上 |
| OAC-E04 | redirect="/safe/path" | callbackUrl | "/safe/path" | 同上 |

### `apps/web/src/lib/session.ts` (25L)

| # | 入力 | 観測対象 | 期待結果 |
|---|---|---|---|
| SES-E01 | auth() が null | getSession | `null` |
| SES-E02 | session.user undefined | getSession | `null` |
| SES-E03 | memberId 欠損 | getSession | `null` |
| SES-E04 | email 欠損 | getSession | `null` |
| SES-H01 | 全フィールド完全 | getSession | `SessionUser` object |

### `apps/web/src/lib/fetch/authed.ts` (73L)

| # | 入力 | 観測対象 | 期待結果 |
|---|---|---|---|
| FAU-E01 | path が `/` で始まらない | fetchAuthed | throw（pre-condition） |
| FAU-E02 | status=401 | fetchAuthed | `AuthRequiredError` throw |
| FAU-E03 | status=403 | fetchAuthed | `FetchAuthedError(status=403, bodyText=<body>)` |
| FAU-E04 | status=500 | fetchAuthed | `FetchAuthedError(status=500, bodyText=<body>)` |
| FAU-E05 | text() reject | err.bodyText | `""` fallback |
| FAU-E06 | cookies() 空 | fetch 呼び出し header | `cookie` ヘッダ未設定 |
| FAU-E07 | INTERNAL_API_BASE_URL なし＋PUBLIC_API_BASE_URL あり | 解決済み URL | PUBLIC を使用 |
| FAU-E08 | 両方なし | 解決済み URL | `http://127.0.0.1:8787` fallback |
| FAU-H01 | 200 + cookies 1 件 | fetch header | `cookie: name=value` 設定 |

### `apps/web/src/lib/fetch/public.ts` (102L)

| # | 入力 | 観測対象 | 期待結果 |
|---|---|---|---|
| FPU-E01 | service-binding あり | binding.fetch 呼出 | binding 経由 |
| FPU-E02 | service-binding なし＋PUBLIC_API_BASE_URL あり | global fetch 呼出 | URL 結合確認 |
| FPU-E03 | 404 (`fetchPublicOrNotFound`) | 例外 | `FetchPublicNotFoundError` |
| FPU-E04 | 404 (`fetchPublic`) | throw | `FetchPublicNotFoundError` |
| FPU-E05 | 500 | throw | `Error` |
| FPU-E06 | revalidate=60 | fetch init | `next: { revalidate: 60 }` 反映 |
| FPU-H01 | 200 | 戻り値 | parsed JSON |

### `apps/web/src/lib/api/me-types.ts` (39L)

- 型のみ。`me-types.test-d.ts` で `expectType<Me>` round-trip と `MeResponse` discriminated union の判別を検査（任意）。
- coverage 計測対象から除外（`vitest.config.ts` の `coverage.exclude` で対応）。

## redact / fail-closed 規約

- `auth.ts` fetchSessionResolve は **fail-closed** を不変条件とする（network/4xx/5xx/parse-fail いずれも `unregistered` に統一）。
- internal reason はクライアント表示せず、`/login?gate=` の query 値のみを観測する。

## 入出力の境界

- input: HTTP response (status / json / text / network-error)、env vars、cookies、provider account。
- output: function 戻り値（object / null / boolean / Error throw）、redirect string、fetch init headers。

## 実行手順

- 対象 directory: docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装時は Phase 5 の Step 順に上記異常系を test ケース化する。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter web vitest run apps/web/src/lib/<対象>.test.ts
mise exec -- pnpm --filter web test:coverage
```

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation（fetchSessionResolve は memberId を返す、responseId は混同しない）
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] 7 ファイル × 異常系マトリクス埋め
- [ ] fail-closed/redact 規約確認
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md（異常系チェックリスト）

## 完了条件 (DoD)

- 上記マトリクス記載の全 case が test 化され、coverage Branches ≥80% を達成する見通しであること。
- AUTH-E01..E16, MLC-E01..E05, OAC-E01..E04, SES-E01..E04, FAU-E01..E08, FPU-E01..E06 が Phase 7 のマトリクスに 1:1 mapping される。
- 既存 web test に regression なし。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] CONST_005 必須項目を該当範囲で具体化済み
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、異常系 ID（AUTH-E*, MLC-E*, OAC-E*, SES-E*, FAU-E*, FPU-E*）と AC との対応マトリクス用入力を渡す。
