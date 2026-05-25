# Phase 7: 統合仕様（結線確認手順）

`[実装区分: 統合仕様書]` `[task_id: TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER]` `[spec_created]`

> 本 phase は「実施済み結果」ではなく、**実装時に確認すべき統合手順と期待状態**を定義する仕様書である。

---

## 統合対象

| レイヤー | 変更 | 期待する統合状態 |
|---------|------|----------------|
| `apps/web/src/lib/env.ts` | `CSP_MODE` フィールド追加 + `getSecurityHeaderEnv` 追加 | zod parse が正常終了し、`cspMode` / `apiBaseUrl` を返す |
| `apps/web/middleware.ts` | `getPublicEnv` → `getSecurityHeaderEnv` 差替 | `buildSecurityHeaderConfig` が env.ts の値を反映する |
| `apps/web/src/lib/security-headers.ts` | 変更なし（lib API 不変） | `buildSecurityHeaders(cfg)` が `cfg.cspMode` に従いヘッダ名を切り替える |
| `apps/web/wrangler.toml` | `CSP_MODE` 追加 | 各 env で異なる mode を返す |

---

## データフロー図

```
wrangler.toml [vars]
  CSP_MODE = "report-only" / "enforce"
        │
        ▼
  readRawEnv()  ← Cloudflare context env or process.env
        │
        ▼
  getSecurityHeaderEnv(rawEnv)
    ├─ parsed.CSP_MODE  → cspMode: "report-only" | "enforce"
    └─ parsed.NEXT_PUBLIC_API_BASE_URL → apiBaseUrl: string
        │
        ▼
  buildSecurityHeaderConfig() in middleware.ts
    ├─ cspMode: env.cspMode
    ├─ apiBaseUrl: env.apiBaseUrl
    └─ authOrigin: "https://accounts.google.com"
        │
        ▼
  applySecurityHeaders(response, cfg)
    │   ↑ calls buildSecurityHeaders(cfg)
    │       → CSP header name = cfg.cspMode === "enforce"
    │                           ? "Content-Security-Policy"
    │                           : "Content-Security-Policy-Report-Only"
        │
        ▼
  HTTP Response header
    ├─ Content-Security-Policy（enforce 時）
    │    または
    ├─ Content-Security-Policy-Report-Only（report-only 時）
    ├─ Permissions-Policy
    ├─ Referrer-Policy
    ├─ X-Content-Type-Options
    └─ X-Frame-Options
```

---

## 環境別 CSP_MODE 解決パス

### ローカル開発（wrangler dev / pnpm dev）

- `wrangler.toml [vars]` の `CSP_MODE = "report-only"` が適用される。
- `readRawEnv()` は `getCloudflareContext()` 経由で wrangler.toml vars を返す。
- 結果: `cspMode = "report-only"` → `Content-Security-Policy-Report-Only` ヘッダが付与される。

### staging（`[env.staging.vars]`）

- `CSP_MODE = "enforce"` が適用される。
- Cloudflare Workers ランタイムで `getCloudflareContext().env.CSP_MODE` が `"enforce"` を返す。
- 結果: `cspMode = "enforce"` → `Content-Security-Policy` ヘッダが付与される（enforce）。

### production（`[env.production.vars]`）

- `CSP_MODE = "report-only"` が適用される。
- 結果: `cspMode = "report-only"` → `Content-Security-Policy-Report-Only` ヘッダが付与される。
- production への enforce 実切替は Phase 12 ops runbook に委ねる（本タスクでは変更しない）。

---

## OpenNext Workers ランタイムとの整合

| 観点 | 期待状態 |
|------|---------|
| `getCloudflareContext()` 経由の env 取得 | `readCloudflareEnv()` が Workers binding の env を返し、`getSecurityHeaderEnv` の `rawEnv` 引数として使用される |
| OpenNext bundle の `[project]/...` module specifier | `getSecurityHeaderEnv` は `apps/web/src/lib/env.ts` に閉じているため、Turbopack 依存の仮想 module specifier を含まない |
| next.config.ts の `headers()` との競合 | middleware 層でのヘッダ注入を採用し、`next.config.ts headers()` は使用しない（既存方針継続） |

