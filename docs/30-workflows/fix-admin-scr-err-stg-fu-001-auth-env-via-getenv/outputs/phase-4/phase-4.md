# Phase 4: テスト作成（TDD RED）

[実装区分: 実装仕様書]

| 項目   | 値                                          |
| ------ | ------------------------------------------- |
| Task ID | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV |
| Phase  | 4 / 13（テスト作成）                        |
| 依存   | Phase 1 / Phase 2 / Phase 3                 |
| 成果物 | outputs/phase-4/phase-4.md                  |
| ゲート | RED（テストを先に置き、実装前は fail / 未実装関数で型エラーになることを確認） |

## 1. 目的

Phase 2 設計（`env.ts` に `getAuthEnv()` を新設し、`auth.ts` の `process.env` / `getCloudflareContext` 直接参照を
撤去）を、実装より先にテストで固定する。本 Phase で作成・更新するテストは以下 2 ファイル:

1. **新規** `apps/web/src/lib/__tests__/env.spec.ts` — `getAuthEnv()` の挙動（全 9 string key 取得 / `API_SERVICE` binding 同梱 /
   不正 `ENVIRONMENT` で空返却＝fail-closed / google 系 key 取得）を固定する。`getEnv()` / `getPublicEnv()` の既存
   挙動（strict parse・throw）回帰も併せて固定する。
2. **更新（回帰確認のみ・追記なし）** `apps/web/src/lib/auth.spec.ts` — 既存ケース（`default env()` で unregistered /
   provider factory throw）が実装変更後も green を維持することを確認する。Phase 4 では auth.spec.ts に新規ケースは
   追加せず、回帰確認方針のみ記述する（新規ケース追加は Phase 6 で扱う）。

> 不変条件: 新規 test ファイルは `*.spec.ts` のみ（`*.test.*` 禁止）。本 Phase の新規ファイルは `env.spec.ts`。

## 2. 変更対象ファイル一覧と変更種別

| パス                                | 変更種別 | 内容                                                                 |
| ----------------------------------- | -------- | -------------------------------------------------------------------- |
| `apps/web/src/lib/__tests__/env.spec.ts`      | 新規作成 | `getAuthEnv()` テストケース（E-01..E-09）+ `getEnv()`/`getPublicEnv()` 回帰（E-10..E-12） |
| `apps/web/src/lib/auth.spec.ts`     | 変更なし（回帰確認のみ） | 既存全ケースが実装後も green を維持することを確認（Phase 5 後に実行） |

> RED 時点では `env.ts` に `getAuthEnv` が未実装のため、`env.spec.ts` は **import 解決失敗（型エラー / 実行時
> `getAuthEnv is not a function`）で fail** する。これが RED の確認点。

## 3. 被テスト対象の関数シグネチャ（Phase 2 §2.2 で確定済み・実装は Phase 5）

```ts
// apps/web/src/lib/env.ts（Phase 5 で実装）
export interface AuthEnv {
  ENVIRONMENT?: "local" | "staging" | "production";
  AUTH_SECRET?: string;
  AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  INTERNAL_API_BASE_URL?: string;
  INTERNAL_AUTH_SECRET?: string;
  API_SERVICE?: { fetch: typeof fetch };
}

export function getAuthEnv(rawEnv?: RawEnv): AuthEnv;
```

- 入力: `rawEnv?`（省略時 `readRawEnv()` を呼ぶ）。
- 出力: `AuthEnv`（safeParse 成功値 + binding 同梱。失敗時 `{}` + binding）。
- 副作用: なし（pure）。
- エラー時挙動: **throw しない**（safeParse 失敗時は `{}` を返す。fail-closed = invariant #11）。

> テストは原則 `rawEnv` を明示注入する（`getAuthEnv({ ... })`）。これにより `readRawEnv()`（cloudflare context /
> process.env への依存）を経由せず決定的にテストできる。`readRawEnv()` 経由の解決確認は `auth.spec.ts` の
> `default env()` 系（mock 注入済み）に委ねる。

## 4. テストケース表（env.spec.ts）

### 4.1 `getAuthEnv()`（新規・RED 対象）

