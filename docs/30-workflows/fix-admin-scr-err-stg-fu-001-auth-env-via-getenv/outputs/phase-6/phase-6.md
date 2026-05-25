# Phase 6: テスト拡充（fail path・回帰 guard）

[実装区分: 実装仕様書]

| 項目   | 値                                          |
| ------ | ------------------------------------------- |
| Task ID | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV |
| Phase  | 6 / 13（テスト拡充）                        |
| 依存   | Phase 4（基本テスト）/ Phase 5（実装 GREEN） |
| 成果物 | outputs/phase-6/phase-6.md                  |
| ゲート | 拡充後も全 green（fail path / edge / grep gate / dual-env safeParse） |

## 1. 目的

Phase 4 で定義した happy / 基本 fail を超えて、AC-1/AC-2 の grep gate をテスト化し、staging/production の
`wrangler.toml` 値での safeParse 成功（AC-4 の dual-environment 充足）と edge case（binding 不在 / google key 片方のみ）を
固定する。これにより「同型 regression（auth 境界に process.env / getCloudflareContext が再混入する）」を
構造的に検出可能にする。

## 2. 変更対象ファイル一覧と変更種別

| パス                                | 変更種別 | 追加内容                                                                 |
| ----------------------------------- | -------- | ------------------------------------------------------------------------ |
| `apps/web/src/lib/__tests__/env.spec.ts`      | 追記     | E-13..E-20（dual-env safeParse / edge case）+ AC-1/AC-2 grep gate（G-01/G-02） |
| `apps/web/src/lib/auth.spec.ts`     | 追記（任意） | A-01（`default env()` が getAuthEnv 経由で fail-closed であることの明示確認） |

> 新規 test ファイルは追加しない（既存 `env.spec.ts` への追記）。grep gate は `env.spec.ts` 内の `it()` として
> `node:fs` で `auth.ts` を読み、正規表現で `process.env` / `getCloudflareContext` 不在を assert する方式で実装する。

## 3. テストケース表（追加分）

### 3.1 dual-environment safeParse（AC-4 充足）

| ID   | 観点                                | 入力（rawEnv）                                                                                              | 期待値                                                              |
| ---- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| E-13 | staging wrangler.toml `[vars]` 値 + secrets で safeParse 成功 | `{ ENVIRONMENT:"staging", AUTH_URL:"https://ubm-hyogo-web-staging.daishimanju.workers.dev", INTERNAL_API_BASE_URL:"https://ubm-hyogo-api-staging.daishimanju.workers.dev", AUTH_SECRET:"0123456789abcdef0123456789abcdef", INTERNAL_AUTH_SECRET:"isec", GOOGLE_CLIENT_ID:"gid", GOOGLE_CLIENT_SECRET:"gsec" }` | `getAuthEnv()` が全入力 key を含む（`{}` ではない）。`toMatchObject({ ENVIRONMENT:"staging", INTERNAL_API_BASE_URL:"https://ubm-hyogo-api-staging.daishimanju.workers.dev" })`。 |
| E-14 | production wrangler.toml `[vars]` 値 + secrets で safeParse 成功 | `{ ENVIRONMENT:"production", AUTH_URL:"https://ubm-hyogo-web-production.daishimanju.workers.dev", INTERNAL_API_BASE_URL:"https://ubm-hyogo-api.daishimanju.workers.dev", AUTH_SECRET:"0123456789abcdef0123456789abcdef", INTERNAL_AUTH_SECRET:"isec", AUTH_GOOGLE_ID:"agid", AUTH_GOOGLE_SECRET:"agsec" }` | `getAuthEnv()` が全 key を含む。`toMatchObject({ ENVIRONMENT:"production", AUTH_GOOGLE_ID:"agid", AUTH_GOOGLE_SECRET:"agsec" })`。 |
| E-15 | local 環境で safeParse 成功         | `{ ENVIRONMENT:"local", INTERNAL_API_BASE_URL:"http://127.0.0.1:8787" }`                                     | `{ ENVIRONMENT:"local", INTERNAL_API_BASE_URL:"http://127.0.0.1:8787" }`。enum `local` を受理。 |

