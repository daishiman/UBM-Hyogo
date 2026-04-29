# Phase 5 主成果物 — 実装ランブック サマリ

採用案 A の実装を 9 step に分解。詳細は `api-runbook.md` / `pseudocode.md`。

| step | 概要 | 不変条件 |
| --- | --- | --- |
| 1 | `_shared/public-filter.ts` 実装 | #2 / #11 |
| 2 | `_shared/search-query-parser.ts` 実装（zod safeParse + fallback + limit clamp） | AC-6 / AC-11 |
| 3 | `_shared/pagination.ts` 実装 | AC-11 |
| 4 | `_shared/visibility-filter.ts` 実装 | #1 / AC-3 |
| 5 | `view-models/public/*.ts` 4 ファイル（leak 二重チェック + zod parse fail close） | #2 / #3 / #11 |
| 6 | `use-cases/public/*.ts` 4 ファイル | #5 |
| 7 | `routes/public/*.ts` 4 handler + `index.ts`（Cache-Control 方針） | #10 |
| 8 | `apps/api/src/index.ts` で `app.route('/public', publicRouter)`、session middleware 不適用 | #5 / AC-9 |
| 9 | unit + contract + leak + authz + search test 全 pass まで | 全 AC |
