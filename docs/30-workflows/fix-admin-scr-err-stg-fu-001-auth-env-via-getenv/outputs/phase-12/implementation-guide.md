# Implementation Guide

[実装区分: 実装仕様書]

> 本ガイドは「current factsの close-out で確定する内容」を方針として記述する。`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 段階のため、
> Part 2 の識別子は実装完了後に現行コードで `grep` 照合し、型定義・interface から引用して最終確定する。

## Part 1: 中学生レベル

### なぜこの修正が必要なの？

UBM 兵庫支部会のメンバーサイトには「ログインの受付係」がいます。受付係は、サイトに入ろうとする人の
メールアドレスを見て「この人は会員ですか？管理者ですか？」を別の係（API サーバー）に電話で確認します。

電話をかけるには「相手の電話番号」や「合言葉」が必要です。これらの番号や合言葉は、**設定メモ**という形で
あらかじめどこかにしまってあります。

ところが、この受付係は設定メモを **3 つの違う引き出し** から、それぞれ自分流のやり方で探していました。

- 引き出し A: 昔ながらの古い引き出し（`process.env`）
- 引き出し B: いまの実行場所が使う新しい引き出し（`getCloudflareContext`）
- 引き出し C: テスト用の特別な引き出し

引き出しがバラバラだと、こんな困りごとが起きます。

> 家族みんなが「印鑑はこの引き出し」「いや、あの引き出し」と勝手にルールを決めていたら、いざ印鑑が
> 必要なときに「どこを見ればいいの？」と迷って、見つからないまま手続きに失敗してしまう。

このサイトでは「設定メモは必ず**一つの整理係**（`env.ts`）に聞く」というルールがすでにあります。でも受付係だけが
このルールを守らず、自分で 3 つの引き出しを開けていました。その結果、引き出しを間違えると設定メモが空っぽに見え、
電話番号がわからず、こっそり「会員じゃない人」として扱われてしまう危険がありました。

### 何をするの？

1. **受付係は引き出しを自分で開けるのをやめます**。代わりに整理係（`getAuthEnv()` という新しい窓口）に
   「認証に必要な設定メモを全部ください」とお願いするだけにします。どの引き出しから出すかは整理係が知っています。
2. **設定メモが見つからなくても、受付係は慌てて止まりません**。「番号がわからないなら、その人は会員じゃない
   扱いにする」という安全側のルール（最初から決まっているルール）をそのまま守ります。これは「合言葉が確認
   できない人は中に入れない」という、当たり前で安全な対応です。
3. **整理係の名簿に足りなかった項目を書き足します**。これまで名簿に載っていなかった Google ログイン用の
   4 つの設定メモ（`GOOGLE_CLIENT_ID` など）を、整理係がちゃんと把握できるよう追記します。

これで「受付係がどの引き出しを開けるか迷う」問題がなくなり、設定の出どころが一本化されます。

### 用語の言い換え表

| 専門用語                  | 日常語での言い換え                                   |
| ------------------------- | ---------------------------------------------------- |
| env（環境変数）           | 設定メモ                                             |
| `process.env`             | 古い引き出し                                          |
| `getCloudflareContext`    | いまの実行場所が使う新しい引き出し                    |
| `env.ts`                  | 設定メモの整理係                                      |
| `getAuthEnv()`            | 認証用の設定メモをまとめて渡してくれる窓口            |
| safeParse                 | 「無くても止まらない・安全に空で返す」確認のしかた    |
| fail-closed               | わからないときは安全側（入れない側）に倒すルール      |
| service binding           | API サーバーへ直接つながる専用の電話線                |

## Part 2: 技術者レベル

### 背景

`apps/web/src/lib/auth.ts` は admin / member 双方の認証境界（Auth.js v5 + GoogleProvider + magic-link
Credentials）であり、`signIn` callback で API worker `/auth/session-resolve` を呼んで D1 lookup を行う。
現状この境界は env 参照を 3 経路（`process.env` 直接 / `getCloudflareContext().env` 直接 /
`globalThis.__UBM_AUTH_ENV__`）混在で解決しており、CLAUDE.md「apps/web env アクセス不変条件」に違反する。

正本 `apps/web/src/lib/env.ts` には `getEnv()`（strict parse・throw）が既にあるが、これは欠落必須項目で throw する
ため、認証境界の fail-closed 要件（invariant #11）と非互換である。そこで auth 境界専用の `getAuthEnv()`
（safeParse partial・throw しない）を新設し、`auth.ts` の直接参照を全廃する。

### 型定義 / API シグネチャ

```ts
// apps/web/src/lib/env.ts（current facts）

// EnvSchema へ google 系 4 key を optional 追加（AC-4）
//   GOOGLE_CLIENT_ID:     z.string().min(1).optional()
//   GOOGLE_CLIENT_SECRET: z.string().min(1).optional()
//   AUTH_GOOGLE_ID:       z.string().min(1).optional()
//   AUTH_GOOGLE_SECRET:   z.string().min(1).optional()

// auth 境界が参照する key の partial schema（全 optional・fail-closed 用）
const AuthEnvSchema = EnvSchema.pick({
  ENVIRONMENT: true,
  AUTH_SECRET: true,
  AUTH_URL: true,
  GOOGLE_CLIENT_ID: true,
  GOOGLE_CLIENT_SECRET: true,
  AUTH_GOOGLE_ID: true,
  AUTH_GOOGLE_SECRET: true,
  INTERNAL_API_BASE_URL: true,
  INTERNAL_AUTH_SECRET: true,
}).partial();

