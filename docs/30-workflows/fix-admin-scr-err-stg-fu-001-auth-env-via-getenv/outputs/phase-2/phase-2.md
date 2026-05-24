# Phase 2: 設計

[実装区分: 実装仕様書]

| 項目   | 値                                          |
| ------ | ------------------------------------------- |
| Phase  | 2 / 13（設計）                              |
| 依存   | Phase 1                                     |
| 成果物 | outputs/phase-2/phase-2.md                  |

## 1. 設計の核心: getEnv() throw と auth fail-closed の両立

### 1.1 既存コンポーネント再利用可否（FB-SDK-07-1）

- `readRawEnv()`（`env.ts`）は既に `getCloudflareContext().env` → `process.env` → PLAYWRIGHT override の
  解決ロジックをカプセル化している。**この関数を再利用**することで、auth.ts から process.env / cloudflare 直接参照を
  完全に排除できる。新規の env 読み取りロジックは作らない。
- `getEnv()`（strict parse・throw）はそのまま data-fetch 境界（server-fetch.ts）が使い続ける。auth 境界は
  fail-closed 要件があるため `getEnv()` を直接使わず、**新規 `getAuthEnv()`（safeParse partial）** を追加する。

### 1.2 設計判断テーブル

| 論点                                    | 採用案                                                                 | 却下案と理由                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| auth が `getEnv()` を直接呼ぶか          | **No**。`getAuthEnv()`（safeParse partial）を新設                       | `getEnv()` 直呼びは `PUBLIC_API_BASE_URL` 等の無関係必須項目欠落でも throw し、invariant #11（fail-closed）と既存テストを破壊する |
| auth env 欠落時に throw するか           | **No（safeParse → partial 返却）**                                     | issue 5節は「throw 維持」と書くが、invariant #11 が優先（fail-closed = unregistered）。throw は data 境界に閉じる。Phase 3 で deviation 記録 |
| `API_SERVICE`（binding）の取得経路        | `getAuthEnv()` が `readRawEnv()` の生 env から binding を同梱して返す   | auth.ts に getCloudflareContext を残すと AC-2 違反。env.ts に集約する         |
| google 系 key の schema 必須性           | **`.optional()`**                                                      | magic-link only 環境や test で google creds 不在は正常。required にすると safeParse が壊れる |
| `requestEnv()`（x-ubm-* header）の扱い   | **保持（変更なし）**                                                   | process.env/cloudflare 非依存。AC-1/2 対象外。テスト/ローカル注入機構として有効 |
| `globalEnv()`（__UBM_AUTH_ENV__）の扱い  | **保持（変更なし）**                                                   | 同上。globalThis 参照は deny 対象でない                                       |

### 1.3 env 解決の合成順序（変更後）

```text
env()  ==  { ...getAuthEnv(), ...globalEnv() }     # auth.ts 内
            │                  └─ globalThis.__UBM_AUTH_ENV__（テスト override・後勝ち）
            └─ getAuthEnv()（env.ts）
                 = AuthEnvSchema.safeParse(readRawEnv()) の success 値
                   + readRawEnv() から API_SERVICE binding を同梱
                 readRawEnv()（env.ts 既存）
                   = cloudflare context env  ||  process.env  (+ PLAYWRIGHT override)
```

> 合成順は現状（`processEnv → globalEnv → cloudflareEnv`、cloudflare 後勝ち）と整合させる。`getAuthEnv()` が
> readRawEnv 経由で cloudflare 優先解決を内包するため、auth.ts 側は `getAuthEnv()` を基底に `globalEnv()` を
> 上書き（テスト注入を最優先で効かせる）する。`requestEnv()` は呼び出し側（`getAuth()`）で `{ ...env(), ...requestEnv(request) }` として最後に重ねる（現状維持）。

## 2. `env.ts` 変更設計

### 2.1 EnvSchema 拡張（AC-4）

`EnvSchema` に以下 4 key を `.optional()` で追加:

```ts
GOOGLE_CLIENT_ID: z.string().min(1).optional(),
GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
AUTH_GOOGLE_ID: z.string().min(1).optional(),
AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
```

> 既存の `getEnv()` / `getPublicEnv()` は影響を受けない（optional 追加のみ）。

### 2.2 AuthEnv 型と AuthEnvSchema の定義

`env.ts` に auth 境界が必要とする partial schema とアクセサを追加する。

