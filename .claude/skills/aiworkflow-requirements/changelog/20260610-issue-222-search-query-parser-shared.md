# 2026-06-10 issue-222-search-query-parser-shared

`issue-222-search-query-parser-shared` を `implemented_local_evidence_captured / refactoring / NON_VISUAL` として同期。

`@ubm-hyogo/shared/public-search` を新設し、公開メンバー検索 query 正規化規約（zone/status/sort/density 値集合、`TAG_LIMIT` / `Q_LIMIT` / `LIMIT_*`、q/tag/limit 正規化 helper）を packages/shared に SSOT 化した。`apps/api/src/_shared/search-query-parser.ts` と `apps/web/src/lib/url/members-search.ts` は shared import へ切替え、既存 parser/serializer の公開 shape と silent fallback 挙動を維持した。

issue #222 の古い AC-3「不正値は 400」は現コードの公開検索仕様（safe default / silent fallback）へ読み替えた。D1 schema / API endpoint surface / Google Form / UI pixels は不変。

検証: shared public-search spec 12 PASS、apps/api 回帰 30 PASS、apps/web 回帰 11 PASS、shared/api/web typecheck PASS、root lint PASS。commit / push / PR / Issue mutation は user-gated。
