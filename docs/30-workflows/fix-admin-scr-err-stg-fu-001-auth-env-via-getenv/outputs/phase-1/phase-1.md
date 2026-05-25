# Phase 1: 要件定義

[実装区分: 実装仕様書]

| 項目      | 値                                                                 |
| --------- | ------------------------------------------------------------------ |
| Task ID   | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV                         |
| Phase     | 1 / 13（要件定義）                                                |
| 依存       | なし                                                               |
| 成果物     | outputs/phase-1/phase-1.md                                         |
| タスク分類 | NON_VISUAL implementation task（env 参照経路の整流化）            |

## 1. 目的

`apps/web/src/lib/auth.ts` に残存する env 参照 3 経路混在（`process.env.*` 直接 / `getCloudflareContext().env` 直接 /
`globalThis` override）を、env 正本 `apps/web/src/lib/env.ts` 経由の単一経路に統一する。これにより CLAUDE.md
「apps/web env アクセス不変条件」を認証境界にも適用し、同型 regression（認証境界での silent fail / undefined 起点 crash）を
構造的に防止する。

## 2. P50 前提確認チェック

| 確認項目                              | 結果                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| current branch に実装が存在するか     | No。`auth.ts` は未修正（`process.env` / `getCloudflareContext` 直接参照が残存）                |
| upstream（dev/main）にマージ済みか     | No。`git log` 上 auth.ts の env 統一コミットは存在しない（親タスクは server-fetch.ts のみ）    |
| 前提タスク（依存）が完了済みか         | Yes。親 TASK-FIX-ADMIN-SCR-ERR-STG-001（PR #849/#877）で `getEnv()` パターンが server-fetch.ts に確立済 |

→ `implementation_mode: "new"`。Phase 5 は通常の実装（RED/GREEN）。

## 3. 現状コードの確定 inventory（grep 実測）

### 3.1 `apps/web/src/lib/auth.ts` の env 参照箇所

| 行    | コード                                                | 種別                       | AC 違反 |
| ----- | ----------------------------------------------------- | -------------------------- | ------- |
| 15    | `import { getCloudflareContext } from "@opennextjs/cloudflare";` | import            | AC-2    |
| 37-43 | `cloudflareEnv()` 内 `getCloudflareContext().env as AuthEnv`     | cloudflare context 直接   | AC-2    |
| 45-47 | `globalEnv()` 内 `globalThis.__UBM_AUTH_ENV__`                   | global override（保持）   | 対象外  |
| 56-69 | `processEnv()` 内 `process.env["..."]` × 9 key                  | process.env 直接          | AC-1    |
| 71-75 | `env()` = `{ ...processEnv(), ...globalEnv(), ...cloudflareEnv() }` | merge 関数             | -       |
| 77-101| `requestEnv()` 内 `request.headers.get("x-ubm-*")`              | header 注入（保持）       | 対象外  |

> `process.env` / `getCloudflareContext` の直接参照は計 2 種・実体は `processEnv()` と `cloudflareEnv()` の 2 関数に集約されている。

### 3.2 auth.ts が必要とする env キー（9 string + 1 binding）

```text
ENVIRONMENT, AUTH_SECRET, AUTH_URL,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET,
INTERNAL_API_BASE_URL, INTERNAL_AUTH_SECRET,
API_SERVICE  ← Fetcher service binding（string ではない。getEnv() では運べない）
```

### 3.3 `apps/web/src/lib/env.ts` の現状 `EnvSchema`

| key                                   | 定義 | 備考                      |
| ------------------------------------- | ---- | ------------------------- |
| ENVIRONMENT                           | ✅   | enum local/staging/production |
| NEXT_PUBLIC_API_BASE_URL              | ✅   | required url              |
| PUBLIC_API_BASE_URL                   | ✅   | required url              |
| INTERNAL_API_BASE_URL                 | ✅   | required url              |
| INTERNAL_AUTH_SECRET                  | ✅   | optional min1             |
| AUTH_URL                              | ✅   | required url              |
| AUTH_SECRET                           | ✅   | optional min16            |
| SENTRY_* / NEXT_PUBLIC_SENTRY_*       | ✅   | 一部 required             |
| **GOOGLE_CLIENT_ID**                  | ❌   | **未定義（AC-4 で追加）** |
| **GOOGLE_CLIENT_SECRET**              | ❌   | **未定義（AC-4 で追加）** |
| **AUTH_GOOGLE_ID**                    | ❌   | **未定義（AC-4 で追加）** |
| **AUTH_GOOGLE_SECRET**                | ❌   | **未定義（AC-4 で追加）** |

