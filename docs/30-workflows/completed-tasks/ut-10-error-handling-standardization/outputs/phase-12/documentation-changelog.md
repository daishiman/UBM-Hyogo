# ドキュメント変更ログ（Phase 12 Task 12-3 成果物）

## 本 wave で実施した変更

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-27 | 新規 | `docs/30-workflows/ut-10-error-handling-standardization/phase-01.md` 〜 `phase-13.md` | UT-10 タスク仕様書 13 phase |
| 2026-04-27 | 新規 | `docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-01/` 〜 `phase-12/` | 全 Phase outputs |
| 2026-04-27 | 新規 | `apps/api/docs/error-handling.md` | 開発者向けエラーハンドリングガイド |
| 2026-04-27 | 新規 | `packages/shared/src/errors.ts` | `ApiError` 型・`UBM_ERROR_CODES`・`fromUnknown` |
| 2026-04-27 | 新規 | `packages/shared/src/retry.ts` | `withRetry`・`SHEETS_RETRY_PRESET`・abort/attempts log context |
| 2026-04-27 | 新規 | `packages/shared/src/db/transaction.ts` | `runWithCompensation` ヘルパ、DLQ失敗ログを共通 logger 経由へ統一 |
| 2026-04-27 | 新規 | `packages/shared/src/logging.ts` | `logError`/`logWarn`/`logInfo`/`logDebug`・`sanitize` |
| 2026-04-27 | 更新 | `packages/shared/src/index.ts` | error handling 4 group の barrel re-export |
| 2026-04-27 | 更新 | `packages/shared/package.json` | subpath exports 4 件追加 |
| 2026-04-27 | 新規 | `apps/api/src/middleware/error-handler.ts` | グローバルエラーハンドラ + notFoundHandler |
| 2026-04-27 | 更新 | `apps/api/src/index.ts` | `app.notFound(notFoundHandler)` + `app.onError(errorHandler)` 配線 |
| 2026-04-27 | 新規 | `apps/web/app/lib/api-client.ts` | `parseApiResponse` + `isApiErrorClientView` |
| 2026-04-27 | 更新 | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | UT-10 APIエラー標準入口追加 |
| 2026-04-27 | 新規 | `.claude/skills/aiworkflow-requirements/references/interfaces-shared.md` | `@ubm-hyogo/shared` 公開 API 契約追加 |
| 2026-04-27 | 新規 | `.claude/skills/aiworkflow-requirements/references/interfaces-api.md` | API / Web client エラー契約追加 |
| 2026-04-27 | 更新 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `generate-index.js` で再生成 |
| 2026-04-27 | 更新 | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `generate-index.js` で再生成 |
| 2026-04-27 | 更新 | `.claude/skills/aiworkflow-requirements/LOGS.md` | UT-10 close-out sync 追記 |
| 2026-04-27 | 更新 | `.claude/skills/aiworkflow-requirements/SKILL.md` | エラーハンドリング参照カテゴリ追加 |
| 2026-04-27 | 更新 | `.claude/skills/task-specification-creator/LOGS.md` | UT-10 close-out sync 追記 |
| 2026-04-27 | 更新 | `.claude/skills/task-specification-creator/SKILL.md` | NON_VISUAL Phase 11 運用例追加 |

## 変更統計

| 区分 | ファイル数 | 備考 |
| --- | --- | --- |
| 新規実装ファイル | 5 | shared 4 + API middleware + web API client |
| 更新実装ファイル | 3 | API配線、shared exports/package |
| 新規/更新ドキュメント | 10+ | Phase 12 outputs + 正本仕様 + skill logs |
| UIスクリーンショット | 0 | NON_VISUAL。`outputs/phase-11/screenshot-plan.json` に理由を保存 |

## Phase 13 PR 本文への引き継ぎ事項

- Phase 13 はユーザー承認なしでは実行しない。
- UI変更なし。スクリーンショット画像は N/A。
- ランタイム契約テストは vitest 未導入のため未タスク化済み。
- 既存 `/sync/manual` / `/sync/backfill` の problem+json 完全移行は UT-09 へ委譲。