---

## PLAYWRIGHT_TEST=1 時の process.env override との整合

`env.ts` の `readRawEnv()` には以下のロジックが存在する。

```typescript
if (readProcessEnv()["PLAYWRIGHT_TEST"] === "1") {
  return { ...cloudflareEnv, ...readProcessEnv() };
}
```

このロジックにより、playwright 実行時は `process.env` の値が cloudflare context を上書きする。

**CSP_MODE の playwright 実行時挙動**:

| 状況 | `CSP_MODE` の解決元 | 結果 |
|------|---------------------|------|
| `PLAYWRIGHT_TEST=1` かつ `CSP_MODE=enforce` 注入 | `process.env` が優先される | `cspMode = "enforce"` |
| `PLAYWRIGHT_TEST=1` かつ `CSP_MODE` 未注入 | cloudflare env（wrangler.toml）が使われる | `cspMode = "report-only"` |
| 本番 Workers ランタイム | cloudflare env のみ（`process.env` に config なし） | wrangler.toml の値が適用される |

この既存ロジックを活用することで、playwright の `CSP_MODE=enforce` 注入テストが意図通り動作する。**`readRawEnv()` の変更は不要**。

---

## 依存関係の整合確認

| 確認項目 | 期待状態 |
|---------|---------|
| `apps/web` から D1 直接アクセス | 本変更で追加しない（既存条件維持） |
| `process.env.*` 直接参照の新規追加 | `getSecurityHeaderEnv` 経由のみ（`process.env` 直接参照なし） |
| `127.0.0.1:8888` の実装混入 | 本変更で追加しない（task-18 grep gate で検証） |
| `security-headers.ts` lib API | 変更なし（`buildSecurityHeaders` / `applySecurityHeaders` / `SecurityHeaderConfig` 型を不変とする） |
| `getPublicEnv` の残存参照（middleware.ts） | `getPublicEnv` import を削除し、`getSecurityHeaderEnv` に完全移行する |

---

## 統合確認コマンド

```bash
# 1. 型チェック（import 差替後の型整合確認）
mise exec -- pnpm typecheck

# 2. lint（unused import 除去確認）
mise exec -- pnpm lint

# 3. unit test（TC-01〜TC-04 + security-headers.spec.ts 回帰）
mise exec -- pnpm --filter web test

# 4. ローカルビルド（OpenNext bundle 生成確認）
mise exec -- pnpm build

# 5. playwright smoke（report-only モード）
mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts

# 6. playwright smoke（enforce モード）
CSP_MODE=enforce mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts

# 7. regression literal guard
rg -n "127\.0\.0\.1:8888" apps/web/src apps/web/middleware.ts \
  -g '!*.spec.ts' -g '!**/__tests__/**' \
  && echo "WARN: 8888 hardcode found" || echo "OK: no 8888 hardcode"
```

---

## 統合成功の判定基準

実装後に以下をすべて満たすこと:

- [ ] `pnpm typecheck` PASS（型エラー 0 件）
- [ ] `pnpm lint` PASS（unused import エラー 0 件）
- [ ] `pnpm --filter web test` PASS（TC-01〜TC-04 green + security-headers 既存回帰 green）
- [ ] `pnpm build` PASS（OpenNext bundle エラーなし）
- [ ] playwright security-headers.spec.ts PASS（report-only モード・全テスト green）
- [ ] `CSP_MODE=enforce` 注入時の playwright PASS（enforce モード・TC-07/TC-08 green）
- [ ] `127.0.0.1:8888` の実装混入がないこと
- [ ] `getPublicEnv` の middleware.ts import が削除されていること
