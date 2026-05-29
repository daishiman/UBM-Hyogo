# Phase 7 — カバレッジ

## 対象

`apps/web/src/lib/admin/server-fetch.ts` の以下分岐:

| 分岐 | カバー spec |
|------|------------|
| service-binding 採用(production) | ケース 1 |
| HTTP fallback (binding 未提供) | ケース 2 |
| test runtime fallback | ケース 3 |
| Playwright runtime fallback | ケース 4 |
| error path / body snippet | ケース 5 |
| POST + body 透過 | ケース 6 |
| 既存 fixture 早期 return 群 | 既存 spec で網羅(変更なし) |

## カバレッジ閾値

`vitest.config.ts` の coverage threshold(global 80% 等)を維持。本変更で coverage が下がる箇所はなし(新規分岐は新規 spec で 100% カバー)。

## CI gate

- `pnpm test` (apps/web vitest)
- `bash scripts/verify-pr-ready.sh`
- 既存 `verify-test-suffix` (`.spec.ts` のみ)
