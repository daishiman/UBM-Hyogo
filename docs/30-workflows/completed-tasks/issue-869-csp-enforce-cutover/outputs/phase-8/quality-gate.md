# Phase 8: 品質ゲート仕様

`[実装区分: 品質ゲート仕様書]` `[task_id: TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER]` `[spec_created]`

> 本 phase は「実施済み判定」ではなく、**実装後に全ゲートが合格であることを確認するための仕様**を定義する。

---

## ゲート一覧

| Gate ID | Gate 名 | 判定基準 | 検証コマンド |
|---------|--------|---------|------------|
| G-01 | typecheck | 型エラー 0 件であること | `mise exec -- pnpm typecheck` |
| G-02 | lint | lint エラー 0 件（unused import を含む）であること | `mise exec -- pnpm lint` |
| G-03 | web vitest | TC-01〜TC-04 + 既存 security-headers テスト全件 PASS | `mise exec -- pnpm --filter web test` |
| G-04 | playwright security-headers | TC-07/TC-08（report-only + enforce）全件 PASS | 後述 |
| G-05 | build | OpenNext Workers bundle 生成エラー 0 件であること | `mise exec -- pnpm build` |
| G-06 | 127.0.0.1:8888 焼き込み検出 | 実装ファイルへの焼き込みが 0 件であること | `rg` コマンド（後述） |
| G-07 | env access 不変条件 | `process.env.*` 直接参照が新規追加されていないこと | grep（後述） |
| G-08 | lib API 不変確認 | `security-headers.ts` の public API シグネチャが変更されていないこと | 手動確認 |
| G-09 | design-token gate | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が追加されていないこと | 非該当（色変更なし） |
| G-10 | task-18 verify-pr-ready | `bash scripts/verify-pr-ready.sh` PASS | `bash scripts/verify-pr-ready.sh` |

---

## 各ゲートの詳細

### G-01: typecheck

```bash
mise exec -- pnpm typecheck
```

**期待結果**: 終了コード 0、stderr に TypeScript エラーなし。

**重点確認**:
- `getSecurityHeaderEnv` の返却型 `{ cspMode: "report-only" | "enforce"; apiBaseUrl: string }` が `SecurityHeaderConfig` の `cspMode` フィールドと型整合すること。
- `middleware.ts` で `env.cspMode` / `env.apiBaseUrl` プロパティアクセスが型エラーを起こさないこと。
- `SecurityHeaderEnvSchema` の `.pick()` が `EnvSchema` の型を正しく反映していること。

---

### G-02: lint

```bash
mise exec -- pnpm lint
```

**期待結果**: lint エラー 0 件。

**重点確認**:
- `middleware.ts` から `getPublicEnv` import を削除したこと（no-unused-imports 違反防止）。
- `env.ts` に追加した `SecurityHeaderEnvSchema` が `const` で宣言され、export 不要であること（内部 schema は export 不要）。

---

### G-03: web vitest

```bash
mise exec -- pnpm --filter web test
```

**期待結果**: 全 TC PASS。特に以下を確認する。

| TC | 期待 |
|----|------|
| TC-01 | `cspMode === "report-only"` （CSP_MODE 未指定時の default） |
| TC-02 | `cspMode === "enforce"` （CSP_MODE = "enforce" 注入時） |
| TC-03 | `apiBaseUrl === "https://api.example.com"` |
| TC-04 | 不正値で throw（ZodError） |
| 既存 security-headers.spec.ts | 変更前と同件数 PASS（回帰ガード） |

---

### G-04: playwright security-headers

```bash
# report-only モード
mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts

# enforce モード（CSP_MODE 注入）
CSP_MODE=enforce mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts
```

**期待結果**: 両モードで全テスト PASS。

| TC | モード | 期待 |
|----|-------|------|
| TC-07 | report-only | `headers["content-security-policy-report-only"]` が truthy かつ `headers["content-security-policy"]` が undefined |
| TC-07 | enforce | `headers["content-security-policy"]` が truthy かつ `headers["content-security-policy-report-only"]` が undefined |
| TC-08 | report-only | `headers["content-security-policy-report-only"]` が connect-src を含む |
| TC-08 | enforce | `headers["content-security-policy"]` が connect-src を含む |

---

### G-05: build

```bash
mise exec -- pnpm build
```

**期待結果**: 終了コード 0、`apps/web` OpenNext Workers bundle 生成成功。

