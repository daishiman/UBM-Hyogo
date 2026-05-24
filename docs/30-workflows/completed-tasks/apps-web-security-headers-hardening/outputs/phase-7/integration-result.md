# Phase 7: 統合結果

## 統合対象

| 対象 | 結果 |
|------|------|
| `apps/web/middleware.ts` | 全 route matcher へ拡張し、既存 admin/profile auth guard response と通常 response に security headers を適用 |
| `apps/web/src/lib/env.ts` | 変更なし。`NEXT_PUBLIC_API_BASE_URL` を `getPublicEnv()` 経由で使用 |
| OpenNext Workers | middleware 層の response header injection に集約し、`next.config.ts headers()` は採用しない |

## 依存関係整合

- `apps/web` から D1 直接アクセスは追加していない。
- `process.env` 直接参照は既存 `authSecret()` のまま。security headers は `getPublicEnv()` 経由。
- `127.0.0.1:8888` / `browsing-topics` / `require-trusted-types-for` は実装に追加していない。