> E-13/E-14 は `[vars]` の string 値（`SENTRY_TRACES_SAMPLE_RATE` 等の auth 無関係 key は pick 対象外なので
> 欠落しても影響しない）+ 機密値（Cloudflare Secrets 由来の `AUTH_SECRET` / `INTERNAL_AUTH_SECRET` / google creds）を
> 合成した「実ランタイム rawEnv 相当」で safeParse 成功を固定する。これが AC-4 の dual-environment 証跡。

### 3.2 edge case（binding 不在 / google key 片方のみ / 境界値）

| ID   | 観点                                | 入力（rawEnv）                                                                 | 期待値                                                              |
| ---- | ----------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| E-16 | binding 不在（string key のみ）     | `{ ENVIRONMENT:"staging", INTERNAL_API_BASE_URL:"https://api.example.com" }`   | 戻り値に `API_SERVICE` プロパティを含まない（`expect(result.API_SERVICE).toBeUndefined()`）。string key は保持。 |
| E-17 | google key 片方のみ（GOOGLE_CLIENT_ID のみ） | `{ ENVIRONMENT:"staging", GOOGLE_CLIENT_ID:"gid" }`                            | `GOOGLE_CLIENT_ID:"gid"` を含み、`GOOGLE_CLIENT_SECRET` / `AUTH_GOOGLE_*` は `undefined`。partial なので片方欠落でも success。 |
| E-18 | google key 片方のみ（AUTH_GOOGLE_SECRET のみ） | `{ ENVIRONMENT:"staging", AUTH_GOOGLE_SECRET:"agsec" }`                        | `AUTH_GOOGLE_SECRET:"agsec"` を含み他 3 google key は `undefined`。`googleClientId`/`googleClientSecret` のフォールバック（auth.ts）が後段で `""` になることを E-20 で連携確認。 |
| E-19 | binding が `fetch` を持たない不正形 | `{ ENVIRONMENT:"staging", API_SERVICE:{} }`                                    | `API_SERVICE:{}` を truthy として同梱する（`getAuthEnv` は binding の中身を検証しない）。`expect(result.API_SERVICE).toEqual({})`。実害は `fetchSessionResolve` 側で `service.fetch` 呼び出し時に処理されるため getAuthEnv は通す方針を固定。 |
| E-20 | google key 片方欠落 → auth の clientSecret フォールバック | （auth.spec 連携）`buildAuthConfig({ GOOGLE_CLIENT_ID:"g1" }, ...)` | `google.options.clientId === "g1"` かつ `clientSecret === ""`（`googleClientSecret` フォールバック）。これは既存 `auth.spec.ts` の優先順テスト（345-356 行）で部分カバー済み。E-20 は env.spec 側では扱わず auth.spec の既存ケースに委譲（重複追加しない）。 |

> E-20 は既存 auth.spec.ts でカバー済みのため env.spec.ts には追加しない（重複回避）。本表に記載するのは
> 「片方欠落 → 空文字フォールバック」の検証責務が auth.spec 側にあることを明示するため。

### 3.3 AC-1 / AC-2 grep gate のテスト化（回帰 guard）

`auth.ts` への `process.env` / `getCloudflareContext` 再混入を CI/ローカルで検出するため、`env.spec.ts` に
ソース静的検査の `it()` を追加する。

| ID   | 観点                                            | 検査手順                                                                                          | 期待値                          |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------- |
| G-01 | `auth.ts` に `process.env` 直接参照が 0 件（AC-1） | `node:fs` の `readFileSync(new URL("./auth.ts", import.meta.url), "utf8")` で source を読み、`/process\.env/` に match しないことを assert | `expect(/process\.env/.test(src)).toBe(false)` |
| G-02 | `auth.ts` に `getCloudflareContext` 参照が 0 件（AC-2） | 同上の source に対し `/getCloudflareContext/` に match しないことを assert（import 文含む）        | `expect(/getCloudflareContext/.test(src)).toBe(false)` |

