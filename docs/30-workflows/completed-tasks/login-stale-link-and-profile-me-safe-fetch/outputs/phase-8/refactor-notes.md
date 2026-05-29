# Phase 8 成果物: リファクタリングノート

詳細は [../../phase-8.md](../../phase-8.md) を参照。

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| profile page `/me` fetch | bare try/throw | safeServerFetch + SectionError | render error 解消 |
| safe-redirect.ts | string-only boundary | unknown-safe boundary | object coerce 防御 |
| login-query.ts | value first を暗黙 string 扱い | first string のみ採用 | searchParams drift 防御 |
| login-redirect.ts | string signature | unknown-safe signature | URL generator public contract 防御 |
| login-state.ts | string signature | unknown-safe signature | client URL rewrite contract 防御 |

helper 抽象化は行わない（2 出現は許容）。
