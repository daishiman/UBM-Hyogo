# リンク健全性チェック（Phase 11 成果物）

## 実装ファイル存在確認

| ファイル | 行数 | 存在 |
| --- | --- | --- |
| `packages/shared/src/errors.ts` | 162 | ✅ |
| `packages/shared/src/retry.ts` | 135 | ✅ |
| `packages/shared/src/db/transaction.ts` | 85 | ✅ |
| `packages/shared/src/logging.ts` | 103 | ✅ |
| `packages/shared/src/index.ts` | 60 | ✅（barrel re-export）|
| `packages/shared/package.json` | – | ✅（subpath exports 4 件明示）|
| `apps/api/src/middleware/error-handler.ts` | 98 | ✅ |
| `apps/api/src/index.ts` | 60 | ✅（onError/notFound 配線）|
| `apps/web/app/lib/api-client.ts` | 74 | ✅ |

## outputs ファイル存在確認

| Phase | ファイル | 存在 |
| --- | --- | --- |
| 01 | requirements.md | ✅ |
| 01 | error-code-taxonomy-draft.md | ✅ |
| 02 | api-error-schema.md | ✅ |
| 02 | error-code-taxonomy.md | ✅ |
| 02 | error-handler-middleware-design.md | ✅ |
| 02 | retry-strategy-design.md | ✅ |
| 02 | d1-compensation-pattern.md | ✅ |
| 02 | structured-log-format.md | ✅ |
| 03 | design-review-report.md | ✅ |
| 03 | gate-decision.md | ✅ |
| 04 | test-design.md | ✅ |
| 04 | test-cases.md | ✅ |
| 04 | red-confirmation.md | ✅ |
| 05 | implementation-summary.md | ✅ |
| 05 | file-change-list.md | ✅ |
| 06 | edge-case-tests.md | ✅ |
| 06 | regression-guards.md | ✅ |
| 06 | security-leak-tests.md | ✅ |
| 07 | coverage-report.md | ✅ |
| 07 | coverage-matrix.md | ✅ |
| 08 | refactor-changes.md | ✅ |
| 08 | refactor-decision-table.md | ✅ |
| 09 | quality-report.md | ✅ |
| 09 | link-checklist.md | ✅ |
| 09 | type-check-report.md | ✅ |
| 10 | final-review-report.md | ✅ |
| 10 | ac-traceability-matrix.md | ✅ |
| 10 | minor-issues-list.md | ✅ |
| 11 | main.md | ✅ |
| 11 | manual-smoke-log.md（本フォルダ）| ✅ |
| 11 | link-checklist.md（本ファイル）| ✅ |
| 11 | screenshot-plan.json | ✅ |

## ドキュメント参照確認

| 参照先 | 状態 |
| --- | --- |
| `apps/api/docs/error-handling.md` | ✅ Phase 12で作成済み |
| `docs/30-workflows/ut-10-error-handling-standardization/index.md` | ✅ Phase 12で作成済み |
| `doc/00-getting-started-manual/specs/01-api-schema.md` | ✅ 存在（Phase 12 で error-handling.md から参照予定）|

## subpath import 解決確認

| import 文 | 解決 |
| --- | --- |
| `from "@ubm-hyogo/shared/errors"` | ✅ pnpm + tsc 双方で解決（typecheck PASS）|
| `from "@ubm-hyogo/shared/logging"` | ✅ 同上 |
| `from "@ubm-hyogo/shared/retry"` | （現状 consumer 未利用、UT-09 で利用予定）|
| `from "@ubm-hyogo/shared/db/transaction"` | （現状 consumer 未利用、後続タスクで利用予定）|

## リンク切れ検証結果

リンク切れ: **ゼロ**

Phase 12 再検証で `apps/api/docs/error-handling.md` と `index.md` の作成済みを確認した。

## Phase 12 への引き継ぎ

- 実装ファイル / outputs / subpath import すべて健全
- Phase 12 で作成する 2 ドキュメントへの参照箇所を outputs/phase-08, 10, 11 で記録済み
- Phase 12 完了時に `apps/api/docs/error-handling.md` 内の親 spec への相対パスを再検証する
