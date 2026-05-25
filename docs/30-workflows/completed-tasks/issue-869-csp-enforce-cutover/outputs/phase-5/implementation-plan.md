# Phase 5: 実装計画

`[実装区分: 実装仕様書]` `[task_id: TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER]` `[spec_created]`

---

## 変更対象ファイル

| パス | 変更種別 | 概要 |
|------|---------|------|
| `apps/web/src/lib/env.ts` | 編集 | `EnvSchema` に `CSP_MODE` フィールド追加 + `getSecurityHeaderEnv()` アクセサ追加 |
| `apps/web/middleware.ts` | 編集 | `buildSecurityHeaderConfig()` を `getSecurityHeaderEnv()` 経由に切替（ハードコード除去） |
| `apps/web/wrangler.toml` | 編集 | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に `CSP_MODE` 追加 |
| `apps/web/src/lib/env.spec.ts` | 追記または新規 | `getSecurityHeaderEnv` の TC-01〜TC-04 追加 |
| `apps/web/playwright/tests/security-headers.spec.ts` | 編集 | CSP ヘッダ名を mode に追従する動的導出へ変更 + 反対ヘッダ absent アサーション追加 |

### 変更対象外ファイル（参照のみ）

| パス | 理由 |
|------|------|
| `apps/web/src/lib/security-headers.ts` | 実装済み（lib API 不変条件） |
| `apps/web/src/lib/security-headers.spec.ts` | 既存 enforce 単体テスト = 回帰ガード、変更禁止 |

---

## 変更 1: `apps/web/src/lib/env.ts`

### 実装手順

1. `EnvSchema` に `CSP_MODE` フィールドを追加する（既存フィールド末尾に配置）。
2. `SecurityHeaderEnvSchema` を `EnvSchema.pick()` で構成する。
3. `getSecurityHeaderEnv()` アクセサ関数を `export` で追加する。

### before（抜粋: EnvSchema）

```typescript
export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  // ... 既存フィールド ...
  AUTH_SECRET: z.string().min(16).optional(),
});
```

### after（抜粋: EnvSchema + 新規追加）

```typescript
export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  // ... 既存フィールド（変更なし） ...
  AUTH_SECRET: z.string().min(16).optional(),
  CSP_MODE: z.enum(["report-only", "enforce"]).default("report-only"),
});

// 新規追加: SecurityHeaderEnvSchema と getSecurityHeaderEnv
const SecurityHeaderEnvSchema = EnvSchema.pick({
  NEXT_PUBLIC_API_BASE_URL: true,
  CSP_MODE: true,
});

export function getSecurityHeaderEnv(
  rawEnv: RawEnv = readRawEnv(),
): { cspMode: "report-only" | "enforce"; apiBaseUrl: string } {
  const parsed = SecurityHeaderEnvSchema.parse(rawEnv);
  return {
    cspMode: parsed.CSP_MODE,
    apiBaseUrl: parsed.NEXT_PUBLIC_API_BASE_URL,
  };
}
```

### 注意事項

- `CSP_MODE` は `default("report-only")` を指定するため、wrangler.toml に未定義の環境でも安全にフォールバックする。
- `SecurityHeaderEnvSchema` は `EnvSchema.pick()` で構成し、`EnvSchema` とは独立した schema として定義する（個別 parse で最小 surface を保つ）。
- `getSecurityHeaderEnv` は `getEnv` / `getPublicEnv` と同じ `rawEnv: RawEnv = readRawEnv()` パターンを踏襲し、テスト時に rawEnv 引数注入で外部依存を排除できるようにする。
- `type RawEnv` は既存定義（`Record<string, unknown>`）をそのまま使用する。

---

## 変更 2: `apps/web/middleware.ts`

### 実装手順

1. `import { getPublicEnv } from "@/lib/env"` を削除し（当該ファイルで他用途なし）、`import { getSecurityHeaderEnv } from "@/lib/env"` へ差替える。
2. `buildSecurityHeaderConfig()` 内の `const env = getPublicEnv()` を `const env = getSecurityHeaderEnv()` へ変更する。
3. `cspMode: "report-only"` のハードコードを `cspMode: env.cspMode` へ変更する。
4. `apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL` を `apiBaseUrl: env.apiBaseUrl` へ変更する（`getSecurityHeaderEnv` の返却 shape に合わせる）。

### before（61行目付近 buildSecurityHeaderConfig）

