# workflow artifact inventory — issue-1089-backfill-impact-preview

| key | value |
| --- | --- |
| workflow root | `docs/30-workflows/issue-1089-backfill-impact-preview/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| issue | #1089 CLOSED |
| purpose | 全件 backfill（手動再取込）確定前に、破壊的な書き込みの影響を実 response 件数で提示する。`POST /admin/sync/responses?dryRun=true&fullSync=true` の read-only count-only 経路と `ManualFormResyncPanel` の staged preview → confirm UI を追加する |
| implementation targets | `apps/api/src/jobs/sync-forms-responses.ts`（`ResponseSyncPreview` + `previewResponseSync`）, `apps/api/src/routes/admin/responses-sync.ts`（`?dryRun=true` preview 分岐）, `apps/web/src/features/admin/diagnostics/manual-sync.ts`（`SyncPreviewResultSchema` + `SyncPreviewRunResponseSchema`）, `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`（staged dry-run preview UI + `canBackfill` gate）, `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`, `apps/api/src/routes/admin/responses-sync.contract.spec.ts`, `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx`, `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` |
| invariant | 既存 `?fullSync` run 経路と `SyncResultSchema` は不変。dry-run は read-only で sync lock / `sync_jobs` ledger / D1 write / `processResponse` を実行しない。apps/web は zod 再宣言のみで apps/api を直接 import しない。新 endpoint / D1 schema / Google Form schema 変更なし |
| reference pattern | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` + `apps/web/src/features/admin/diagnostics/backfill.ts` + `apps/api/src/routes/admin/sync-backfill-publish-state.ts` の `?dryRun=true|false` staged dry-run pattern |
| local evidence | focused tests 4 files / 71 tests PASS（apps/api 2 files / 40: `sync-forms-responses.contract` 30 + `responses-sync.contract` 10; apps/web 2 files / 31: `ManualFormResyncPanel` 13 + `sync-schemas` 18）; web/api typecheck PASS; lint PASS; HEX 直書きなし; verify:phase12-compliance PASS（ok:true / ancestor:false）; gate-metadata ERROR 0 |
| runtime boundary | `SYNC_ADMIN_TOKEN` Cloudflare Secrets 投入、authenticated runtime screenshot、staging deploy、commit、push、PR は user-gated |

## Notes

- dry-run 応答は `{ ok:true, preview:{ status:"preview", dryRun:true, responseCount, estimatedWrites, pagesScanned, capped } }`。`responseCount` は Google Forms `forms.responses.list` の実カウント（AC-2）であり UI 推定値ではない。`estimatedWrites` は推定として明示ラベルする。
- `previewResponseSync` は `runResponseSync` と Forms API 取得ロジックを共有しつつ、`processResponse` / D1 write / lock / ledger を呼ばない count-only 経路。
- `ManualFormResyncPanel` は preview 実行 → 件数パネル表示 → `canBackfill` gate 経由で初めて破壊的全件 backfill confirm（`globalThis.confirm` に実件数を埋め込む）に進む staged flow。D7 再判断（DD3）でカスタムダイアログは導入せず `globalThis.confirm` を維持。

## Lessons Learned

- **L-I1089-001**: 既存 API への opt-in query（`?dryRun=true`）追加は、`apps/api` 実装・route 契約・`apps/web` zod 再宣言・API 正本（`references/api-endpoints.md`）・skill changelog を同一 wave で同期する。片方（実装のみ／正本のみ）に留めると drift する。
- **L-I1089-002**: 破壊的 mutation の preview は「実カウント（read-only 取得）」と「推定書き込み数」を語彙レベルで分離し、UI・仕様書・テストで同じ語（`responseCount` = 実数 / `estimatedWrites` = 推定）に揃える。
- **L-I1089-003**: VISUAL かつ admin 認証必須（`SYNC_ADMIN_TOKEN`）の workflow は、authenticated runtime screenshot を user-gated pending とし、static UI contract PNG + jsdom UI/schema/backend contract tests を主証跡にする二段証跡で close-out する。
- **L-I1089-004**: dry-run の read-only 不変条件（lock / ledger / D1 write / `processResponse` を呼ばない）は backend contract test で明示的に守る。preview 経路が副作用を持たないことをテストで固定しないと、後続改修で書き込みが混入しても検知できない。
