# 代替案比較

| 案 | 概要 | pros | cons | 採否 |
| --- | --- | --- | --- | --- |
| A. `process.env` 直接参照 | 既存の Next.js 既定 | 学習コスト 0 | Workers context の env が読めず焼き込み事故が再発 / secret 露出リスク | 不採用 |
| B. build-time bake-in | `next.config.ts` の `env` block で固定 | 静的に解決 | 本番値がビルド成果物に焼き付き、staging/production を同一 build で切替不能 | 不採用 |
| C. runtime injection only | `getCloudflareContext().env` のみ | Workers runtime で純度が高い | Node test / build で undefined になり test 不能 | 不採用 |
| **D. 二経路 + zod parse** | Workers 優先 → Node fallback → zod 検証 | 単一公開 API、Workers/Node 両対応、fail fast | 実装コスト中 | **採用** |

採用理由: AC-3 / AC-4 / AC-7 を同時に満たし、下流タスクが「`getEnv()` のみ参照」で grep gate（AC-6）も成立する。
