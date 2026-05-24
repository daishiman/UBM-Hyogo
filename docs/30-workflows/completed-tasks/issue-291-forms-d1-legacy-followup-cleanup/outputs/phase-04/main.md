# Phase 4: テスト戦略 — Summary

docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として下記 6 種 scan command を gate として運用する。詳細は `regression-scan-commands.md` を参照。

1. stale current scan
2. conflict marker scan
3. backlink scan（3 物理 + 2 ledger fallback）
4. index drift（`pnpm indexes:rebuild` 前後）
5. Phase 12 readiness（`artifacts.json` の Phase 12 outputs 列）
6. backlog status（supersede annotation の存在）
