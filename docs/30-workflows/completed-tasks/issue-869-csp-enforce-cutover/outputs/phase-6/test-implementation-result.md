# Phase 6: テスト実装仕様（期待結果）

`[実装区分: テスト仕様書]` `[task_id: TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER]` `[spec_created]`

> 本 phase は「実施済み結果」ではなく、**実装時に満たすべき期待結果・手順**を定義する仕様書である。

---

## テストファイル一覧

| ファイル | テスト種別 | 対象ケース |
|---------|-----------|-----------|
| `apps/web/src/lib/env.spec.ts` | Vitest unit | TC-01〜TC-04（getSecurityHeaderEnv） |
| `apps/web/src/lib/security-headers.spec.ts` | Vitest unit | 既存 TC（enforce 回帰ガード）— 変更不要 |
| `apps/web/playwright/tests/security-headers.spec.ts` | Playwright smoke | TC-07（CSP mode 追従 + 反対ヘッダ absent）/ TC-08（connect-src） |

---

## TC-01〜TC-04: getSecurityHeaderEnv（env.spec.ts）

### 配置

`apps/web/src/lib/env.spec.ts` 内 `describe("getSecurityHeaderEnv", ...)` ブロックに追記する。

### TC-01: CSP_MODE 未指定 → default "report-only"

```typescript
it("TC-01: CSP_MODE が未指定のとき default report-only を返す", () => {
  const result = getSecurityHeaderEnv({
    NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
  });
  expect(result.cspMode).toBe("report-only");
});
```

**期待結果**: `result.cspMode === "report-only"` を満たすこと。

**根拠**: `CSP_MODE` フィールドに `z.enum(["report-only","enforce"]).default("report-only")` を指定するため、rawEnv 未定義時は zod default が適用される。

---

### TC-02: CSP_MODE = "enforce" → enforce を返す

```typescript
it("TC-02: CSP_MODE = enforce のとき enforce を返す", () => {
  const result = getSecurityHeaderEnv({
    NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
    CSP_MODE: "enforce",
  });
  expect(result.cspMode).toBe("enforce");
});
```

**期待結果**: `result.cspMode === "enforce"` を満たすこと。

**根拠**: staging 環境の `CSP_MODE = "enforce"` を読んだとき、enforce モードに切り替わることを確認する。

---

### TC-03: apiBaseUrl が NEXT_PUBLIC_API_BASE_URL の値と一致する

```typescript
it("TC-03: apiBaseUrl が NEXT_PUBLIC_API_BASE_URL を返す", () => {
  const result = getSecurityHeaderEnv({
    NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
  });
  expect(result.apiBaseUrl).toBe("https://api.example.com");
});
```

**期待結果**: `result.apiBaseUrl === "https://api.example.com"` を満たすこと。

**根拠**: middleware が `apiBaseUrl` を `connect-src` に使用するため、URL が正確に伝播することを確認する。

---

### TC-04: 不正値 → zod parse が throw する

```typescript
it("TC-04: CSP_MODE に不正値を渡すと throw する", () => {
  expect(() =>
    getSecurityHeaderEnv({
      NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
      CSP_MODE: "invalid-value",
    })
  ).toThrow();
});
```

**期待結果**: `toThrow()` アサーションを満たすこと（ZodError が throw される）。

**根拠**: `z.enum(["report-only","enforce"])` に定義外の文字列を渡すと zod が validation error を throw する。設定ミスを早期検出するための fail-fast 設計。

---

## falsy パターン網羅

`getSecurityHeaderEnv` の `CSP_MODE` 入力に対するフォールバック挙動は以下の通りであること。

| CSP_MODE 入力値 | 期待挙動 | 対応 TC |
|----------------|---------|--------|
| `undefined`（未設定） | `default("report-only")` が適用され `"report-only"` を返す | TC-01 |
| `""` (空文字) | zod enum validation fail → throw | TC-04 |
| `"invalid-value"` (不正文字列) | zod enum validation fail → throw | TC-04 |
| `"report-only"` | `"report-only"` を返す | TC-01 相当 |
| `"enforce"` | `"enforce"` を返す | TC-02 |

