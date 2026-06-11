# 2026-06-09: admin-schema-diff-review-resolve-ux

`docs/30-workflows/admin-schema-diff-review-resolve-ux/` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期。

`/admin/schema` の差分レビューで、カードのラベルクリック後に stableKey alias 割当フォームがパネル最下部へ出て因果が見えない問題を apps/web 表現層のみで解消した。`SchemaDiffPanel` のフォームをクリックした `schema-field-card` 直下へインライン展開し、`schemaReviewTerms.ts` に technical term -> plain Japanese の SSOT を追加、`SchemaReviewGuide` をページ冒頭へ配置した。`globals.css` は OKLch token / CSS vars のみで inline form・guide・glossary を追加。

focused Vitest 3 files / 36 tests PASS、`@ubm-hyogo/web` typecheck PASS、design-token verification PASS、`apps/api` diff 0。API / D1 / Google Form / endpoint surface / bulk resolve / rollback / undo / recompute / HTTP 202 retryable behavior は不変。authenticated staging screenshots、commit、push、PR は user-gated。