> 実装イメージ（env.spec.ts に追記）:
>
> ```ts
> import { readFileSync } from "node:fs";
> import { fileURLToPath } from "node:url";
>
> describe("auth.ts env-access invariant (AC-1/AC-2 grep gate)", () => {
>   const authSrc = readFileSync(
>     fileURLToPath(new URL("./auth.ts", import.meta.url)),
>     "utf8",
>   );
>   it("G-01: auth.ts に process.env 直接参照が無い", () => {
>     expect(/process\.env/.test(authSrc)).toBe(false);
>   });
>   it("G-02: auth.ts に getCloudflareContext 参照が無い", () => {
>     expect(/getCloudflareContext/.test(authSrc)).toBe(false);
>   });
> });
> ```
>
> このテストは vitest 実行環境（Node）の `node:fs` を使う。`apps/web` の vitest config が Node 環境であることを
> 前提とする（auth.spec.ts も同 config で `Response` / `vi.mock` を使用しており Node ベース）。env-only テストの
> ため `@opennextjs/cloudflare` の mock は不要だが、`env.ts` import 時に `readRawEnv()` が呼ばれるケース（rawEnv
> 省略形）を E-01..E-09 で使っていない限り mock 不要。明示注入（`getAuthEnv({...})`）に統一しているため
> `env.spec.ts` は cloudflare mock なしで成立する。

### 3.4 auth.spec.ts 追記（任意・回帰の明示固定）

| ID   | 観点                                | 入力                                | 期待値                                              |
| ---- | ----------------------------------- | ----------------------------------- | --------------------------------------------------- |
| A-01 | `default env()` が getAuthEnv 経由で fail-closed | `fetchSessionResolve("u@example.com")`（env 省略・mock cloudflareEnv = `{}`） | `gateReason === "unregistered"`（既存 186-190 行と同一。getAuthEnv 経由でも `{}` → unregistered を明示）。 |

> A-01 は既存テスト（186-190 行）と実質同等。追加する場合はコメントで「getAuthEnv 経由の fail-closed 回帰」と
> 明記し、既存ケースとの重複を許容する（経路変更の意図を明示する価値がある）。重複を嫌う場合は既存ケースの
> コメントを更新するだけでも可（その場合 auth.spec.ts は無改変方針を維持）。

## 4. カバレッジ観点（Phase 7 への申し送り）

| 対象               | カバーされる分岐                                                              | 担保テスト               |
| ------------------ | ----------------------------------------------------------------------------- | ------------------------ |
| `getAuthEnv` success 分岐 | `parsed.success === true` → `parsed.data`                                | E-01, E-05, E-06, E-13..E-18 |
| `getAuthEnv` fail 分岐    | `parsed.success === false` → `{}`                                        | E-03, E-09               |
| `getAuthEnv` binding 同梱 | `binding ? {...base, API_SERVICE} : base` の両分岐                        | E-02/E-19（同梱）, E-16（不同梱） |
| `env()`（auth）の getAuthEnv 委譲 | `{ ...getAuthEnv(), ...globalEnv() }`                            | auth.spec 既存 186-190 / 596-599, A-01 |

## 5. ローカル実行・検証コマンド

```bash
# 拡充後の全 green 確認（targeted）
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/auth.spec.ts

# grep gate（テスト化と二重で手動確認・0 件 = PASS）
grep -n "process\.env" apps/web/src/lib/auth.ts || echo "AC-1 PASS"
grep -n "getCloudflareContext" apps/web/src/lib/auth.ts || echo "AC-2 PASS"

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 6. 完了条件（このPhaseの DoD）

- [ ] dual-environment safeParse（E-13 staging / E-14 production / E-15 local）を追加し green
- [ ] edge case（E-16 binding 不在 / E-17・E-18 google key 片方のみ / E-19 不正 binding 形）を追加し green
- [ ] AC-1 grep gate（G-01）/ AC-2 grep gate（G-02）を `node:fs` ベースの `it()` でテスト化し green
- [ ] E-20（google key 片方欠落 → clientSecret フォールバック）は auth.spec 既存ケースに委譲する旨を明記した
- [ ] 全 targeted test（env.spec + auth.spec）が green、`pnpm typecheck` / `pnpm lint` pass
- [ ] 追加 test ファイルは作らず既存 `env.spec.ts` への追記であること（`*.spec.ts` 命名維持）