// service binding（API_SERVICE）は schema 外。型で同梱する
export interface AuthEnv extends z.infer<typeof AuthEnvSchema> {
  API_SERVICE?: { fetch: typeof fetch };
}

// safeParse partial + binding 同梱・throw しない
export function getAuthEnv(rawEnv: RawEnv = readRawEnv()): AuthEnv;
```

```ts
// apps/web/src/lib/auth.ts（current facts）

import { getAuthEnv, type AuthEnv } from "./env";
// import { getCloudflareContext } ... → 削除（AC-2）
// processEnv() / cloudflareEnv() → 削除（getAuthEnv() に内包）

const env = (): AuthEnv => ({ ...getAuthEnv(), ...globalEnv() });
// globalEnv()（__UBM_AUTH_ENV__）/ requestEnv()（x-ubm-* header）は保持
```

### 使用例

```ts
// auth 境界での env 取得（合成順: getAuthEnv を基底に globalEnv を後勝ちで上書き）
const e = env();                         // = { ...getAuthEnv(), ...globalEnv() }

// getAuth() 内では request header 注入を最後に重ねる（現状維持）
buildAuthConfig({ ...env(), ...requestEnv(request) }, fetch, providerFactories);

// fetchSessionResolve は API_SERVICE binding を透過参照（getAuthEnv が同梱）
const res = await (e.API_SERVICE ?? { fetch: fetchImpl }).fetch(url, ...);
```

### エラーハンドリング / エッジケース

| ケース                                         | 挙動                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| env 完全欠落（rawEnv = `{}`）                   | `safeParse` success（partial）→ `{}` 返却。`fetchSessionResolve` が `unregistered`（fail-closed） |
| `ENVIRONMENT` enum 不一致                       | `safeParse` 全体 `success=false` → `getAuthEnv()` は `{}` 返却（fail-closed 維持） |
| `API_SERVICE` binding 不在                      | `getAuthEnv()` は binding を同梱せず string 値のみ返す。`fetch` impl にフォールバック |
| `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` 欠落 | `fetchSessionResolve` が早期 `unregistered` 返却（現状と同一）             |
| `getEnv()`（data 境界・既存）                   | parse 失敗時 throw（変更なし）→ `error.tsx` で digest 補足                  |

> **設計緊張の解決**: `getAuthEnv()` は throw しない（auth fail-closed）。`getEnv()` は throw する（data 境界）。
> 両者を分離することで invariant #11 と env アクセス不変条件を同時に満たす。

### 設定可能なパラメータ / 定数

| 名前                       | 種別            | 必須                  | 投入先                                       | 備考                          |
| -------------------------- | --------------- | --------------------- | -------------------------------------------- | ----------------------------- |
| `ENVIRONMENT`              | var             | ✅                    | `wrangler.toml` `[env.*.vars]`               | enum local/staging/production |
| `AUTH_SECRET`              | secret          | stg/prod 必須         | Cloudflare Secret                            | JWT HS256 署名鍵              |
| `AUTH_URL`                 | var             | ✅                    | `wrangler.toml`                              | -                             |
| `GOOGLE_CLIENT_ID`         | secret          | google ログイン時必須 | Cloudflare Secret                            | `AUTH_GOOGLE_ID` と alias     |
| `GOOGLE_CLIENT_SECRET`     | secret          | google ログイン時必須 | Cloudflare Secret                            | `AUTH_GOOGLE_SECRET` と alias |
| `AUTH_GOOGLE_ID`           | secret          | optional              | Cloudflare Secret                            | alias 経路                    |
| `AUTH_GOOGLE_SECRET`       | secret          | optional              | Cloudflare Secret                            | alias 経路                    |
| `INTERNAL_API_BASE_URL`    | var             | ✅                    | `wrangler.toml`                              | session-resolve 宛先          |
| `INTERNAL_AUTH_SECRET`     | secret          | stg/prod 必須         | Cloudflare Secret                            | worker-to-worker 合言葉       |
| `API_SERVICE`              | service binding | ✅（Workers）         | `wrangler.toml` `[[services]]`               | schema 外・型で同梱           |

### 検証コマンド（current facts）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/auth.spec.ts apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/fetch/public.spec.ts
grep -n "process\.env" apps/web/src/lib/auth.ts        # AC-1: 0 件
grep -n "getCloudflareContext" apps/web/src/lib/auth.ts # AC-2: 0 件
```

staging deploy / authenticated `/login → /admin` runtime smoke は Phase 13 user-gated。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。本タスクは runtime / 設定境界の整流化であり、UI 表示物の
意匠変更を伴わない（NON_VISUAL）。代替証跡として以下を参照する。

- `outputs/phase-10/phase-10.md`（最終レビュー判定）
- `outputs/phase-11/manual-test-result.md`（`auth.spec.ts` / `env.spec.ts` の自動テスト結果・既知制限リスト）

`outputs/phase-11/screenshots/` は PNG 0 件のため `.gitkeep` を削除し、ディレクトリごと evidence 対象外とする。