**許容する既存警告（判定に影響しない）**:
- Next.js middleware deprecation 警告
- Prisma instrumentation 警告

---

### G-06: 127.0.0.1:8888 焼き込み検出

```bash
rg -n "127\.0\.0\.1:8888" apps/web/src apps/web/middleware.ts \
  -g '!*.spec.ts' \
  -g '!**/__tests__/**'
```

**期待結果**: マッチ 0 件（終了コード 1 = "not found" = OK）。

**根拠**: task-18 regression smoke の grep gate 要件。env 変数経由でのみ設定値を注入し、実装ファイルへの焼き込みを禁止する。

---

### G-07: env access 不変条件（process.env 直接参照チェック）

```bash
grep -rn "process\.env\." apps/web/src/lib/env.ts apps/web/middleware.ts \
  | grep -v "readProcessEnv\|typeof process"
```

**期待結果**: 本タスクの変更ファイル（`env.ts` / `middleware.ts`）に `process.env.*` 直接参照が新規追加されていないこと。

**合格基準**: `env.ts` 内の `readProcessEnv()` 内部実装は既存のため許容する。新規追加箇所に `process.env.*` が現れないこと。

---

### G-08: lib API 不変確認

`apps/web/src/lib/security-headers.ts` の以下 export が変更されていないことを確認する。

| export | 期待シグネチャ |
|--------|--------------|
| `SecurityHeaderMode` | `"report-only" \| "enforce"` |
| `SecurityHeaderConfig` | `{ cspMode: SecurityHeaderMode; apiBaseUrl: string; authOrigin: string }` |
| `buildCspDirective` | `(cfg: SecurityHeaderConfig) => string` |
| `buildSecurityHeaders` | `(cfg: SecurityHeaderConfig) => Headers` |
| `applySecurityHeaders` | `<T extends Response>(response: T, cfg: SecurityHeaderConfig) => T` |

**確認方法**: `apps/web/src/lib/security-headers.ts` の git diff を確認し、変更がないこと。

---

### G-09: design-token gate（非該当）

本タスクは `NON_VISUAL` であり、色・トークン変更を含まない。

| 確認項目 | 判定 |
|---------|------|
| HEX 直書き追加 | 非該当（色変更なし） |
| `bg-[#xxx]` / `text-[#xxx]` 追加 | 非該当（色変更なし） |
| `verify-design-tokens` CI gate | 本タスクの変更では fail しない |

---

### G-10: task-18 verify-pr-ready

```bash
bash scripts/verify-pr-ready.sh
```

**期待結果**: PASS。

内部で実行される gate:

| 内部 gate | 期待 |
|----------|------|
| `gate-metadata:validate` | `artifacts.json` の zod schema 検証 PASS |
| `verify:phase12-compliance` | Phase 12 canonical heading / Phase 11 evidence 表 / workflow root scan PASS |
| `indexes:rebuild` drift | drift なし |

---

## ゲート合否サマリーテンプレート（実装後に記入する）

実装完了後、以下テーブルに合否を記入すること。

| Gate ID | Gate 名 | 判定 |
|---------|--------|------|
| G-01 | typecheck | - |
| G-02 | lint | - |
| G-03 | web vitest | - |
| G-04 | playwright security-headers | - |
| G-05 | build | - |
| G-06 | 127.0.0.1:8888 焼き込み | - |
| G-07 | env access 不変条件 | - |
| G-08 | lib API 不変確認 | - |
| G-09 | design-token gate | 非該当 |
| G-10 | task-18 verify-pr-ready | - |

全 gate が PASS（または非該当）であることを確認してから Phase 9 へ進む。

---

## blocker 判定

| 状況 | 対応 |
|------|------|
| G-01 typecheck FAIL | 実装修正後に再実行。3 回修復試行で解消しない場合は実装仕様の誤りを疑い Phase 5 を再確認 |
| G-03 TC-04 FAIL（throw しない） | `CSP_MODE` の zod schema が `default()` のみで `enum` 制約がない可能性を確認 |
| G-04 FAIL（反対ヘッダが undefined にならない） | `buildSecurityHeaders` が両ヘッダを同時に付与していないかを確認（lib API は 1 つのみ付与する設計） |
| G-06 FAIL（8888 焼き込み） | 即座に修正必須（CI gate fail の原因になる） |