```ts
// auth 境界が参照する env キーの partial schema（全 optional・fail-closed 用）
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

// service binding を含む auth env の型（API_SERVICE は schema 外）
export interface AuthEnv extends z.infer<typeof AuthEnvSchema> {
  API_SERVICE?: { fetch: typeof fetch };
}

export function getAuthEnv(rawEnv: RawEnv = readRawEnv()): AuthEnv {
  const parsed = AuthEnvSchema.safeParse(rawEnv);
  const base: z.infer<typeof AuthEnvSchema> = parsed.success ? parsed.data : {};
  const binding = (rawEnv as { API_SERVICE?: { fetch: typeof fetch } }).API_SERVICE;
  return binding ? { ...base, API_SERVICE: binding } : base;
}
```

> `AuthEnvSchema` を `.partial()` にすることで、`PUBLIC_API_BASE_URL` 等 auth に無関係な必須項目欠落でも
> safeParse は失敗しない（pick 対象外）。`ENVIRONMENT` など pick 対象が enum 不一致のときのみ `success=false` に
> なるが、その場合も `{}` を返して fail-closed を担保する。

### 2.3 `AuthEnv` 型の所有権移動

現状 `auth.ts` が持つ `AuthEnv` interface（24-35 行）を `env.ts` 側へ移し、`auth.ts` は `import type { AuthEnv } from "./env"` で受ける。
これにより env 型の単一所有権を `env.ts` に集約する。

## 3. `auth.ts` 変更設計

| 対象                          | Before                                                       | After                                                             |
| ----------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `import getCloudflareContext` | あり（15 行）                                                | **削除**                                                          |
| `import type { AuthEnv }`     | ローカル interface 定義（24-35 行）                          | `import { getAuthEnv, type AuthEnv } from "./env";`               |
| `cloudflareEnv()`（37-43）    | `getCloudflareContext().env`                                 | **削除**（`getAuthEnv()` に内包）                                 |
| `processEnv()`（56-69）       | `process.env["..."]` × 9                                     | **削除**（`getAuthEnv()` に内包）                                 |
| `definedEnv()`（49-54）       | processEnv/requestEnv で使用                                 | requestEnv のみで使用 → 保持                                      |
| `globalEnv()`（45-47）        | `globalThis.__UBM_AUTH_ENV__`                                | **保持**                                                          |
| `env()`（71-75）              | `{ ...processEnv(), ...globalEnv(), ...cloudflareEnv() }`    | `{ ...getAuthEnv(), ...globalEnv() }`                             |
| `requestEnv()`（77-101）      | header 注入                                                  | **保持**                                                          |
| その他（fetchSessionResolve, buildAuthConfig, getAuth 等） | -                              | 変更なし（`env()` の戻り型 `AuthEnv` が一致するため透過）         |

> `env()` の戻り値型は変更前後とも `AuthEnv`。`getAuthEnv()` が `API_SERVICE` を同梱するため、
> `fetchSessionResolve` の `e.API_SERVICE` 参照（161 行）は透過的に動作する。

## 4. 副作用・入出力・エラーハンドリング

| 関数            | 入力                      | 出力               | 副作用 | エラー時挙動                                        |
| --------------- | ------------------------- | ------------------ | ------ | --------------------------------------------------- |
| `getAuthEnv()`  | `rawEnv?`（既定 readRawEnv）| `AuthEnv`          | なし   | safeParse 失敗時 `{}`（+ binding があれば同梱）→ throw しない |
| `env()`（auth）  | なし                      | `AuthEnv`          | なし   | 例外を投げない（getAuthEnv が吸収）                  |
| `getEnv()`（既存）| `rawEnv?`                | `Env`              | なし   | parse 失敗時 throw（変更なし・data 境界用）          |

> fail-closed（invariant #11）: env 不在 → `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` が undefined →
> `fetchSessionResolve` が `unregistered` 返却（現状と同一）。

## 5. ロック変数・state 所有権

本タスクは純粋関数（env 読み取り）の経路変更のみ。state machine・ロック変数・非同期 lock は関与しない。
`authRuntimePromise`（getAuth の memo）は変更しない。

## 6. ライブラリ選定

新規ライブラリ追加なし。`zod`（既存）の `.pick()` / `.partial()` / `.safeParse()` のみ使用。

## 7. 完了条件（このPhaseの DoD）

- [x] `getAuthEnv()` のシグネチャ・safeParse partial 方針・binding 同梱を確定
- [x] `EnvSchema` への google 系 4 key 追加（optional）を確定
- [x] `auth.ts` の Before/After 変更表を確定
- [x] fail-closed（invariant #11）保持の根拠を明記
- [x] `requestEnv()` / `globalEnv()` を保持する根拠を明記
