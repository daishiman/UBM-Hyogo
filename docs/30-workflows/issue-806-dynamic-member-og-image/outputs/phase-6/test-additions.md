# Phase 6 成果物: テスト追加

## チェックリスト

- [x] route handler の `image/png` response / member content / 404 / error path
- [x] 正常 path: member 存在時に image/png Response
- [x] 404 path: `FetchPublicNotFoundError` → `notFound()`
- [x] 例外 path: 非 404 error rethrow
- [x] Playwright: member-specific og:image / PNG 応答 / 404

## 実行結果

```
✓ apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx (4 tests) 5ms
```

Vitest 全 100 ファイル / 704 tests PASS（1 skipped 既存）。