```typescript
import { getPublicEnv } from "@/lib/env";
// ...

const buildSecurityHeaderConfig = (): SecurityHeaderConfig => {
  const env = getPublicEnv();
  return {
    cspMode: "report-only",           // ハードコード
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    authOrigin: "https://accounts.google.com",
  };
};
```

### after

```typescript
import { getSecurityHeaderEnv } from "@/lib/env";
// ...

const buildSecurityHeaderConfig = (): SecurityHeaderConfig => {
  const env = getSecurityHeaderEnv();
  return {
    cspMode: env.cspMode,             // env.ts 経由（wrangler.toml 制御）
    apiBaseUrl: env.apiBaseUrl,
    authOrigin: "https://accounts.google.com",
  };
};
```

### 注意事項

- `getPublicEnv` は当該ファイルで `buildSecurityHeaderConfig` にのみ使用されている。差替後は import 宣言ごと削除する（lint の no-unused-imports 違反防止）。
- `authOrigin: "https://accounts.google.com"` はハードコードのままとする（本タスクスコープ外）。
- `buildSecurityHeaderConfig` は `guardedMiddleware` から呼ばれる既存構造を変更しない。

---

## 変更 3: `apps/web/wrangler.toml`

### 実装手順

1. `[vars]`（production 兼用デフォルト）に `CSP_MODE = "report-only"` を追加する。
2. `[env.staging.vars]` に `CSP_MODE = "enforce"` を追加する。
3. `[env.production.vars]` に `CSP_MODE = "report-only"` を追加する。

### before（各 vars セクション）

```toml
[vars]
ENVIRONMENT = "production"
# CSP_MODE の記述なし

[env.staging.vars]
ENVIRONMENT = "staging"
# CSP_MODE の記述なし

[env.production.vars]
ENVIRONMENT = "production"
# CSP_MODE の記述なし
```

### after

```toml
[vars]
ENVIRONMENT = "production"
CSP_MODE = "report-only"

[env.staging.vars]
ENVIRONMENT = "staging"
CSP_MODE = "enforce"

[env.production.vars]
ENVIRONMENT = "production"
CSP_MODE = "report-only"
```

### 設計意図

| 環境 | 値 | 意図 |
|------|----|------|
| `[vars]`（local wrangler dev） | `"report-only"` | ローカル開発で enforce をデフォルトにせず安全側へ |
| `[env.staging.vars]` | `"enforce"` | staging で enforce の動作検証を継続的に実施 |
| `[env.production.vars]` | `"report-only"` | production への enforce 実切替は Phase 12 ops runbook で管理（本タスクでは report-only 維持） |

---

## 変更 4: `apps/web/src/lib/env.spec.ts`

### 実装手順

1. `ls apps/web/src/lib/env.spec.ts` で存在確認する。
2. 存在する場合は既存テストの末尾に `describe("getSecurityHeaderEnv", ...)` ブロックを追記する。存在しない場合は新規作成する。
3. TC-01〜TC-04 を rawEnv 引数注入で実装する。

### テストケース定義

```typescript
describe("getSecurityHeaderEnv", () => {
  // TC-01: CSP_MODE 未指定 → default "report-only"
  it("TC-01: CSP_MODE が未指定のとき default report-only を返す", () => {
    const result = getSecurityHeaderEnv({
      NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
    });
    expect(result.cspMode).toBe("report-only");
  });

  // TC-02: CSP_MODE = "enforce" → enforce を返す
  it("TC-02: CSP_MODE = enforce のとき enforce を返す", () => {
    const result = getSecurityHeaderEnv({
      NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
      CSP_MODE: "enforce",
    });
    expect(result.cspMode).toBe("enforce");
  });

  // TC-03: apiBaseUrl が NEXT_PUBLIC_API_BASE_URL の値と一致する
  it("TC-03: apiBaseUrl が NEXT_PUBLIC_API_BASE_URL を返す", () => {
    const result = getSecurityHeaderEnv({
      NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
    });
    expect(result.apiBaseUrl).toBe("https://api.example.com");
  });

  // TC-04: 不正値 → zod parse が throw する
  it("TC-04: CSP_MODE に不正値を渡すと throw する", () => {
    expect(() =>
      getSecurityHeaderEnv({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
        CSP_MODE: "invalid-value",
      })
    ).toThrow();
  });
});
```

---

## 変更 5: `apps/web/playwright/tests/security-headers.spec.ts`

### 実装手順