| ID   | 観点                                | 入力（rawEnv）                                                                 | 期待値                                                                 |
| ---- | ----------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| E-01 | 全 9 string key を取得              | `{ ENVIRONMENT:"staging", AUTH_SECRET:"0123456789abcdef0123456789abcdef", AUTH_URL:"https://w.example.com", GOOGLE_CLIENT_ID:"gid", GOOGLE_CLIENT_SECRET:"gsec", AUTH_GOOGLE_ID:"agid", AUTH_GOOGLE_SECRET:"agsec", INTERNAL_API_BASE_URL:"https://api.example.com", INTERNAL_AUTH_SECRET:"isec" }` | 同じ 9 key が全て含まれる object（`toMatchObject` で 9 key を assert）。`API_SERVICE` は `undefined`（rawEnv に無いため未付与）。 |
| E-02 | `API_SERVICE` binding を同梱        | `{ ENVIRONMENT:"staging", INTERNAL_API_BASE_URL:"https://api.example.com", INTERNAL_AUTH_SECRET:"isec", API_SERVICE:{ fetch: stubFetch } }` | 戻り値の `API_SERVICE` が `stubFetch` を持つ object と `toBe`（参照一致）。string key も保持。 |
| E-03 | 不正 `ENVIRONMENT` で空返却（fail-closed） | `{ ENVIRONMENT:"invalid-env", AUTH_SECRET:"0123456789abcdef0123456789abcdef" }` | `{}`（safeParse 失敗 → 空 object）。`AUTH_SECRET` も含まれない（enum 不一致で schema 全体 fail）。`toEqual({})`。throw しないことを `expect(() => getAuthEnv(...)).not.toThrow()` で確認。 |
| E-04 | 不正 `ENVIRONMENT` でも binding は同梱（fail-closed + binding 保持） | `{ ENVIRONMENT:"invalid-env", API_SERVICE:{ fetch: stubFetch } }` | `{ API_SERVICE: { fetch: stubFetch } }` 相当（string key 無し・binding のみ）。`result.API_SERVICE` が `stubFetch` を持つ。 |
| E-05 | google 系 4 key 単独取得            | `{ ENVIRONMENT:"production", GOOGLE_CLIENT_ID:"gid", GOOGLE_CLIENT_SECRET:"gsec", AUTH_GOOGLE_ID:"agid", AUTH_GOOGLE_SECRET:"agsec" }` | 4 つの google key + `ENVIRONMENT` を含む。`toMatchObject({ GOOGLE_CLIENT_ID:"gid", GOOGLE_CLIENT_SECRET:"gsec", AUTH_GOOGLE_ID:"agid", AUTH_GOOGLE_SECRET:"agsec" })`。 |
| E-06 | auth 無関係の必須項目欠落でも success（partial 効果） | `{ ENVIRONMENT:"staging", AUTH_SECRET:"0123456789abcdef0123456789abcdef" }`（`PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` / `SENTRY_*` 全欠落） | `{ ENVIRONMENT:"staging", AUTH_SECRET:"..." }` を返す（throw しない）。`getEnv()` なら throw する入力でも `getAuthEnv()` は success することを対比で確認。 |
| E-07 | 空 rawEnv は `{}`                   | `{}`                                                                           | `{}`（`toEqual({})`）。fail-closed の最小ケース。 |
| E-08 | schema 外の余剰 key は落とす        | `{ ENVIRONMENT:"staging", FOO_BAR:"x", PUBLIC_API_BASE_URL:"https://api.example.com" }` | 戻り値に `FOO_BAR` を含まない。`PUBLIC_API_BASE_URL` も pick 対象外なので含まない。`ENVIRONMENT` のみ。 |
| E-09 | `AUTH_SECRET` が 16 文字未満なら schema fail → 空 | `{ ENVIRONMENT:"staging", AUTH_SECRET:"short" }`（`min(16)` 違反） | `{}`（safeParse 失敗で fail-closed）。`toEqual({})`。throw しない。 |

> **private/internal 関数のテスト方針**: `AuthEnvSchema`（`env.ts` 内 module-private const）と `readRawEnv()` /
> `readCloudflareEnv()` / `readProcessEnv()`（既存 export 関数）は**直接テストしない**。`getAuthEnv()` という
> 公開 API の振る舞い（入出力）を通じて間接的に網羅する（カプセル化を破らない・FB の private テスト禁止方針）。
> `readRawEnv()` の解決順（cloudflare → process → PLAYWRIGHT override）の確認は `auth.spec.ts` の mock 注入
> （`vi.mock("@opennextjs/cloudflare")`）経由の `default env()` ケースが担保する。

### 4.2 `getEnv()` / `getPublicEnv()` 既存挙動の回帰（env.spec.ts に同梱）