> `getEnv()` は `EnvSchema.parse()` で `NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL` / `AUTH_URL` /
> `ENVIRONMENT` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` を必須として扱い、欠落時に **throw** する。

### 3.4 依存ファイル

- `apps/web/src/lib/session.ts`: `getAuth()` を import。`getAuth()` の公開シグネチャは変えないため挙動変更なし。
- `apps/web/src/lib/auth.spec.ts`: `@opennextjs/cloudflare` を mock し、`cloudflareEnv` を介して env を注入。
  `default env()` 系テスト（`fetchSessionResolve("u@example.com")` / `buildAuthConfig()`）は env 欠落で graceful に
  `unregistered` / throw（provider factory）になることを前提とする。

## 4. 命名規則の確認

- `env.ts` の公開関数は camelCase + `get` prefix（`getEnv` / `getPublicEnv`）。新規アクセサは `getAuthEnv` とし命名一貫性を担保する。
- schema は PascalCase + `Schema` suffix（`EnvSchema` / `PublicEnvSchema`）。auth 用 partial schema を作る場合は `AuthEnvSchema`。
- env キーは `SCREAMING_SNAKE_CASE`（既存 `EnvSchema` と一致）。

## 5. 受け入れ条件（AC）— 明示列挙

- **AC-1**: `grep -n "process\.env" apps/web/src/lib/auth.ts` が 0 件。
- **AC-2**: `grep -n "getCloudflareContext" apps/web/src/lib/auth.ts` が 0 件（import 文含む）。
- **AC-3**: `auth.ts` の env 取得は `env.ts` 公開アクセサ `getAuthEnv()` 経由のみ。
- **AC-4**: `EnvSchema` に google 系 4 key を追加し、staging/production の `wrangler.toml` 値で `getAuthEnv()` の safeParse が成功。
- **AC-5**: `pnpm typecheck` / `pnpm lint` pass、`auth.spec.ts` 全ケース green。
- **AC-6**（user-gated）: staging `/login` → OAuth/Magic Link → `/admin` runtime smoke pass。
- **AC-7**: CLAUDE.md「apps/web env アクセス不変条件」と整合（grep gate + 設計記述）。
- **AC-8**: invariant #11（fail-closed）と graceful フォールバック挙動の回帰なし。

## 6. carry-over 確認

直近 5 コミット（`git log --oneline -5`）に auth.ts env 統一作業は含まれない（#877 は server-fetch、#886 は security headers）。
本タスクの新規作業 = auth 境界の env 経路統一であり、既存 commit と重複しない。

## 7. テスト対象ファイルの事前列挙（FB-UI-02-2）

メモリ制約下でも targeted run できるよう、対象テストを事前固定する:

```bash
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/auth.spec.ts apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/fetch/public.spec.ts
```

> `apps/web/src/lib/__tests__/env.spec.ts` が未存在の場合は Phase 4 で新規作成する（`getAuthEnv()` の safeParse partial 挙動を固定）。

## 8. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下を確認し、既存設計との整合性を確保すること。

| 参照資料         | パス                                                                     | 内容                          |
| ---------------- | ------------------------------------------------------------------------ | ----------------------------- |
| 認証設計正本     | `docs/00-getting-started-manual/specs/02-auth.md`                        | Auth.js + Google OAuth / Magic Link 設計 |
| env アクセス不変条件 | CLAUDE.md「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | getEnv 経由のみ・process.env 禁止 |
| 親 workflow      | `docs/30-workflows/fix-admin-server-components-render-error-stg/`         | server-fetch.ts での適用パターン |

## 9. 完了条件（このPhaseの DoD）

- [x] 現状 auth.ts の env 参照箇所を行番号付きで inventory 化した
- [x] EnvSchema の欠落 key（google 系 4 key）を特定した
- [x] `getEnv()` throw 設計 vs auth fail-closed の緊張を論点として固定した
- [x] AC-1〜AC-8 を明示列挙した
- [x] 命名規則（`getAuthEnv` / `AuthEnvSchema`）を確定した