1. テストファイル冒頭に `expectedCspMode` / `cspHeaderName` / `oppositeHeaderName` を導出するロジックを追加する。
2. 全テストケース内の固定 `content-security-policy-report-only` 読み出しを `headers[cspHeaderName]` へ置換する。
3. 各テストに `expect(headers[oppositeHeaderName]).toBeUndefined()` アサーションを追加する。
4. connect-src テストも `headers[cspHeaderName]` を参照するよう変更する。

### before（先頭部分抜粋）

```typescript
import { expect, test } from "@playwright/test";

test.describe("security headers", () => {
  test("public top page emits CSP report-only and Permissions-Policy", async ({
    request,
  }) => {
    const res = await request.get("/");
    const headers = res.headers();

    expect(res.status()).toBe(200);
    expect(headers["content-security-policy-report-only"]).toBeTruthy();
    // ...
  });
```

### after（先頭部分抜粋）

```typescript
import { expect, test } from "@playwright/test";

const expectedCspMode =
  process.env.CSP_MODE === "enforce" ? "enforce" : "report-only";
const cspHeaderName =
  expectedCspMode === "enforce"
    ? "content-security-policy"
    : "content-security-policy-report-only";
const oppositeHeaderName =
  expectedCspMode === "enforce"
    ? "content-security-policy-report-only"
    : "content-security-policy";

test.describe("security headers", () => {
  test("public top page emits CSP report-only and Permissions-Policy", async ({
    request,
  }) => {
    const res = await request.get("/");
    const headers = res.headers();

    expect(res.status()).toBe(200);
    expect(headers[cspHeaderName]).toBeTruthy();
    expect(headers[oppositeHeaderName]).toBeUndefined();
    // ...
  });
```

### 変更対象テストケース一覧

| テスト名 | 変更内容 |
|---------|---------|
| `public top page emits CSP report-only and Permissions-Policy` | `content-security-policy-report-only` → `headers[cspHeaderName]` / `oppositeHeaderName` absent 追加 |
| `login page emits security headers` | 同上 |
| `admin redirect emits CSP report-only and Permissions-Policy` | 同上 |
| `admin redirect response also includes security headers` | 同上 |
| `CSP connect-src includes configured API base URL` | `content-security-policy-report-only` 直読み → `headers[cspHeaderName]` へ変更（TC-08） |

---

## 実装順序と依存関係

```
変更 1（env.ts）
  └─ 変更 2（middleware.ts）  ← getSecurityHeaderEnv に依存
  └─ 変更 4（env.spec.ts）   ← getSecurityHeaderEnv のテスト
変更 3（wrangler.toml）       ← 独立（env.ts と同時実施可能）
変更 5（playwright spec）     ← 独立（実装完了後に実行確認）
```

**推奨実施順**: 変更 1 → 変更 2 → 変更 3 → 変更 4 → 変更 5

---

## env アクセス不変条件チェック

| 確認項目 | 方針 |
|---------|------|
| `process.env.*` 直接参照の新規追加 | 禁止。`getSecurityHeaderEnv` / `getEnv` / `getPublicEnv` 経由のみ |
| `127.0.0.1:8888` の実装混入 | 禁止（task-18 grep gate で検出） |
| D1 direct access from apps/web | 変更なし（本タスクは middleware + env のみ） |
| `security-headers.ts` lib API 変更 | 禁止（lib API 不変条件） |

---

## ローカル検証コマンド

```bash
# 型チェック・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# unit test（env.spec.ts + security-headers.spec.ts）
mise exec -- pnpm --filter web test

# playwright: report-only モード（デフォルト）
mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts

# playwright: enforce モード（CSP_MODE 注入）
CSP_MODE=enforce mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts

# build
mise exec -- pnpm build
```

---

## DoD（Definition of Done）

- [ ] `CSP_MODE` schema（default report-only）追加・`getSecurityHeaderEnv` 追加・TC-01〜TC-04 green
- [ ] `middleware.ts` が `getSecurityHeaderEnv` 経由（`cspMode: "report-only"` ハードコード除去）
- [ ] `wrangler.toml` の `[vars]` = report-only / staging = enforce / production = report-only
- [ ] playwright smoke が mode 追従 + 反対ヘッダ absent（TC-07/TC-08 green）
- [ ] `typecheck` / `lint` / `build` green
- [ ] web vitest + playwright security-headers green（既存 enforce 単体テスト回帰なし）
- [ ] production enforce 実切替 = Phase 12 ops runbook（config-only）として文書化