| ID   | 観点                          | 入力（rawEnv）                                                                                 | 期待値                                              |
| ---- | ----------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| E-10 | `getEnv()` は完全 env で success | staging vars 相当の完全セット（§4.3 の `validFullEnv`）                                          | `ENVIRONMENT:"staging"` 等を含む parse 成功値。`toMatchObject` で主要 key を確認。 |
| E-11 | `getEnv()` は必須欠落で throw   | `{ ENVIRONMENT:"staging" }`（`NEXT_PUBLIC_API_BASE_URL` 等欠落）                                | `expect(() => getEnv(...)).toThrow()`（ZodError）。`getAuthEnv()` との throw/no-throw の対比を固定。 |
| E-12 | `getPublicEnv()` は必須 2 key で success | `{ ENVIRONMENT:"staging", NEXT_PUBLIC_API_BASE_URL:"https://api.example.com" }`                  | `{ ENVIRONMENT:"staging", NEXT_PUBLIC_API_BASE_URL:"https://api.example.com" }`。 |

> E-10..E-12 は本タスクの schema 拡張（google 系 optional 4 key 追加）が既存 `getEnv()` / `getPublicEnv()` に
> 波及しないこと（optional 追加なので required 検証は不変）を固定する回帰ガード。

### 4.3 テストフィクスチャ（env.spec.ts 冒頭で定義する想定）

```ts
const stubFetch = (async () => new Response(null)) as unknown as typeof fetch;

// getEnv() が success する完全セット（staging wrangler.toml [vars] 相当 + secrets）
const validFullEnv = {
  ENVIRONMENT: "staging",
  NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
  PUBLIC_API_BASE_URL: "https://api.example.com",
  INTERNAL_API_BASE_URL: "https://api.example.com",
  AUTH_URL: "https://web.example.com",
  SENTRY_ENVIRONMENT: "staging",
  SENTRY_TRACES_SAMPLE_RATE: "0.2",
};
```

## 5. auth.spec.ts 回帰確認方針（Phase 4 では追記しない）

実装（Phase 5）後、`auth.spec.ts` の既存全ケースが green を維持することを確認する。特に下記 2 系統が
「`process.env` / `getCloudflareContext` 撤去後も `getAuthEnv()` 経由で同一挙動を保つ」ことの回帰ガードになる:

| 対象テスト（既存）                                          | 行       | 設計変更後に期待する挙動                                                                 |
| ----------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `default env() で fetchSessionResolve を呼んで env helper を経由する` | 186-190  | `env()` = `{ ...getAuthEnv(), ...globalEnv() }` → mock `getCloudflareContext` の `{env:{}}` → safeParse(`{}`) = `{}` → `INTERNAL_API_BASE_URL` undefined → `unregistered` を返す。 |
| `env / fetchImpl 全部 default で呼ぶと env() helper を経由して throw` | 596-599  | `env()` 経由でも `{}` 返却 → `buildProviders` の `missingProviderFactories.GoogleProvider` が throw（`/Auth providers must be loaded/`）。 |

> 既存 mock（`vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: () => cloudflareContext() }))`）は
> `env.ts` の `readCloudflareEnv()` に効くため、auth.ts が `getCloudflareContext` を import しなくなっても mock は
> 有効。`auth.spec.ts` の mock 定義・`resetEnv()` は**変更不要**（Phase 3 §3 で検証済み）。

## 6. ローカル実行・検証コマンド

```bash
# RED 確認（実装前）: getAuthEnv 未実装で env.spec.ts が fail することを確認
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/__tests__/env.spec.ts

# 実装後の green 確認（Phase 5 完了後）: env + auth をまとめて targeted run
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/auth.spec.ts

# 型チェック（getAuthEnv 未実装なら env.spec.ts の import が型エラー = RED）
mise exec -- pnpm typecheck
```

## 7. RED の合格基準（このフェーズで満たすべき状態）

- `env.spec.ts` が存在し、E-01..E-12 のケースを `it()` で列挙している。
- 実装前（`getAuthEnv` 未定義）の状態で `vitest run apps/web/src/lib/__tests__/env.spec.ts` が **fail する**（import / 型 /
  実行時エラーのいずれか）。これが RED の証跡。
- `auth.spec.ts` は無改変（このフェーズでは触らない）。

## 8. 完了条件（このPhaseの DoD）

- [ ] `env.spec.ts` の新規ケース表（E-01..E-09）を `getAuthEnv()` の入出力で定義した
- [ ] `getEnv()` / `getPublicEnv()` 回帰ケース（E-10..E-12）を併記した
- [ ] private 関数（`AuthEnvSchema` / `readRawEnv` 系）を直接テストしない方針を明記した
- [ ] auth.spec.ts は無改変で既存 2 系統が回帰ガードになることを明記した
- [ ] targeted vitest コマンド（RED / GREEN 両方）を記載した
- [ ] 新規 test ファイルが `*.spec.ts` 命名であることを確認した
