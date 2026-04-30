# documentation-changelog.md

| 日付 | 変更 | 理由 |
| --- | --- | --- |
| 2026-04-26 | 06a 仕様書 13 phase 構造作成 | application-implementation Wave 6 |
| 2026-04-29 | 06a phase 1〜12 outputs 完成 | 公開層 4 ルート実装 |
| 2026-04-29 | URL query zod schema を確定 (`apps/web/src/lib/url/members-search.ts`) | 不変条件 #8 |
| 2026-04-29 | density 値を `comfy/dense/list` に固定（`comfortable/compact` 不採用） | spec 用語統一 |
| 2026-04-29 | `/no-access` 不採用を再宣言（Register からは `/login` へ誘導） | 不変条件 #9 |
| 2026-04-29 | `apps/web/app/error.tsx` / `not-found.tsx` 追加 | error boundary 統一 |
| 2026-04-29 | `apps/web/src/lib/fetch/public.ts` で 04a 経由のみのデータ取得を強制 | 不変条件 #5 |
| 2026-04-29 | Phase 12 再検証で `q` max 200、root / outputs artifacts parity、index.md status、Phase 11 curl + screenshot evidence、未タスク 3 件を同期 | 30種思考法 + エレガント検証の漏れ是正 |
| 2026-04-29 | `09-ui-ux.md` に 06a 公開層コンポーネント契約、`12-search-tags.md` に tag / q 契約を追記 | 16-component-library.md 不在の矛盾解消 |

## 未実施項目（次回運用）

- 実 Workers + D1 local / staging smoke（`task-06a-followup-001-real-workers-d1-smoke.md`）
- ESLint custom rule の `apps/web/.eslintrc` への落とし込み
