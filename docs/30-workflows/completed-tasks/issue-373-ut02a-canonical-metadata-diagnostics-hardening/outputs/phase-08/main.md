# Phase 8: DRY 化 — 実行結果

## 共通化判断
- `canonicalizeMarkdown` / `sha256Hex` を `regenerate-static-manifest.mjs` に集約し `verify-static-manifest.mjs` から再利用（重複実装回避）
- logger は `apps/api/src/lib/logger.ts` の単一エントリで `logWarn` / `logInfo` / `logError` を提供。`builder.ts` / `metadata.ts` の双方が同じ import を使う
- 追加抽象化なし（YAGNI）。section title マップは regenerate スクリプトに 1 箇所のみ定義