> TC-04 は代表的な不正値で実装する。空文字の挙動は同一 zod 経路のため、TC-04 で網羅できる。

---

## TC-05 / TC-06: middleware buildSecurityHeaderConfig（統合検証）

middleware は直接 unit テストせず、Phase 7 統合確認と playwright smoke（TC-07/TC-08）で代替する。ただし以下の期待を明示しておく。

| ケース | 期待 |
|-------|------|
| TC-05: `CSP_MODE=enforce` 注入時 | middleware が `cspMode: "enforce"` で `buildSecurityHeaders` を呼び、レスポンスに `Content-Security-Policy` ヘッダが付与されること |
| TC-06: `CSP_MODE` 未指定時 | middleware が `cspMode: "report-only"` で `buildSecurityHeaders` を呼び、レスポンスに `Content-Security-Policy-Report-Only` ヘッダが付与されること |

---

## TC-07: playwright CSP ヘッダ mode 追従 + 反対ヘッダ absent

**対象ファイル**: `apps/web/playwright/tests/security-headers.spec.ts`

**期待する変更後の動作**:

- `process.env.CSP_MODE === "enforce"` のとき:
  - `headers["content-security-policy"]` が truthy であること（TC-07）
  - `headers["content-security-policy-report-only"]` が `undefined` であること（TC-07 absent 検証）
- それ以外（デフォルト）のとき:
  - `headers["content-security-policy-report-only"]` が truthy であること（TC-07）
  - `headers["content-security-policy"]` が `undefined` であること（TC-07 absent 検証）

**対象エンドポイント**: `/`（top page）、`/login`、`/admin`（redirect, maxRedirects: 0）

---

## TC-08: connect-src API base URL

**対象ファイル**: `apps/web/playwright/tests/security-headers.spec.ts`

**期待する変更後の動作**:

- `headers[cspHeaderName]`（mode 追従）の値が `connect-src 'self' ...` を含むこと
- `connect-src` の値が `https?://[^ ]+ https://accounts.google.com` にマッチすること
- `require-trusted-types-for` を含まないこと（既存アサーション維持）

変更前は `headers["content-security-policy-report-only"]` を直接読んでいたが、変更後は `headers[cspHeaderName]` を参照する。enforce モード実行時でも同一アサーションが green を満たすこと。

---

## RED → GREEN 実施順序

1. **RED**: `env.spec.ts` に TC-01〜TC-04 を追記する（`getSecurityHeaderEnv` 未実装なら FAIL）。
2. **GREEN**: `env.ts` に `CSP_MODE` フィールドと `getSecurityHeaderEnv` を実装 → TC-01〜TC-04 PASS。
3. **middleware 修正**: `getPublicEnv` → `getSecurityHeaderEnv` 差替 → 型エラー解消確認。
4. **wrangler.toml 修正**: `CSP_MODE` 値追加。
5. **playwright spec 修正**: `cspHeaderName` / `oppositeHeaderName` 導出 + 全 test 置換。
6. **PLAYWRIGHT GREEN**: `pnpm --filter web exec playwright test security-headers.spec.ts` PASS。

---

## 実行コマンド

```bash
# Vitest unit（TC-01〜TC-04 + security-headers.spec.ts 回帰）
mise exec -- pnpm --filter web test

# Playwright smoke（TC-07/TC-08: report-only モード）
mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts

# Playwright smoke（TC-07/TC-08: enforce モード）
CSP_MODE=enforce mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts
```

---

## 合否基準

| テストグループ | 合否基準 |
|--------------|---------|
| TC-01〜TC-04（unit） | 全件 PASS であること |
| security-headers.spec.ts 既存テスト（回帰） | 変更前と同件数 PASS であること |
| TC-07/TC-08（playwright, report-only モード） | 全件 PASS であること |
| TC-07/TC-08（playwright, enforce モード `CSP_MODE=enforce`） | 全件 PASS であること |
