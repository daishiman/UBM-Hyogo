# Phase 7 — Quality Gates

| ID | Gate | 実行結果 |
|----|------|---------|
| G-01 | `pnpm --filter @ubm-hyogo/web typecheck` | ✅ exit 0 |
| G-02 | `pnpm --filter @ubm-hyogo/web lint` | ✅ exit 0 (tsc + eslint) |
| G-03 | adapter unit spec (8 cases) | ✅ 8 passed |
| G-04 | OKLch トークン正本性 (HEX 直書きなし) | ✅ 新規ファイルに HEX 直書きなし |
| G-05 | apps/api/ 無変更 | ✅ `git diff dev...HEAD -- apps/api/` 空 |
| G-06 | test suffix `*.spec.ts` 厳守 | ✅ |
| G-07 | NFR-04 既存 primitive props 不変 | ✅ ProfileHero / MemberTags / MemberDetailSections の props 変更なし |
| G-08 | NFR-08 adapter pure / no I/O | ✅ |
| G-09 | NFR-03 新規 endpoint 追加なし | ✅ |
| G-10 | stableKey literal lint | ✅ fixture は STABLE_KEY 定数経由 |
